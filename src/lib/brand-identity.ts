import { cache } from 'react'
import { createAdminClient } from '@/lib/supabase/admin'

export interface ApplicationIdentity {
    name: string
    logoUrl: string | null
}

const FALLBACK_IDENTITY: ApplicationIdentity = {
    name: 'ERP Konveksi',
    logoUrl: null,
}

/**
 * Reads only the public application identity from the active default brand.
 * This stays server-only so the login page never receives bank or company data.
 */
export const getApplicationIdentity = cache(async (): Promise<ApplicationIdentity> => {
    try {
        const supabase = createAdminClient()
        const { data, error } = await supabase
            .from('brands')
            .select('name, logo_url')
            .eq('is_default', true)
            .eq('is_active', true)
            .single()

        if (error || !data?.name) {
            if (error) {
                console.error('Failed to load application identity:', error.message)
            }
            return FALLBACK_IDENTITY
        }

        return {
            name: data.name,
            logoUrl: data.logo_url ?? null,
        }
    } catch (error) {
        console.error('Failed to load application identity:', error)
        return FALLBACK_IDENTITY
    }
})
