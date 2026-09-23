/**
 * Resize image to a fixed square (cover crop) using canvas.
 * Keeps logos small (~180x180) so stored files stay lightweight.
 */
export function resizeImageToSquare(
    file: File,
    size = 180,
    quality = 0.85
): Promise<File> {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file)
        const img = new Image()

        img.onload = () => {
            try {
                const canvas = document.createElement('canvas')
                canvas.width = size
                canvas.height = size
                const ctx = canvas.getContext('2d')

                if (!ctx) {
                    URL.revokeObjectURL(url)
                    reject(new Error('Canvas tidak didukung'))
                    return
                }

                // Cover crop: scale to fill the square, center crop
                const scale = Math.max(size / img.width, size / img.height)
                const w = img.width * scale
                const h = img.height * scale
                const x = (size - w) / 2
                const y = (size - h) / 2

                ctx.drawImage(img, x, y, w, h)
                URL.revokeObjectURL(url)

                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            reject(new Error('Gagal memproses gambar'))
                            return
                        }
                        const name = file.name.replace(/\.[^.]+$/, '') || 'logo'
                        resolve(new File([blob], `${name}.png`, { type: 'image/png' }))
                    },
                    'image/png',
                    quality
                )
            } catch (err) {
                URL.revokeObjectURL(url)
                reject(err)
            }
        }

        img.onerror = () => {
            URL.revokeObjectURL(url)
            reject(new Error('File gambar tidak valid'))
        }

        img.src = url
    })
}
