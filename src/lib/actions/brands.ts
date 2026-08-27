'use server'

import { createClient } from '@/lib/supabase/server'
import { Brand, BrandInsert, BrandUpdate } from '@/types/database'
import { revalidatePath } from 'next/cache'

/**
 * Get all active brands
 */
export async function getBrands(): Promise<Brand[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('brands')
        .select('*')
        .eq('is_active', true)
        .order('is_default', { ascending: false })
        .order('name')

    if (error) throw error
    return data || []
}

/**
 * Get brand by ID
 */
export async function getBrandById(id: string): Promise<Brand | null> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('brands')
        .select('*')
        .eq('id', id)
        .single()

    if (error) {
        if (error.code === 'PGRST116') return null
        throw error
    }
    return data
}

/**
 * Get the default brand
 */
export async function getDefaultBrand(): Promise<Brand | null> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('brands')
        .select('*')
        .eq('is_default', true)
        .eq('is_active', true)
        .single()

    if (error) {
        if (error.code === 'PGRST116') return null
        throw error
    }
    return data
}

/**
 * Create a new brand
 */
export async function createBrand(brandData: BrandInsert): Promise<Brand> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('brands')
        .insert(brandData)
        .select()
        .single()

    if (error) throw error

    revalidatePath('/brands')
    return data
}

/**
 * Update an existing brand
 */
export async function updateBrand(id: string, brandData: BrandUpdate): Promise<Brand> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('brands')
        .update(brandData)
        .eq('id', id)
        .select()
        .single()

    if (error) throw error

    revalidatePath('/brands')
    revalidatePath('/dashboard')
    return data
}

/**
 * Soft delete a brand (set is_active to false)
 */
export async function deleteBrand(id: string): Promise<void> {
    const supabase = await createClient()

    // Check if this is the default brand
    const { data: brand } = await supabase
        .from('brands')
        .select('is_default')
        .eq('id', id)
        .single()

    if (brand?.is_default) {
        throw new Error('Cannot delete the default brand')
    }

    const { error } = await supabase
        .from('brands')
        .update({ is_active: false })
        .eq('id', id)

    if (error) throw error

    revalidatePath('/brands')
}

/**
 * Set a brand as default
 */
export async function setDefaultBrand(id: string): Promise<void> {
    const supabase = await createClient()

    // Remove default from all brands
    await supabase
        .from('brands')
        .update({ is_default: false })
        .neq('id', id)

    // Set new default
    const { error } = await supabase
        .from('brands')
        .update({ is_default: true })
        .eq('id', id)

    if (error) throw error

    revalidatePath('/brands')
}

/**
 * Increment document counter and return new value
 */
export async function incrementBrandCounter(
    brandId: string,
    counterType: 'invoice' | 'kuitansi' | 'spk'
): Promise<number> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .rpc('increment_brand_counter', {
            p_brand_id: brandId,
            p_counter_type: counterType
        })

    if (error) throw error
    return data as number
}

/**
 * Get brand with company and bank info for PDF generation
 */
export async function getBrandForPDF(brandId: string): Promise<{
    companyInfo: { name: string; address: string; phone: string }
    bankInfo: { bank_name: string; account_name: string; account_number: string }
    logoUrl: string | null
} | null> {
    const brand = await getBrandById(brandId)

    if (!brand) return null

    return {
        companyInfo: {
            name: brand.company_name,
            address: brand.address || '',
            phone: brand.phone || ''
        },
        bankInfo: {
            bank_name: brand.bank_name || '',
            account_name: brand.account_name || '',
            account_number: brand.account_number || ''
        },
        logoUrl: brand.logo_url
    }
}
