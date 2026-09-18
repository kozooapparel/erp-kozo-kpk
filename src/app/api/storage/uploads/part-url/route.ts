import { NextRequest, NextResponse } from 'next/server'
import { getUploadPartUrl } from '@/lib/storage/r2'
import { getUploadForTenant } from '@/lib/storage/files'
import { requireTenantContext } from '@/lib/storage/tenant'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
    try {
        const { tenantId } = await requireTenantContext()
        const body = await request.json()
        const partNumber = Number(body.partNumber)
        if (!Number.isInteger(partNumber) || partNumber < 1 || partNumber > 10_000) throw new Error('Part number is not valid')
        const upload = await getUploadForTenant(tenantId, body.fileId)
        const url = await getUploadPartUrl(tenantId, upload.storage_key, upload.multipart_upload_id, partNumber)
        return NextResponse.json({ url })
    } catch (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not prepare upload part' }, { status: 400 })
    }
}
