import { NextRequest, NextResponse } from 'next/server'
import { DEFAULT_PART_SIZE, completeMultipartUpload, headObject } from '@/lib/storage/r2'
import { completeFileMetadata, getUploadForTenant } from '@/lib/storage/files'
import { requireTenantContext } from '@/lib/storage/tenant'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
    try {
        const { tenantId } = await requireTenantContext()
        const body = await request.json()
        if (!Array.isArray(body.parts) || body.parts.length === 0) throw new Error('Upload parts are required')
        const parts = body.parts.map((part: unknown) => {
            const value = part as { ETag?: unknown; PartNumber?: unknown }
            if (typeof value.ETag !== 'string' || !Number.isInteger(value.PartNumber)) throw new Error('Upload parts are not valid')
            return { ETag: value.ETag, PartNumber: value.PartNumber }
        }).sort((a: { PartNumber: number }, b: { PartNumber: number }) => a.PartNumber - b.PartNumber)
        const upload = await getUploadForTenant(tenantId, body.fileId)
        const expectedPartCount = Math.max(1, Math.ceil(upload.size_bytes / DEFAULT_PART_SIZE))
        if (parts.length !== expectedPartCount || parts.some((part: { PartNumber: number }, index: number) => part.PartNumber !== index + 1)) {
            throw new Error('Upload parts are incomplete')
        }
        const result = await completeMultipartUpload(tenantId, upload.storage_key, upload.multipart_upload_id, parts)

        // A completed multipart request alone is insufficient. Verify that the
        // final object is readable before exposing it as a ready layout file.
        try {
            const object = await headObject(tenantId, upload.storage_key)
            if (object.ContentLength !== upload.size_bytes) {
                throw new Error('R2 object size does not match the uploaded file')
            }
            const file = await completeFileMetadata(tenantId, upload.id, result.ETag || object.ETag, result.VersionId || object.VersionId)
            return NextResponse.json({ ok: true, file })
        } catch (error) {
            console.error('R2 multipart upload completed but finalization failed:', error)
            return NextResponse.json({
                error: 'Upload multipart sudah selesai di R2, tetapi verifikasi atau penyimpanan metadata gagal. File belum dianggap berhasil dan perlu diselesaikan oleh administrator.',
                code: 'R2_FINALIZATION_FAILED',
                r2Completed: true,
            }, { status: 500 })
        }
    } catch (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not complete upload' }, { status: 400 })
    }
}
