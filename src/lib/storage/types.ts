export type R2ConnectionInput = {
    accountId: string
    bucketName: string
    accessKeyId: string
    secretAccessKey: string
    endpoint: string
    storageLimitBytes?: number | null
}

export type PublicR2Connection = {
    connected: boolean
    accountId?: string
    bucketName?: string
    endpoint?: string
    updatedAt?: string
    storageLimitBytes?: number | null
}

export type StorageFile = {
    id: string
    tenantId: string
    brandId: string
    orderId: string | null
    storageKey: string
    originalName: string
    contentType: string | null
    sizeBytes: number
    status: 'uploading' | 'ready' | 'missing' | 'deleted' | 'failed'
    uploadedAt: string | null
    createdAt: string
}

export type StorageSummary = {
    usedBytes: number
    fileCount: number
}
