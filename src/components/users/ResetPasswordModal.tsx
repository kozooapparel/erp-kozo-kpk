'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { resetAdminPassword } from '@/app/users/actions'
import { Modal, ModalFooter } from '@/components/ui'

interface AdminUser {
    id: string
    email: string
    full_name: string
}

interface ResetPasswordModalProps {
    user: AdminUser | null
    isOpen: boolean
    onClose: () => void
}

export default function ResetPasswordModal({ user, isOpen, onClose }: ResetPasswordModalProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (password !== confirmPassword) {
            setError('Password tidak cocok')
            return
        }

        if (password.length < 6) {
            setError('Password minimal 6 karakter')
            return
        }

        if (!user) return

        setLoading(true)
        const result = await resetAdminPassword(user.id, password)

        if (result.success) {
            setPassword('')
            setConfirmPassword('')
            onClose()
            router.refresh()
        } else {
            setError(result.error || 'Gagal reset password')
        }

        setLoading(false)
    }

    const handleClose = () => {
        setPassword('')
        setConfirmPassword('')
        setError('')
        onClose()
    }

    if (!user) return null

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Reset Password">
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="w-10 h-10 rounded-full bg-brand-gradient flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                        {user.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <p className="font-medium text-slate-900">{user.full_name}</p>
                        <p className="text-sm text-slate-500">{user.email}</p>
                    </div>
                </div>

                {error && (
                    <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                        {error}
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        Password Baru
                    </label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all placeholder-subtle"
                        placeholder="Min. 6 karakter"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        Konfirmasi Password
                    </label>
                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={6}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all placeholder-subtle"
                        placeholder="Ketik ulang"
                    />
                </div>

                <ModalFooter
                    onCancel={handleClose}
                    loading={loading}
                    submitText="Reset Password"
                    variant="warning"
                />
            </form>
        </Modal>
    )
}
