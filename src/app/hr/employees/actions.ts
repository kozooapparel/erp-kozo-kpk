'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Create employee
export async function createEmployee(formData: FormData): Promise<{ success: boolean; error?: string; id?: string }> {
    try {
        const supabase = await createClient()

        // Check auth
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return { success: false, error: 'Unauthorized' }
        }

        const nik = formData.get('nik') as string
        const fullName = formData.get('full_name') as string
        const department = formData.get('department') as string
        const position = formData.get('position') as string
        const dailyRate = parseFloat(formData.get('daily_rate') as string)
        const joinDate = formData.get('join_date') as string
        const bankAccount = formData.get('bank_account') as string

        if (!nik || !fullName || !department || !position || !dailyRate || !joinDate) {
            return { success: false, error: 'Semua field wajib diisi' }
        }

        // Check NIK uniqueness
        const { data: existing } = await supabase
            .from('employees')
            .select('id')
            .eq('nik', nik)
            .single()

        if (existing) {
            return { success: false, error: 'NIK sudah terdaftar' }
        }

        const { data, error } = await supabase
            .from('employees')
            .insert({
                nik,
                full_name: fullName,
                department,
                position,
                daily_rate: dailyRate,
                join_date: joinDate,
                bank_account: bankAccount || null,
                status: 'active'
            })
            .select()
            .single()

        if (error) {
            console.error('Create employee error:', error)
            return { success: false, error: 'Gagal membuat data karyawan' }
        }

        revalidatePath('/hr/employees')
        return { success: true, id: data.id }
    } catch (error) {
        console.error('Create employee exception:', error)
        return { success: false, error: 'Terjadi kesalahan sistem' }
    }
}

// Update employee
export async function updateEmployee(id: string, formData: FormData): Promise<{ success: boolean; error?: string }> {
    try {
        const supabase = await createClient()

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return { success: false, error: 'Unauthorized' }
        }

        const fullName = formData.get('full_name') as string
        const department = formData.get('department') as string
        const position = formData.get('position') as string
        const dailyRate = parseFloat(formData.get('daily_rate') as string)
        const joinDate = formData.get('join_date') as string
        const bankAccount = formData.get('bank_account') as string
        const status = formData.get('status') as string

        const { error } = await supabase
            .from('employees')
            .update({
                full_name: fullName,
                department,
                position,
                daily_rate: dailyRate,
                join_date: joinDate,
                bank_account: bankAccount || null,
                status
            })
            .eq('id', id)

        if (error) {
            console.error('Update employee error:', error)
            return { success: false, error: 'Gagal update data karyawan' }
        }

        revalidatePath('/hr/employees')
        revalidatePath(`/hr/employees/${id}`)
        return { success: true }
    } catch (error) {
        console.error('Update employee exception:', error)
        return { success: false, error: 'Terjadi kesalahan sistem' }
    }
}

// Add allowance
export async function addAllowance(employeeId: string, formData: FormData): Promise<{ success: boolean; error?: string }> {
    try {
        const supabase = await createClient()

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return { success: false, error: 'Unauthorized' }
        }

        const type = formData.get('type') as string
        const amount = parseFloat(formData.get('amount') as string)
        const method = formData.get('calculation_method') as string

        const { error } = await supabase
            .from('allowances')
            .insert({
                employee_id: employeeId,
                allowance_type: type,
                amount,
                calculation_method: method,
                is_active: true
            })

        if (error) {
            console.error('Add allowance error:', error)
            return { success: false, error: 'Gagal menambah tunjangan' }
        }

        revalidatePath(`/hr/employees/${employeeId}`)
        return { success: true }
    } catch (error) {
        console.error('Add allowance exception:', error)
        return { success: false, error: 'Terjadi kesalahan sistem' }
    }
}

// Delete allowance
export async function deleteAllowance(id: string, employeeId: string): Promise<{ success: boolean; error?: string }> {
    try {
        const supabase = await createClient()

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return { success: false, error: 'Unauthorized' }
        }

        const { error } = await supabase
            .from('allowances')
            .delete()
            .eq('id', id)

        if (error) {
            console.error('Delete allowance error:', error)
            return { success: false, error: 'Gagal menghapus tunjangan' }
        }

        revalidatePath(`/hr/employees/${employeeId}`)
        return { success: true }
    } catch (error) {
        console.error('Delete allowance exception:', error)
        return { success: false, error: 'Terjadi kesalahan sistem' }
    }
}

// Add kasbon (deduction)
export async function addKasbon(employeeId: string, formData: FormData): Promise<{ success: boolean; error?: string }> {
    try {
        const supabase = await createClient()

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return { success: false, error: 'Unauthorized' }
        }

        const totalAmount = parseFloat(formData.get('total_amount') as string)
        const installment = parseFloat(formData.get('installment_per_period') as string)
        const notes = formData.get('notes') as string

        if (!totalAmount || !installment) {
            return { success: false, error: 'Total dan cicilan wajib diisi' }
        }

        const { error } = await supabase
            .from('deductions')
            .insert({
                employee_id: employeeId,
                deduction_type: 'kasbon',
                total_amount: totalAmount,
                remaining_amount: totalAmount,
                installment_per_period: installment,
                status: 'active',
                notes,
                created_by: user.id
            })

        if (error) {
            console.error('Add kasbon error:', error)
            return { success: false, error: 'Gagal menambah kasbon' }
        }

        revalidatePath(`/hr/employees/${employeeId}`)
        return { success: true }
    } catch (error) {
        console.error('Add kasbon exception:', error)
        return { success: false, error: 'Terjadi kesalahan sistem' }
    }
}

// Add bonus
export async function addBonus(employeeId: string, formData: FormData): Promise<{ success: boolean; error?: string }> {
    try {
        const supabase = await createClient()

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return { success: false, error: 'Unauthorized' }
        }

        const bonusType = formData.get('bonus_type') as string
        const amount = parseFloat(formData.get('amount') as string)
        const periodMonth = parseInt(formData.get('period_month') as string)
        const periodYear = parseInt(formData.get('period_year') as string)
        const reason = formData.get('reason') as string

        if (!bonusType || !amount || !periodMonth || !periodYear) {
            return { success: false, error: 'Semua field wajib diisi' }
        }

        const { error } = await supabase
            .from('bonuses')
            .insert({
                employee_id: employeeId,
                bonus_type: bonusType,
                amount,
                period_month: periodMonth,
                period_year: periodYear,
                reason,
                status: 'pending',
                created_by: user.id
            })

        if (error) {
            console.error('Add bonus error:', error)
            return { success: false, error: 'Gagal menambah bonus' }
        }

        revalidatePath(`/hr/employees/${employeeId}`)
        revalidatePath('/hr/bonuses')
        return { success: true }
    } catch (error) {
        console.error('Add bonus exception:', error)
        return { success: false, error: 'Terjadi kesalahan sistem' }
    }
}

// Update bonus (only pending)
export async function updateBonus(bonusId: string, employeeId: string, formData: FormData): Promise<{ success: boolean; error?: string }> {
    try {
        const supabase = await createClient()

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return { success: false, error: 'Unauthorized' }
        }

        // Check if bonus is still pending
        const { data: bonus } = await supabase
            .from('bonuses')
            .select('status')
            .eq('id', bonusId)
            .single()

        if (bonus?.status !== 'pending') {
            return { success: false, error: 'Hanya bonus pending yang bisa diedit' }
        }

        const bonusType = formData.get('bonus_type') as string
        const amount = parseFloat(formData.get('amount') as string)
        const reason = formData.get('reason') as string

        const { error } = await supabase
            .from('bonuses')
            .update({
                bonus_type: bonusType,
                amount,
                reason
            })
            .eq('id', bonusId)

        if (error) {
            console.error('Update bonus error:', error)
            return { success: false, error: 'Gagal update bonus' }
        }

        revalidatePath(`/hr/employees/${employeeId}`)
        revalidatePath('/hr/bonuses')
        return { success: true }
    } catch (error) {
        console.error('Update bonus exception:', error)
        return { success: false, error: 'Terjadi kesalahan sistem' }
    }
}

// Delete bonus (only pending)
export async function deleteBonus(bonusId: string, employeeId: string): Promise<{ success: boolean; error?: string }> {
    try {
        const supabase = await createClient()

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return { success: false, error: 'Unauthorized' }
        }

        // Check if bonus is still pending
        const { data: bonus } = await supabase
            .from('bonuses')
            .select('status')
            .eq('id', bonusId)
            .single()

        if (bonus?.status !== 'pending') {
            return { success: false, error: 'Hanya bonus pending yang bisa dihapus' }
        }

        const { error } = await supabase
            .from('bonuses')
            .delete()
            .eq('id', bonusId)

        if (error) {
            console.error('Delete bonus error:', error)
            return { success: false, error: 'Gagal menghapus bonus' }
        }

        revalidatePath(`/hr/employees/${employeeId}`)
        revalidatePath('/hr/bonuses')
        return { success: true }
    } catch (error) {
        console.error('Delete bonus exception:', error)
        return { success: false, error: 'Terjadi kesalahan sistem' }
    }
}

// Approve bonus (owner only)
export async function approveBonus(bonusId: string): Promise<{ success: boolean; error?: string }> {
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
            return { success: false, error: 'Hanya Owner yang bisa approve bonus' }
        }

        const { error } = await supabase
            .from('bonuses')
            .update({
                status: 'approved',
                approved_by: user.id,
                approved_at: new Date().toISOString()
            })
            .eq('id', bonusId)

        if (error) {
            console.error('Approve bonus error:', error)
            return { success: false, error: 'Gagal approve bonus' }
        }

        revalidatePath('/hr/bonuses')
        return { success: true }
    } catch (error) {
        console.error('Approve bonus exception:', error)
        return { success: false, error: 'Terjadi kesalahan sistem' }
    }
}

// Update allowance
export async function updateAllowance(allowanceId: string, employeeId: string, formData: FormData): Promise<{ success: boolean; error?: string }> {
    try {
        const supabase = await createClient()

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return { success: false, error: 'Unauthorized' }
        }

        const type = formData.get('type') as string
        const amount = parseFloat(formData.get('amount') as string)
        const method = formData.get('calculation_method') as string

        const { error } = await supabase
            .from('allowances')
            .update({
                allowance_type: type,
                amount,
                calculation_method: method
            })
            .eq('id', allowanceId)

        if (error) {
            console.error('Update allowance error:', error)
            return { success: false, error: 'Gagal update tunjangan' }
        }

        revalidatePath(`/hr/employees/${employeeId}`)
        return { success: true }
    } catch (error) {
        console.error('Update allowance exception:', error)
        return { success: false, error: 'Terjadi kesalahan sistem' }
    }
}

// Delete kasbon (only if unused)
export async function deleteDeduction(deductionId: string, employeeId: string): Promise<{ success: boolean; error?: string }> {
    try {
        const supabase = await createClient()

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return { success: false, error: 'Unauthorized' }
        }

        // Check if kasbon belum dipotong sama sekali
        const { data: deduction } = await supabase
            .from('deductions')
            .select('total_amount, remaining_amount')
            .eq('id', deductionId)
            .single()

        if (!deduction || deduction.remaining_amount !== deduction.total_amount) {
            return { success: false, error: 'Kasbon sudah terpotong, tidak bisa dihapus' }
        }

        const { error } = await supabase
            .from('deductions')
            .delete()
            .eq('id', deductionId)

        if (error) {
            console.error('Delete deduction error:', error)
            return { success: false, error: 'Gagal menghapus kasbon' }
        }

        revalidatePath(`/hr/employees/${employeeId}`)
        return { success: true }
    } catch (error) {
        console.error('Delete deduction exception:', error)
        return { success: false, error: 'Terjadi kesalahan sistem' }
    }
}
