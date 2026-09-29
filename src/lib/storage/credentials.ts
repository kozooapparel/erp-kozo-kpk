import 'server-only'

import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const VERSION = 'v1'
const UNDECRYPTABLE_MESSAGE =
    'Kredensial penyimpanan R2 tidak dapat dibaca karena kunci enkripsi (R2_CREDENTIAL_ENCRYPTION_KEY) berbeda dari saat kredensial disimpan. Buka Settings → Penyimpanan File, lalu simpan ulang koneksi R2.'

function encryptionKey(): Buffer {
    const encoded = process.env.R2_CREDENTIAL_ENCRYPTION_KEY
    if (encoded) {
        const key = Buffer.from(encoded, 'base64')
        if (key.length !== 32) {
            throw new Error('R2_CREDENTIAL_ENCRYPTION_KEY must be a base64-encoded 32-byte key')
        }
        return key
    }

    // Tanpa R2_CREDENTIAL_ENCRYPTION_KEY, kunci diturunkan secara deterministik dari
    // SUPABASE_SERVICE_ROLE_KEY agar pengguna cukup mengisi form koneksi R2 di UI
    // tanpa perlu menyiapkan env tambahan.
    const seed = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!seed) {
        throw new Error(
            'Kunci enkripsi kredensial R2 tidak tersedia: set R2_CREDENTIAL_ENCRYPTION_KEY atau SUPABASE_SERVICE_ROLE_KEY'
        )
    }
    return createHash('sha256').update(seed).digest()
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
        throw new Error(UNDECRYPTABLE_MESSAGE)
    }

    try {
        const decipher = createDecipheriv(ALGORITHM, encryptionKey(), Buffer.from(ivEncoded, 'base64'))
        decipher.setAuthTag(Buffer.from(tagEncoded, 'base64'))
        return Buffer.concat([
            decipher.update(Buffer.from(ciphertextEncoded, 'base64')),
            decipher.final(),
        ]).toString('utf8')
    } catch {
        throw new Error(UNDECRYPTABLE_MESSAGE)
    }
}
