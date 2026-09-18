'use client'

import { createContext, useContext } from 'react'

export interface ApplicationIdentity {
    name: string
    logoUrl: string | null
}

const FALLBACK_IDENTITY: ApplicationIdentity = {
    name: 'RAIDWEAR',
    logoUrl: null,
}

const AppIdentityContext = createContext<ApplicationIdentity>(FALLBACK_IDENTITY)

export function AppIdentityProvider({
    identity,
    children,
}: {
    identity: ApplicationIdentity
    children: React.ReactNode
}) {
    return (
        <AppIdentityContext.Provider value={identity}>
            {children}
        </AppIdentityContext.Provider>
    )
}

export function useApplicationIdentity() {
    return useContext(AppIdentityContext)
}
