'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

// Update attendance (owner only)
export async function updateAttendance(logId: string, formData: FormData): Promise<{ success: boolean; error?: string }> {
    try {
        const supabase = await createClient()

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return { success: false, error: 'Unauthorized' }
        }

        // Check if user is owner
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (profile?.role !== 'owner') {
            return { success: false, error: 'Hanya Owner yang bisa edit absensi' }
        }

        const checkIn = formData.get('check_in') as string
        const checkOut = formData.get('check_out') as string | null
        const overtimeType = formData.get('overtime_type') as string | null

        if (!checkIn) {
            return { success: false, error: 'Check-in wajib diisi' }
        }

        // Calculate hours if check_out provided
        let effectiveHours = null
        let overtimeHours = 0
        let deficitHours = 0

        if (checkOut) {
            const checkInTime = new Date(checkIn)
            const checkOutTime = new Date(checkOut)
            const totalHours = (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60)

            if (totalHours > 1) {
                effectiveHours = Math.max(0, totalHours - 1)

                if (overtimeType === 'holiday') {
                    overtimeHours = Math.max(0, effectiveHours)
                } else if (effectiveHours > 8) {
                    overtimeHours = effectiveHours - 8
                }

                deficitHours = Math.max(0, 8 - effectiveHours)
            }
        }

        const { error } = await supabase
            .from('attendance_logs')
            .update({
                check_in: checkIn,
                check_out: checkOut,
                effective_hours: effectiveHours,
                overtime_hours: overtimeHours,
                overtime_type: overtimeType,
                deficit_hours: deficitHours,
                updated_at: new Date().toISOString()
            })
            .eq('id', logId)

        if (error) {
            console.error('Update attendance error:', error)
            return { success: false, error: 'Gagal update absensi' }
        }

        revalidatePath('/hr/attendance')
        revalidatePath('/hr/attendance/corrections')
        return { success: true }
    } catch (error) {
        console.error('Update attendance exception:', error)
        return { success: false, error: 'Terjadi kesalahan sistem' }
    }
}

// Delete attendance (owner only)
export async function deleteAttendance(logId: string): Promise<{ success: boolean; error?: string }> {
    try {
        const supabase = await createClient()

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return { success: false, error: 'Unauthorized' }
        }

        // Check if user is owner
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (profile?.role !== 'owner') {
            return { success: false, error: 'Hanya Owner yang bisa hapus absensi' }
        }

        const { error } = await supabase
            .from('attendance_logs')
            .delete()
            .eq('id', logId)

        if (error) {
            console.error('Delete attendance error:', error)
            return { success: false, error: 'Gagal hapus absensi' }
        }

        revalidatePath('/hr/attendance')
        revalidatePath('/hr/attendance/corrections')
        return { success: true }
    } catch (error) {
        console.error('Delete attendance exception:', error)
        return { success: false, error: 'Terjadi kesalahan sistem' }
    }
}
