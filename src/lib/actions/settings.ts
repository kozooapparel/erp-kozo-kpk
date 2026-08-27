'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { AppSettings, Json } from '@/types/database'

export interface BankInfo {
    bank_name: string
    account_name: string
    account_number: string
}

export interface CompanyInfo {
    name: string
    address: string
    phone: string
    logo_url?: string
}

/**
 * Get setting by key
 */
export async function getSetting<T = Json>(key: string): Promise<T | null> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', key)
        .single()

    if (error) {
        console.error(`Error fetching setting ${key}:`, error)
        return null
    }

    return data?.value as T
}

/**
 * Get bank info setting
 */
export async function getBankInfo(): Promise<BankInfo | null> {
    return getSetting<BankInfo>('bank_info')
}

/**
 * Get company info setting
 */
export async function getCompanyInfo(): Promise<CompanyInfo | null> {
    return getSetting<CompanyInfo>('company_info')
}

/**
 * Update setting
 */
export async function updateSetting(key: string, value: Json): Promise<AppSettings | null> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('app_settings')
        .upsert({
            key,
            value,
            updated_at: new Date().toISOString()
        }, {
            onConflict: 'key'
        })
        .select()
        .single()

    if (error) {
        console.error(`Error updating setting ${key}:`, error)
        throw new Error('Failed to update setting')
    }

    revalidatePath('/settings')
    return data
}

/**
 * Update bank info
 */
export async function updateBankInfo(bankInfo: BankInfo): Promise<AppSettings | null> {
    return updateSetting('bank_info', bankInfo as unknown as Json)
}

/**
 * Update company info
 */
export async function updateCompanyInfo(companyInfo: CompanyInfo): Promise<AppSettings | null> {
    return updateSetting('company_info', companyInfo as unknown as Json)
}

/**
 * Get all settings
 */
export async function getAllSettings(): Promise<Record<string, Json>> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('app_settings')
        .select('key, value')

    if (error) {
        console.error('Error fetching all settings:', error)
        return {}
    }

    return data?.reduce((acc, setting) => {
        acc[setting.key] = setting.value
        return acc
    }, {} as Record<string, Json>) || {}
}
