'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { resetAdminPassword } from '@/app/users/actions'

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

    if (!isOpen || !user) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={handleClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl">
                {/* Header */}
                <div className="p-5 border-b border-slate-200">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-slate-900">Reset Password</h2>
                        <button
                            onClick={handleClose}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Content */}
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
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                            placeholder="Minimal 6 karakter"
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
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                            placeholder="Ulangi password"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Menyimpan...
                                </>
                            ) : (
                                'Reset Password'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
