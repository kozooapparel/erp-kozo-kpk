import { NextRequest, NextResponse } from 'next/server'
import { getDownloadUrl, headObject, isObjectNotFound } from '@/lib/storage/r2'
import { getFileForTenant, markFileStatus } from '@/lib/storage/files'
import { requireTenantContext } from '@/lib/storage/tenant'

export const runtime = 'nodejs'

function message(error: unknown) {
    return error instanceof Error ? error.message : 'Download could not be prepared'
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ fileId: string }> }) {
    try {
        const { tenantId } = await requireTenantContext()
        const { fileId } = await params
        const file = await getFileForTenant(tenantId, fileId)
        if (file.status !== 'ready') return NextResponse.json({ error: 'File is not available' }, { status: 404 })

        try {
            await headObject(tenantId, file.storageKey)
        } catch (error) {
            if (isObjectNotFound(error)) {
                await markFileStatus(tenantId, file.id, 'missing')
                return NextResponse.json({ error: 'File no longer exists in R2; metadata has been synchronized' }, { status: 404 })
            }
            throw error
        }

        const disposition = request.nextUrl.searchParams.get('disposition') === 'inline' ? 'inline' : 'attachment'
        const url = await getDownloadUrl(tenantId, file.storageKey, file.originalName, disposition)
        return NextResponse.json({ url, expiresIn: 300 })
    } catch (error) {
        return NextResponse.json({ error: message(error) }, { status: 400 })
    }
}
