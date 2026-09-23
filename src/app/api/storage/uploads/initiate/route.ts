import { NextRequest, NextResponse } from 'next/server'
import { DEFAULT_PART_SIZE, abortMultipartUpload, createMultipartUpload } from '@/lib/storage/r2'
import { assertFileTarget, createLayoutStorageKey, createUploadingFile } from '@/lib/storage/files'
import { requireTenantContext } from '@/lib/storage/tenant'

export const runtime = 'nodejs'

function message(error: unknown) {
    return error instanceof Error ? error.message : 'Could not start upload'
}

export async function POST(request: NextRequest) {
    try {
        const context = await requireTenantContext()
        const body = await request.json()
        const sizeBytes = Number(body.sizeBytes)
        if (!Number.isSafeInteger(sizeBytes) || sizeBytes < 0) throw new Error('File size is not valid')
        const { brandId, orderId } = await assertFileTarget(context.tenantId, body.brandId, body.orderId)
        const { key, originalName } = createLayoutStorageKey(context.tenantId, brandId, orderId, body.fileName)
        const contentType = typeof body.contentType === 'string' && body.contentType.length <= 255 ? body.contentType : null
        const multipart = await createMultipartUpload(context.tenantId, key, contentType || undefined)
        if (!multipart.UploadId) throw new Error('R2 did not return an upload ID')

        try {
            const file = await createUploadingFile({
                tenantId: context.tenantId,
                userId: context.userId,
                brandId,
                orderId,
                key,
                originalName,
                contentType,
                sizeBytes,
                uploadId: multipart.UploadId,
            })
            return NextResponse.json({ fileId: file.id, partSize: DEFAULT_PART_SIZE })
        } catch (error) {
            await abortMultipartUpload(context.tenantId, key, multipart.UploadId).catch(() => undefined)
            throw error
        }
    } catch (error) {
        return NextResponse.json({ error: message(error) }, { status: 400 })
    }
}
