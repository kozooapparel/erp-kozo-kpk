import 'server-only'

import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const VERSION = 'v1'
const UNDECRYPTABLE_MESSAGE =
    'Kredensial penyimpanan R2 tidak dapat dibaca karena kunci enkripsi berbeda dari saat kredensial disimpan. Buka Settings → Penyimpanan File, lalu simpan ulang koneksi R2.'

// Kunci utama diturunkan deterministik dari SUPABASE_SERVICE_ROLE_KEY supaya tiap
// client cukup mengisi tiga variabel Supabase dan menyambungkan R2 lewat UI, tanpa
// perlu menyiapkan variabel enkripsi tambahan.
function primaryKey(): Buffer {
    const seed = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!seed) {
        throw new Error('Kunci enkripsi kredensial R2 tidak tersedia: SUPABASE_SERVICE_ROLE_KEY belum diisi')
    }
    return createHash('sha256').update(seed).digest()
}

// Kompatibilitas baca saja: kredensial yang lebih dulu tersimpan mungkin dienkripsi
// memakai R2_CREDENTIAL_ENCRYPTION_KEY (variabel opsional, tidak wajib lagi). Nilai
// baru selalu ditulis dengan kunci utama di atas.
function legacyKey(): Buffer | null {
    const encoded = process.env.R2_CREDENTIAL_ENCRYPTION_KEY
    if (!encoded) return null
    const key = Buffer.from(encoded, 'base64')
    return key.length === 32 ? key : null
}

function tryDecrypt(key: Buffer, ivEncoded: string, tagEncoded: string, ciphertextEncoded: string): string | null {
    try {
        const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(ivEncoded, 'base64'))
        decipher.setAuthTag(Buffer.from(tagEncoded, 'base64'))
        return Buffer.concat([
            decipher.update(Buffer.from(ciphertextEncoded, 'base64')),
            decipher.final(),
        ]).toString('utf8')
    } catch {
        return null
    }
}

export function encryptCredential(value: string): string {
    const iv = randomBytes(12)
    const cipher = createCipheriv(ALGORITHM, primaryKey(), iv)
    const ciphertext = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()])
    const tag = cipher.getAuthTag()
    return [VERSION, iv.toString('base64'), tag.toString('base64'), ciphertext.toString('base64')].join(':')
}

export function decryptCredential(payload: string): string {
    const [version, ivEncoded, tagEncoded, ciphertextEncoded] = payload.split(':')
    if (version !== VERSION || !ivEncoded || !tagEncoded || !ciphertextEncoded) {
        throw new Error(UNDECRYPTABLE_MESSAGE)
    }

    const withPrimary = tryDecrypt(primaryKey(), ivEncoded, tagEncoded, ciphertextEncoded)
    if (withPrimary !== null) return withPrimary

    const legacy = legacyKey()
    if (legacy) {
        const withLegacy = tryDecrypt(legacy, ivEncoded, tagEncoded, ciphertextEncoded)
        if (withLegacy !== null) return withLegacy
    }

    throw new Error(UNDECRYPTABLE_MESSAGE)
}
