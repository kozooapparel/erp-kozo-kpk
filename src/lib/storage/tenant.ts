import 'server-only'

import { createClient } from '@/lib/supabase/server'

export type TenantContext = {
    userId: string
    tenantId: string
    isOwner: boolean
}

export async function requireTenantContext(options?: { owner?: boolean }): Promise<TenantContext> {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('Authentication required')

    const [{ data: profile, error: profileError }, { data: membership, error: membershipError }] = await Promise.all([
        supabase.from('profiles').select('role').eq('id', user.id).single(),
        supabase
            .from('tenant_memberships')
            .select('tenant_id')
            .eq('user_id', user.id)
            .eq('is_default', true)
            .single(),
    ])

    if (profileError || !profile || membershipError || !membership) {
        throw new Error('Tenant membership is not configured')
    }

    const isOwner = profile.role === 'owner'
    if (options?.owner && !isOwner) throw new Error('Owner access required')

    return { userId: user.id, tenantId: membership.tenant_id, isOwner }
}
