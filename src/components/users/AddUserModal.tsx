'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createAdmin } from '@/app/users/actions'
import { Modal, ModalFooter } from '@/components/ui'

interface AddUserModalProps {
    isOpen: boolean
    onClose: () => void
}

export default function AddUserModal({ isOpen, onClose }: AddUserModalProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        const formData = new FormData(e.currentTarget)
        const result = await createAdmin(formData)

        if (result.success) {
            onClose()
            router.refresh()
        } else {
            setError(result.error || 'Gagal menambahkan admin')
        }

        setLoading(false)
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Tambah Admin Baru">
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
                {error && (
                    <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                        {error}
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        Nama Lengkap
                    </label>
                    <input
                        type="text"
                        name="full_name"
                        required
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all placeholder-subtle"
                        placeholder="Nama lengkap"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        Email
                    </label>
                    <input
                        type="email"
                        name="email"
                        required
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all placeholder-subtle"
                        placeholder="email@example.com"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        Password
                    </label>
                    <input
                        type="password"
                        name="password"
                        required
                        minLength={6}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all placeholder-subtle"
                        placeholder="Min. 6 karakter"
                    />
                </div>

                <ModalFooter
                    onCancel={onClose}
                    loading={loading}
                    submitText="Tambah Admin"
                    variant="danger"
                />
            </form>
        </Modal>
    )
}
