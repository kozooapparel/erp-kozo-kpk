'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type {
    Barang,
    BarangInsert,
    BarangUpdate,
    BarangHargaTier,
    BarangHargaTierInsert,
    BarangWithTiers
} from '@/types/database'

/**
 * Get all active barang
 */
export async function getBarangList(): Promise<Barang[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('barang')
        .select('*')
        .eq('is_active', true)
        .order('nama_barang', { ascending: true })

    if (error) {
        console.error('Error fetching barang:', error)
        throw new Error('Failed to fetch barang')
    }

    return data || []
}

/**
 * Get barang by ID with harga tiers
 */
export async function getBarangById(id: string): Promise<BarangWithTiers | null> {
    const supabase = await createClient()

    const { data: barang, error: barangError } = await supabase
        .from('barang')
        .select('*')
        .eq('id', id)
        .single()

    if (barangError) {
        console.error('Error fetching barang:', barangError)
        return null
    }

    const { data: tiers, error: tiersError } = await supabase
        .from('barang_harga_tier')
        .select('*')
        .eq('barang_id', id)
        .order('min_qty', { ascending: true })

    if (tiersError) {
        console.error('Error fetching harga tiers:', tiersError)
    }

    return {
        ...barang,
        harga_tiers: tiers || []
    }
}

/**
 * Get harga based on quantity tier
 */
export async function getHargaByQty(barangId: string, qty: number): Promise<number> {
    const supabase = await createClient()

    // First try to get tier-based price
    const { data: tiers } = await supabase
        .from('barang_harga_tier')
        .select('*')
        .eq('barang_id', barangId)
        .order('min_qty', { ascending: true })

    if (tiers && tiers.length > 0) {
        // Find matching tier
        for (const tier of tiers) {
            const maxQty = tier.max_qty ?? Infinity
            if (qty >= tier.min_qty && qty <= maxQty) {
                return tier.harga
            }
        }
    }

    // Fallback to default harga_satuan
    const { data: barang } = await supabase
        .from('barang')
        .select('harga_satuan')
        .eq('id', barangId)
        .single()

    return barang?.harga_satuan || 0
}

/**
 * Create new barang
 */
export async function createBarang(
    data: BarangInsert,
    hargaTiers?: Omit<BarangHargaTierInsert, 'barang_id'>[]
): Promise<Barang | null> {
    const supabase = await createClient()

    const { data: barang, error } = await supabase
        .from('barang')
        .insert(data)
        .select()
        .single()

    if (error) {
        console.error('Error creating barang:', error)
        throw new Error('Failed to create barang')
    }

    // Insert harga tiers if provided
    if (barang && hargaTiers && hargaTiers.length > 0) {
        const tiersWithBarangId = hargaTiers.map(tier => ({
            ...tier,
            barang_id: barang.id
        }))

        const { error: tiersError } = await supabase
            .from('barang_harga_tier')
            .insert(tiersWithBarangId)

        if (tiersError) {
            console.error('Error creating harga tiers:', tiersError)
        }
    }

    revalidatePath('/barang')
    return barang
}

/**
 * Update barang
 */
export async function updateBarang(
    id: string,
    data: BarangUpdate,
    hargaTiers?: Omit<BarangHargaTierInsert, 'barang_id'>[]
): Promise<Barang | null> {
    const supabase = await createClient()

    const { data: barang, error } = await supabase
        .from('barang')
        .update(data)
        .eq('id', id)
        .select()
        .single()

    if (error) {
        console.error('Error updating barang:', error)
        throw new Error('Failed to update barang')
    }

    // Update harga tiers if provided
    if (hargaTiers !== undefined) {
        // Delete existing tiers
        await supabase
            .from('barang_harga_tier')
            .delete()
            .eq('barang_id', id)

        // Insert new tiers
        if (hargaTiers.length > 0) {
            const tiersWithBarangId = hargaTiers.map(tier => ({
                ...tier,
                barang_id: id
            }))

            const { error: tiersError } = await supabase
                .from('barang_harga_tier')
                .insert(tiersWithBarangId)

            if (tiersError) {
                console.error('Error updating harga tiers:', tiersError)
            }
        }
    }

    revalidatePath('/barang')
    return barang
}

/**
 * Soft delete barang (set is_active = false)
 */
export async function deleteBarang(id: string): Promise<boolean> {
    const supabase = await createClient()

    const { error } = await supabase
        .from('barang')
        .update({ is_active: false })
        .eq('id', id)

    if (error) {
        console.error('Error deleting barang:', error)
        throw new Error('Failed to delete barang')
    }

    revalidatePath('/barang')
    return true
}

/**
 * Search barang by name
 */
export async function searchBarang(query: string): Promise<Barang[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('barang')
        .select('*')
        .eq('is_active', true)
        .ilike('nama_barang', `%${query}%`)
        .order('nama_barang', { ascending: true })
        .limit(10)

    if (error) {
        console.error('Error searching barang:', error)
        return []
    }

    return data || []
}
