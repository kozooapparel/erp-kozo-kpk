import { NextRequest, NextResponse } from 'next/server'
import { deleteObject, isObjectNotFound } from '@/lib/storage/r2'
import { assertFileTarget, getFileForTenant, getStorageSummary, listFilesForOrder, listFilesForTenant, markFileStatus } from '@/lib/storage/files'
import { requireTenantContext } from '@/lib/storage/tenant'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function message(error: unknown) {
    return error instanceof Error ? error.message : 'Storage request failed'
}

export async function GET(request: NextRequest) {
    try {
        const { tenantId } = await requireTenantContext()
        const orderId = request.nextUrl.searchParams.get('orderId')
        const brandId = request.nextUrl.searchParams.get('brandId')

        if (orderId || brandId) {
            if (!orderId || !brandId) throw new Error('Order and brand are required')
            const target = await assertFileTarget(tenantId, brandId, orderId)
            const files = await listFilesForOrder(tenantId, target.orderId)
            return NextResponse.json({ files })
        }

        const [summary, files] = await Promise.all([getStorageSummary(tenantId), listFilesForTenant(tenantId)])
        return NextResponse.json({ summary, files })
    } catch (error) {
        return NextResponse.json({ error: message(error) }, { status: 403 })
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { tenantId } = await requireTenantContext()
        const { fileId } = await request.json()
        const file = await getFileForTenant(tenantId, fileId)

        try {
            await deleteObject(tenantId, file.storageKey)
        } catch (error) {
            if (!isObjectNotFound(error)) throw error
        }

        // Retain an audit row but remove it from the active list and capacity total.
        await markFileStatus(tenantId, file.id, 'deleted')
        const summary = await getStorageSummary(tenantId)
        return NextResponse.json({ ok: true, summary })
    } catch (error) {
        return NextResponse.json({ error: message(error) }, { status: 400 })
    }
}
