/**
 * Terbilang - Konversi angka ke kata dalam Bahasa Indonesia
 * Contoh: 1820000 -> "Satu Juta Delapan Ratus Dua Puluh Ribu Rupiah"
 */

const satuan = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan']
const belasan = ['Sepuluh', 'Sebelas', 'Dua Belas', 'Tiga Belas', 'Empat Belas', 'Lima Belas', 'Enam Belas', 'Tujuh Belas', 'Delapan Belas', 'Sembilan Belas']

function terbilangRatusan(n: number): string {
    if (n < 10) {
        return satuan[n]
    }
    if (n < 20) {
        return belasan[n - 10]
    }
    if (n < 100) {
        const puluhan = Math.floor(n / 10)
        const sisa = n % 10
        return satuan[puluhan] + ' Puluh' + (sisa > 0 ? ' ' + satuan[sisa] : '')
    }

    const ratusan = Math.floor(n / 100)
    const sisa = n % 100
    const prefix = ratusan === 1 ? 'Seratus' : satuan[ratusan] + ' Ratus'
    return prefix + (sisa > 0 ? ' ' + terbilangRatusan(sisa) : '')
}

function terbilangRibuan(n: number): string {
    if (n < 1000) {
        return terbilangRatusan(n)
    }

    const ribuan = Math.floor(n / 1000)
    const sisa = n % 1000

    let result: string
    if (ribuan === 1) {
        result = 'Seribu'
    } else if (ribuan < 1000) {
        result = terbilangRatusan(ribuan) + ' Ribu'
    } else {
        result = terbilangRibuan(ribuan) + ' Ribu'
    }

    return result + (sisa > 0 ? ' ' + terbilangRatusan(sisa) : '')
}

function terbilangJutaan(n: number): string {
    if (n < 1000000) {
        return terbilangRibuan(n)
    }

    const jutaan = Math.floor(n / 1000000)
    const sisa = n % 1000000

    const prefix = jutaan === 1 ? 'Satu Juta' : terbilangRibuan(jutaan) + ' Juta'
    return prefix + (sisa > 0 ? ' ' + terbilangRibuan(sisa) : '')
}

function terbilangMilyaran(n: number): string {
    if (n < 1000000000) {
        return terbilangJutaan(n)
    }

    const milyaran = Math.floor(n / 1000000000)
    const sisa = n % 1000000000

    const prefix = milyaran === 1 ? 'Satu Miliar' : terbilangJutaan(milyaran) + ' Miliar'
    return prefix + (sisa > 0 ? ' ' + terbilangJutaan(sisa) : '')
}

function terbilangTrilyunan(n: number): string {
    if (n < 1000000000000) {
        return terbilangMilyaran(n)
    }

    const trilyunan = Math.floor(n / 1000000000000)
    const sisa = n % 1000000000000

    const prefix = trilyunan === 1 ? 'Satu Triliun' : terbilangMilyaran(trilyunan) + ' Triliun'
    return prefix + (sisa > 0 ? ' ' + terbilangMilyaran(sisa) : '')
}

/**
 * Konversi angka ke terbilang dengan suffix "Rupiah"
 * @param angka - Angka yang akan dikonversi (dalam Rupiah)
 * @returns String terbilang dengan suffix "Rupiah"
 * @example
 * terbilang(1820000) // "Satu Juta Delapan Ratus Dua Puluh Ribu Rupiah"
 */
export function terbilang(angka: number): string {
    if (angka === 0) {
        return 'Nol Rupiah'
    }

    if (angka < 0) {
        return 'Minus ' + terbilang(Math.abs(angka))
    }

    // Round to integer
    angka = Math.round(angka)

    return terbilangTrilyunan(angka) + ' Rupiah'
}

/**
 * Konversi angka ke terbilang tanpa suffix
 * @param angka - Angka yang akan dikonversi
 * @returns String terbilang tanpa suffix
 */
export function terbilangRaw(angka: number): string {
    if (angka === 0) {
        return 'Nol'
    }

    if (angka < 0) {
        return 'Minus ' + terbilangRaw(Math.abs(angka))
    }

    // Round to integer
    angka = Math.round(angka)

    return terbilangTrilyunan(angka)
}
