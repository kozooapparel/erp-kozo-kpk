import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getBrands } from '@/lib/actions/brands'
import BrandsPageClient from './BrandsPageClient'

export const dynamic = 'force-dynamic'

export default async function BrandsPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Fetch profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    // Check if owner
    if (profile?.role !== 'owner') {
        redirect('/dashboard')
    }

    const brands = await getBrands()

    return <BrandsPageClient brands={brands} user={profile} />
}
