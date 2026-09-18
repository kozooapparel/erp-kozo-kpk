import 'server-only'

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const VERSION = 'v1'

function encryptionKey(): Buffer {
    const encoded = process.env.R2_CREDENTIAL_ENCRYPTION_KEY
    if (!encoded) {
        throw new Error('R2_CREDENTIAL_ENCRYPTION_KEY is not configured')
    }

    const key = Buffer.from(encoded, 'base64')
    if (key.length !== 32) {
        throw new Error('R2_CREDENTIAL_ENCRYPTION_KEY must be a base64-encoded 32-byte key')
    }
    return key
}

export function encryptCredential(value: string): string {
    const iv = randomBytes(12)
    const cipher = createCipheriv(ALGORITHM, encryptionKey(), iv)
    const ciphertext = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()])
    const tag = cipher.getAuthTag()
    return [VERSION, iv.toString('base64'), tag.toString('base64'), ciphertext.toString('base64')].join(':')
}

export function decryptCredential(payload: string): string {
    const [version, ivEncoded, tagEncoded, ciphertextEncoded] = payload.split(':')
    if (version !== VERSION || !ivEncoded || !tagEncoded || !ciphertextEncoded) {
        throw new Error('Stored R2 credential cannot be decrypted')
    }

    try {
        const decipher = createDecipheriv(ALGORITHM, encryptionKey(), Buffer.from(ivEncoded, 'base64'))
        decipher.setAuthTag(Buffer.from(tagEncoded, 'base64'))
        return Buffer.concat([
            decipher.update(Buffer.from(ciphertextEncoded, 'base64')),
            decipher.final(),
        ]).toString('utf8')
    } catch {
        throw new Error('Stored R2 credential cannot be decrypted')
    }
}
