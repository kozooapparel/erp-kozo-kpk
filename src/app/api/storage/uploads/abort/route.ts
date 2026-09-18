import { NextRequest, NextResponse } from 'next/server'
import { abortMultipartUpload } from '@/lib/storage/r2'
import { getUploadForTenant, markFileStatus } from '@/lib/storage/files'
import { requireTenantContext } from '@/lib/storage/tenant'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
    try {
        const { tenantId } = await requireTenantContext()
        const { fileId } = await request.json()
        const upload = await getUploadForTenant(tenantId, fileId)
        await abortMultipartUpload(tenantId, upload.storage_key, upload.multipart_upload_id)
        await markFileStatus(tenantId, upload.id, 'failed')
        return NextResponse.json({ ok: true })
    } catch (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not abort upload' }, { status: 400 })
    }
}
