import 'server-only'

import { randomUUID } from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import type { StorageFile, StorageSummary } from './types'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function validUuid(value: unknown, name: string): string {
    if (typeof value !== 'string' || !UUID_PATTERN.test(value)) throw new Error(`${name} is not valid`)
    return value
}

function safeFilename(value: unknown): string {
    if (typeof value !== 'string' || !value.trim()) throw new Error('File name is required')
    const filename = value.trim().replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_').slice(0, 180)
    if (!filename) throw new Error('File name is not valid')
    return filename
}

function mapFile(row: Record<string, unknown>): StorageFile & { orderLabel: string | null } {
    const order = row.order as { id?: string; nama_po?: string | null } | null
    return {
        id: row.id as string,
        tenantId: row.tenant_id as string,
        brandId: row.brand_id as string,
        orderId: row.order_id as string | null,
        storageKey: row.storage_key as string,
        originalName: row.original_name as string,
        contentType: row.content_type as string | null,
        sizeBytes: Number(row.size_bytes),
        status: row.status as StorageFile['status'],
        uploadedAt: row.uploaded_at as string | null,
        createdAt: row.created_at as string,
        orderLabel: order?.nama_po || order?.id || null,
    }
}

export async function assertFileTarget(tenantId: string, brandId: unknown, orderId: unknown) {
    const safeBrandId = validUuid(brandId, 'Brand ID')
    const safeOrderId = validUuid(orderId, 'Order ID')
    const admin = createAdminClient()
    const [{ data: brand }, { data: order }] = await Promise.all([
        admin.from('brands').select('id').eq('id', safeBrandId).eq('tenant_id', tenantId).maybeSingle(),
        admin.from('orders').select('id, brand_id').eq('id', safeOrderId).eq('tenant_id', tenantId).maybeSingle(),
    ])
    if (!brand || !order || order.brand_id !== safeBrandId) {
        throw new Error('Brand and order must belong to the active tenant')
    }
    return { brandId: safeBrandId, orderId: safeOrderId }
}

export function createLayoutStorageKey(tenantId: string, brandId: string, orderId: string, filename: unknown): { key: string; originalName: string } {
    const originalName = safeFilename(filename)
    const extension = originalName.includes('.') ? `.${originalName.split('.').pop()!.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 12)}` : ''
    return {
        // Tenant is deliberately included even though buckets are tenant-owned:
        // it prevents accidental key collisions during a bucket migration.
        key: `tenants/${tenantId}/brands/${brandId}/orders/${orderId}/layout/${randomUUID()}${extension}`,
        originalName,
    }
}

export async function createUploadingFile(input: {
    tenantId: string
    userId: string
    brandId: string
    orderId: string
    key: string
    originalName: string
    contentType: string | null
    sizeBytes: number
    uploadId: string
}) {
    const { data, error } = await createAdminClient().from('r2_files').insert({
        tenant_id: input.tenantId,
        brand_id: input.brandId,
        order_id: input.orderId,
        storage_key: input.key,
        original_name: input.originalName,
        content_type: input.contentType,
        size_bytes: input.sizeBytes,
        multipart_upload_id: input.uploadId,
        status: 'uploading',
        uploaded_by: input.userId,
    }).select('*').single()
    if (error || !data) throw new Error('Failed to create file metadata')
    return mapFile(data as Record<string, unknown>)
}

export async function getFileForTenant(tenantId: string, fileId: unknown) {
    const id = validUuid(fileId, 'File ID')
    const { data, error } = await createAdminClient().from('r2_files')
        .select('*, order:orders(id, nama_po)')
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .single()
    if (error || !data) throw new Error('File not found')
    return {
        ...mapFile(data as Record<string, unknown>),
        multipartUploadId: (data as { multipart_upload_id?: string | null }).multipart_upload_id || null,
    }
}

export async function getUploadForTenant(tenantId: string, fileId: unknown) {
    const id = validUuid(fileId, 'File ID')
    const { data, error } = await createAdminClient().from('r2_files')
        .select('id, tenant_id, storage_key, multipart_upload_id, status, size_bytes')
        .eq('id', id).eq('tenant_id', tenantId).single()
    if (error || !data) throw new Error('Upload not found')
    if (data.status !== 'uploading' || !data.multipart_upload_id) throw new Error('Upload is not active')
    return data as { id: string; tenant_id: string; storage_key: string; multipart_upload_id: string; status: string; size_bytes: number }
}

export async function listFilesForTenant(tenantId: string) {
    const { data, error } = await createAdminClient().from('r2_files')
        .select('*, order:orders(id, nama_po)')
        .eq('tenant_id', tenantId)
        .neq('status', 'deleted')
        .order('created_at', { ascending: false })
        .limit(200)
    if (error) throw new Error('Failed to list storage files')
    return (data || []).map((row) => mapFile(row as Record<string, unknown>))
}

export async function listFilesForOrder(tenantId: string, orderId: string) {
    const { data, error } = await createAdminClient().from('r2_files')
        .select('*, order:orders(id, nama_po)')
        .eq('tenant_id', tenantId)
        .eq('order_id', orderId)
        .neq('status', 'deleted')
        .order('created_at', { ascending: false })
    if (error) throw new Error('Failed to list order files')
    return (data || []).map((row) => mapFile(row as Record<string, unknown>))
}

export async function getStorageSummary(tenantId: string): Promise<StorageSummary> {
    const { data, error } = await createAdminClient().rpc('r2_storage_summary', { p_tenant_id: tenantId })
    if (error) throw new Error('Failed to read storage usage')
    const row = Array.isArray(data) ? data[0] : null
    return { usedBytes: Number(row?.used_bytes || 0), fileCount: Number(row?.file_count || 0) }
}

export async function completeFileMetadata(tenantId: string, fileId: string, eTag?: string, versionId?: string) {
    const { data, error } = await createAdminClient().from('r2_files').update({
        status: 'ready',
        e_tag: eTag || null,
        r2_version_id: versionId || null,
        multipart_upload_id: null,
        uploaded_at: new Date().toISOString(),
    }).eq('id', fileId).eq('tenant_id', tenantId).eq('status', 'uploading').select('*').maybeSingle()
    if (error || !data) {
        // An update with no matching row is not an acceptable successful upload:
        // it leaves the R2 object unreachable from the application.
        throw new Error('Failed to finalize file metadata')
    }
    return mapFile(data as Record<string, unknown>)
}

export async function markFileStatus(tenantId: string, fileId: string, status: 'missing' | 'deleted' | 'failed') {
    const update: Record<string, unknown> = { status, multipart_upload_id: null }
    if (status === 'deleted') update.deleted_at = new Date().toISOString()
    const { error } = await createAdminClient().from('r2_files').update(update).eq('id', fileId).eq('tenant_id', tenantId)
    if (error) throw new Error('Failed to update file metadata')
}
