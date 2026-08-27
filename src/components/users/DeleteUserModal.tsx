'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteAdmin } from '@/app/users/actions'
import { Modal, ModalFooter } from '@/components/ui'

interface AdminUser {
    id: string
    email: string
    full_name: string
}

interface DeleteUserModalProps {
    user: AdminUser | null
    isOpen: boolean
    onClose: () => void
}

export default function DeleteUserModal({ user, isOpen, onClose }: DeleteUserModalProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleDelete = async () => {
        if (!user) return

        setLoading(true)
        setError('')

        const result = await deleteAdmin(user.id)

        if (result.success) {
            onClose()
            router.refresh()
        } else {
            setError(result.error || 'Gagal menghapus user')
        }

        setLoading(false)
    }

    if (!user) return null

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Hapus Admin">
            <div className="p-5 space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 border border-red-200">
                    <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                        {user.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <p className="font-medium text-slate-900">{user.full_name}</p>
                        <p className="text-sm text-slate-500">{user.email}</p>
                    </div>
                </div>

                <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
                    <div className="flex gap-3">
                        <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <div>
                            <p className="font-medium text-amber-800">Peringatan</p>
                            <p className="text-sm text-amber-700 mt-1">
                                Aksi ini akan menghapus akun secara permanen. User tidak akan bisa login lagi.
                            </p>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                        {error}
                    </div>
                )}

                <ModalFooter
                    onCancel={onClose}
                    onSubmit={handleDelete}
                    type="button"
                    loading={loading}
                    submitText="Hapus Permanen"
                    variant="danger"
                />
            </div>
        </Modal>
    )
}
