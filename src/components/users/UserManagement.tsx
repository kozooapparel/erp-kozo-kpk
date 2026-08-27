'use client'

import { useState } from 'react'
import Link from 'next/link'
import AddUserModal from './AddUserModal'
import ResetPasswordModal from './ResetPasswordModal'
import DeleteUserModal from './DeleteUserModal'

interface AdminUser {
    id: string
    email: string
    full_name: string
    role: 'owner' | 'admin'
    created_at: string
}

interface UserManagementProps {
    adminUsers: AdminUser[]
}

export default function UserManagement({ adminUsers }: UserManagementProps) {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [resetPasswordUser, setResetPasswordUser] = useState<AdminUser | null>(null)
    const [deleteUser, setDeleteUser] = useState<AdminUser | null>(null)

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        })
    }

    return (
        <div className="space-y-6">
            {/* Back Button */}
            <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors"
            >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Kembali ke Dashboard
            </Link>

            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Kelola User</h1>
                    <p className="text-sm text-slate-500 mt-1">Tambah dan kelola akun admin</p>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 transition-all transform hover:scale-105 shadow-lg shadow-red-500/25"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    Tambah Admin
                </button>
            </div>

            {/* Stats */}
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm inline-block">
                <p className="text-xs text-slate-500">Total Admin</p>
                <p className="text-2xl font-bold text-slate-900">{adminUsers.length}</p>
            </div>

            {/* User List */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Daftar Admin</h2>

                {adminUsers.length > 0 ? (
                    <div className="space-y-3">
                        {adminUsers.map((user) => (
                            <div
                                key={user.id}
                                className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-4"
                            >
                                {/* Avatar */}
                                <div className="w-12 h-12 rounded-full bg-brand-gradient flex items-center justify-center text-lg font-bold text-white flex-shrink-0">
                                    {user.full_name.charAt(0).toUpperCase()}
                                </div>

                                {/* User Info */}
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-slate-900 truncate">{user.full_name}</p>
                                    <p className="text-sm text-slate-500 truncate">{user.email}</p>
                                    <p className="text-xs text-slate-400 mt-0.5">Ditambahkan {formatDate(user.created_at)}</p>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <button
                                        onClick={() => setResetPasswordUser(user)}
                                        className="p-2 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-700 transition-colors"
                                        title="Reset Password"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => setDeleteUser(user)}
                                        className="p-2 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 transition-colors"
                                        title="Hapus User"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <svg className="w-12 h-12 mx-auto text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <p className="text-slate-500">Belum ada admin</p>
                        <p className="text-sm text-slate-400 mt-1">Klik "Tambah Admin" untuk menambahkan</p>
                    </div>
                )}
            </div>

            {/* Modals */}
            <AddUserModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
            />

            <ResetPasswordModal
                user={resetPasswordUser}
                isOpen={resetPasswordUser !== null}
                onClose={() => setResetPasswordUser(null)}
            />

            <DeleteUserModal
                user={deleteUser}
                isOpen={deleteUser !== null}
                onClose={() => setDeleteUser(null)}
            />
        </div>
    )
}
