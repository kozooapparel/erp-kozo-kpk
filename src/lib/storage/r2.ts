import 'server-only'

import {
    AbortMultipartUploadCommand,
    CompleteMultipartUploadCommand,
    CreateMultipartUploadCommand,
    DeleteObjectCommand,
    GetObjectCommand,
    HeadBucketCommand,
    HeadObjectCommand,
    S3Client,
    UploadPartCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { createAdminClient } from '@/lib/supabase/admin'
import { decryptCredential, encryptCredential } from './credentials'
import type { PublicR2Connection, R2ConnectionInput } from './types'

type StoredConnection = {
    tenant_id: string
    account_id: string
    bucket_name: string
    endpoint: string
    storage_limit_bytes: number | null
    access_key_id_ciphertext: string
    secret_access_key_ciphertext: string
}

export const DOWNLOAD_URL_TTL_SECONDS = 5 * 60
export const PART_URL_TTL_SECONDS = 15 * 60
export const DEFAULT_PART_SIZE = 10 * 1024 * 1024

function requiredText(value: unknown, field: string): string {
    if (typeof value !== 'string' || !value.trim()) throw new Error(`${field} is required`)
    return value.trim()
}

export function validateConnectionInput(input: Partial<R2ConnectionInput>): R2ConnectionInput {
    const accountId = requiredText(input.accountId, 'Account ID')
    const bucketName = requiredText(input.bucketName, 'Bucket Name')
    const accessKeyId = requiredText(input.accessKeyId, 'Access Key ID')
    const secretAccessKey = requiredText(input.secretAccessKey, 'Secret Access Key')
    const endpoint = normalizeR2Endpoint(requiredText(input.endpoint, 'Endpoint'), accountId)
    const storageLimitBytes = input.storageLimitBytes === undefined || input.storageLimitBytes === null || input.storageLimitBytes === 0
        ? null
        : Number(input.storageLimitBytes)

    if (!/^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/i.test(bucketName)) {
        throw new Error('Bucket Name is not valid')
    }
    if (storageLimitBytes !== null && (!Number.isSafeInteger(storageLimitBytes) || storageLimitBytes < 1)) {
        throw new Error('Storage limit is not valid')
    }
    return { accountId, bucketName, accessKeyId, secretAccessKey, endpoint, storageLimitBytes }
}

function normalizeR2Endpoint(value: string, accountId: string): string {
    let url: URL
    try {
        url = new URL(value)
    } catch {
        throw new Error('Endpoint must be a valid HTTPS URL')
    }
    const expectedHost = `${accountId}.r2.cloudflarestorage.com`.toLowerCase()
    if (url.protocol !== 'https:' || url.hostname.toLowerCase() !== expectedHost || url.pathname !== '/') {
        throw new Error('Endpoint must be https://<ACCOUNT_ID>.r2.cloudflarestorage.com')
    }
    return `https://${expectedHost}`
}

function clientFromConnection(connection: StoredConnection): S3Client {
    return new S3Client({
        region: 'auto',
        endpoint: connection.endpoint,
        forcePathStyle: true,
        credentials: {
            accessKeyId: decryptCredential(connection.access_key_id_ciphertext),
            secretAccessKey: decryptCredential(connection.secret_access_key_ciphertext),
        },
    })
}

export function clientForInput(input: R2ConnectionInput): S3Client {
    return new S3Client({
        region: 'auto',
        endpoint: input.endpoint,
        forcePathStyle: true,
        credentials: { accessKeyId: input.accessKeyId, secretAccessKey: input.secretAccessKey },
    })
}

export async function testR2Connection(input: R2ConnectionInput): Promise<void> {
    await clientForInput(input).send(new HeadBucketCommand({ Bucket: input.bucketName }))
}

export async function getStoredConnection(tenantId: string): Promise<StoredConnection> {
    const { data, error } = await createAdminClient()
        .from('tenant_r2_connections')
        .select('tenant_id, account_id, bucket_name, endpoint, storage_limit_bytes, access_key_id_ciphertext, secret_access_key_ciphertext')
        .eq('tenant_id', tenantId)
        .single()
    if (error || !data) throw new Error('Cloudflare R2 is not connected for this tenant')
    return data as StoredConnection
}

export async function getPublicConnection(tenantId: string): Promise<PublicR2Connection> {
    const { data } = await createAdminClient()
        .from('tenant_r2_connections')
        .select('account_id, bucket_name, endpoint, storage_limit_bytes, updated_at')
        .eq('tenant_id', tenantId)
        .maybeSingle()
    if (!data) return { connected: false }
    return {
        connected: true,
        accountId: data.account_id,
        bucketName: data.bucket_name,
        endpoint: data.endpoint,
        storageLimitBytes: data.storage_limit_bytes,
        updatedAt: data.updated_at,
    }
}

export async function saveR2Connection(tenantId: string, input: R2ConnectionInput): Promise<PublicR2Connection> {
    await testR2Connection(input)
    const { error } = await createAdminClient().from('tenant_r2_connections').upsert({
        tenant_id: tenantId,
        account_id: input.accountId,
        bucket_name: input.bucketName,
        endpoint: input.endpoint,
        storage_limit_bytes: input.storageLimitBytes || null,
        access_key_id_ciphertext: encryptCredential(input.accessKeyId),
        secret_access_key_ciphertext: encryptCredential(input.secretAccessKey),
    }, { onConflict: 'tenant_id' })
    if (error) throw new Error('Failed to save R2 connection')
    return getPublicConnection(tenantId)
}

export async function removeR2Connection(tenantId: string): Promise<void> {
    const { error } = await createAdminClient().from('tenant_r2_connections').delete().eq('tenant_id', tenantId)
    if (error) throw new Error('Failed to disconnect R2')
}

export async function getTenantR2(tenantId: string) {
    const connection = await getStoredConnection(tenantId)
    return { connection, client: clientFromConnection(connection) }
}

export async function createMultipartUpload(tenantId: string, key: string, contentType?: string) {
    const { connection, client } = await getTenantR2(tenantId)
    return client.send(new CreateMultipartUploadCommand({
        Bucket: connection.bucket_name,
        Key: key,
        ContentType: contentType || undefined,
    }))
}

export async function getUploadPartUrl(tenantId: string, key: string, uploadId: string, partNumber: number) {
    const { connection, client } = await getTenantR2(tenantId)
    return getSignedUrl(client, new UploadPartCommand({
        Bucket: connection.bucket_name,
        Key: key,
        UploadId: uploadId,
        PartNumber: partNumber,
    }), { expiresIn: PART_URL_TTL_SECONDS })
}

export async function completeMultipartUpload(tenantId: string, key: string, uploadId: string, parts: Array<{ ETag: string; PartNumber: number }>) {
    const { connection, client } = await getTenantR2(tenantId)
    return client.send(new CompleteMultipartUploadCommand({
        Bucket: connection.bucket_name,
        Key: key,
        UploadId: uploadId,
        MultipartUpload: { Parts: parts },
    }))
}

export async function abortMultipartUpload(tenantId: string, key: string, uploadId: string) {
    const { connection, client } = await getTenantR2(tenantId)
    return client.send(new AbortMultipartUploadCommand({ Bucket: connection.bucket_name, Key: key, UploadId: uploadId }))
}

export async function getDownloadUrl(tenantId: string, key: string, filename: string, disposition: 'attachment' | 'inline' = 'attachment') {
    const { connection, client } = await getTenantR2(tenantId)
    return getSignedUrl(client, new GetObjectCommand({
        Bucket: connection.bucket_name,
        Key: key,
        ResponseContentDisposition: `${disposition}; filename*=UTF-8''${encodeURIComponent(filename)}`,
    }), { expiresIn: DOWNLOAD_URL_TTL_SECONDS })
}

export async function headObject(tenantId: string, key: string) {
    const { connection, client } = await getTenantR2(tenantId)
    return client.send(new HeadObjectCommand({ Bucket: connection.bucket_name, Key: key }))
}

export async function deleteObject(tenantId: string, key: string) {
    const { connection, client } = await getTenantR2(tenantId)
    return client.send(new DeleteObjectCommand({ Bucket: connection.bucket_name, Key: key }))
}

export function isObjectNotFound(error: unknown): boolean {
    const candidate = error as { name?: string; $metadata?: { httpStatusCode?: number } }
    return candidate?.name === 'NotFound' || candidate?.name === 'NoSuchKey' || candidate?.$metadata?.httpStatusCode === 404
}
