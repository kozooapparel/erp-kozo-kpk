'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

interface AdminUser {
    id: string
    email: string
    full_name: string
    role: 'owner' | 'admin'
    created_at: string
}

// Get current user and verify owner role
async function verifyOwner() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Not authenticated')
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'owner') {
        throw new Error('Unauthorized: Owner access required')
    }

    return user
}

// Get all admin users
export async function getAdminUsers(): Promise<AdminUser[]> {
    await verifyOwner()

    const supabase = await createClient()
    const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, role, created_at')
        .eq('role', 'admin')
        .order('created_at', { ascending: false })

    if (error) {
        throw new Error('Failed to fetch admin users')
    }

    return data || []
}

// Create new admin user
export async function createAdmin(formData: FormData): Promise<{ success: boolean; error?: string }> {
    try {
        await verifyOwner()

        const email = formData.get('email') as string
        const password = formData.get('password') as string
        const fullName = formData.get('full_name') as string

        if (!email || !password || !fullName) {
            return { success: false, error: 'Semua field harus diisi' }
        }

        if (password.length < 6) {
            return { success: false, error: 'Password minimal 6 karakter' }
        }

        const adminClient = createAdminClient()

        // Create auth user
        const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // Auto confirm email
        })

        if (authError) {
            if (authError.message.includes('already registered')) {
                return { success: false, error: 'Email sudah terdaftar' }
            }
            return { success: false, error: authError.message }
        }

        if (!authData.user) {
            return { success: false, error: 'Gagal membuat user' }
        }

        // Create or update profile using admin client (bypasses RLS)
        // Using upsert to handle cases where profile might already exist
        const { error: profileError } = await adminClient
            .from('profiles')
            .upsert({
                id: authData.user.id,
                email,
                full_name: fullName,
                role: 'admin',
            }, {
                onConflict: 'id'
            })

        if (profileError) {
            console.error('Profile creation error:', profileError)
            // Rollback: delete auth user if profile creation fails
            await adminClient.auth.admin.deleteUser(authData.user.id)
            return { success: false, error: `Gagal membuat profil: ${profileError.message}` }
        }

        revalidatePath('/users')
        return { success: true }
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Terjadi kesalahan' }
    }
}

// Delete admin user
export async function deleteAdmin(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
        await verifyOwner()

        if (!userId) {
            return { success: false, error: 'User ID tidak valid' }
        }

        const adminClient = createAdminClient()

        // Delete auth user (profile will be cascade deleted if RLS is set up correctly)
        const { error: authError } = await adminClient.auth.admin.deleteUser(userId)

        if (authError) {
            return { success: false, error: authError.message }
        }

        // Also delete profile explicitly
        await adminClient
            .from('profiles')
            .delete()
            .eq('id', userId)

        revalidatePath('/users')
        return { success: true }
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Terjadi kesalahan' }
    }
}

// Reset admin password
export async function resetAdminPassword(userId: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
        await verifyOwner()

        if (!userId || !newPassword) {
            return { success: false, error: 'Data tidak valid' }
        }

        if (newPassword.length < 6) {
            return { success: false, error: 'Password minimal 6 karakter' }
        }

        const adminClient = createAdminClient()

        const { error } = await adminClient.auth.admin.updateUserById(userId, {
            password: newPassword
        })

        if (error) {
            return { success: false, error: error.message }
        }

        return { success: true }
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Terjadi kesalahan' }
    }
}
