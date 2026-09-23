'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Brand, BrandInsert, BrandUpdate } from '@/types/database'
import { revalidatePath } from 'next/cache'
import { requireTenantContext } from '@/lib/storage/tenant'

async function verifyOwner() {
    return requireTenantContext({ owner: true })
}

function pickEditableBrandFields(brandData: BrandInsert | BrandUpdate): BrandUpdate {
    const fields: BrandUpdate = {
        code: brandData.code,
        name: brandData.name,
        company_name: brandData.company_name,
        address: brandData.address,
        phone: brandData.phone,
        email: brandData.email,
        logo_url: brandData.logo_url,
        bank_name: brandData.bank_name,
        account_name: brandData.account_name,
        account_number: brandData.account_number,
        primary_color: brandData.primary_color,
        accent_color: brandData.accent_color,
        default_invoice_template_id: brandData.default_invoice_template_id,
        default_kuitansi_template_id: brandData.default_kuitansi_template_id,
        invoice_prefix: brandData.invoice_prefix,
        kuitansi_prefix: brandData.kuitansi_prefix,
        spk_prefix: brandData.spk_prefix,
    }

    return Object.fromEntries(
        Object.entries(fields).filter(([, value]) => value !== undefined)
    ) as BrandUpdate
}

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
    const context = await verifyOwner()
    const supabase = createAdminClient()

    const safeBrandData = pickEditableBrandFields(brandData) as BrandInsert

    const { data, error } = await supabase
        .from('brands')
        .insert({
        ...safeBrandData,
        tenant_id: context.tenantId,
            is_default: false,
            is_active: true,
        })
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
    const context = await verifyOwner()
    const supabase = createAdminClient()

    const safeBrandData = pickEditableBrandFields(brandData)

    const { data, error } = await supabase
        .from('brands')
        .update(safeBrandData)
        .eq('id', id)
        .eq('tenant_id', context.tenantId)
        .select()
        .single()

    if (error) throw error

    revalidatePath('/brands')
    revalidatePath('/', 'layout')
    return data
}

/**
 * Soft delete a brand (set is_active to false)
 */
export async function deleteBrand(id: string): Promise<void> {
    const context = await verifyOwner()
    const supabase = createAdminClient()

    // Check if this is the default brand
    const { data: brand } = await supabase
        .from('brands')
        .select('is_default')
        .eq('id', id)
        .eq('tenant_id', context.tenantId)
        .single()

    if (brand?.is_default) {
        throw new Error('Cannot delete the default brand')
    }

    const { error } = await supabase
        .from('brands')
        .update({ is_active: false })
        .eq('id', id)
        .eq('tenant_id', context.tenantId)

    if (error) throw error

    revalidatePath('/brands')
}

/**
 * Set a brand as default
 */
export async function setDefaultBrand(id: string): Promise<void> {
    await verifyOwner()
    const supabase = await createClient()

    const { error } = await supabase
        .rpc('set_default_brand', { p_brand_id: id })

    if (error) throw error

    revalidatePath('/brands')
    revalidatePath('/', 'layout')
}

/**
 * Increment document counter and return new value
 */
export async function incrementBrandCounter(
    brandId: string,
    counterType: 'invoice' | 'kuitansi' | 'spk'
): Promise<number> {
    await verifyOwner()
    const supabase = createAdminClient()

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
