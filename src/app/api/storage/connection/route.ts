import { NextRequest, NextResponse } from 'next/server'
import { getPublicConnection, getStoredConnection, removeR2Connection, saveR2Connection, testR2Connection, validateConnectionInput } from '@/lib/storage/r2'
import { requireTenantContext } from '@/lib/storage/tenant'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function message(error: unknown) {
    return error instanceof Error ? error.message : 'Storage request failed'
}

export async function GET() {
    try {
        const { tenantId } = await requireTenantContext({ owner: true })
        return NextResponse.json({ connection: await getPublicConnection(tenantId) })
    } catch (error) {
        return NextResponse.json({ error: message(error) }, { status: 403 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const { tenantId } = await requireTenantContext({ owner: true })
        const body = await request.json()
        if (body.action === 'testSaved') {
            const connection = await getStoredConnection(tenantId)
            await testR2Connection({
                accountId: connection.account_id,
                bucketName: connection.bucket_name,
                endpoint: connection.endpoint,
                storageLimitBytes: connection.storage_limit_bytes,
                // These values remain on the server and are never returned.
                accessKeyId: (await import('@/lib/storage/credentials')).decryptCredential(connection.access_key_id_ciphertext),
                secretAccessKey: (await import('@/lib/storage/credentials')).decryptCredential(connection.secret_access_key_ciphertext),
            })
            return NextResponse.json({ ok: true })
        }

        const input = validateConnectionInput(body.connection || body)
        if (body.action === 'test') {
            await testR2Connection(input)
            return NextResponse.json({ ok: true })
        }
        if (body.action === 'save') {
            const connection = await saveR2Connection(tenantId, input)
            return NextResponse.json({ ok: true, connection })
        }
        return NextResponse.json({ error: 'Unknown storage action' }, { status: 400 })
    } catch (error) {
        return NextResponse.json({ error: message(error) }, { status: 400 })
    }
}

export async function DELETE() {
    try {
        const { tenantId } = await requireTenantContext({ owner: true })
        await removeR2Connection(tenantId)
        return NextResponse.json({ ok: true })
    } catch (error) {
        return NextResponse.json({ error: message(error) }, { status: 400 })
    }
}
