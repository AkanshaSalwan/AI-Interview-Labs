'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/services/supabaseClient.js'



const UserDetailContext = createContext(null)

function Provider({ children }) {
    const [user, setUser] = useState(null)

    useEffect(() => {
        const supabase = createClient()
        const usersBeingCreated = new Set()

        const createNewUser = async (authenticatedUser) => {
            if (!authenticatedUser?.email) {
                return
            }
            if (usersBeingCreated.has(authenticatedUser.id)) {
                return
            }
            usersBeingCreated.add(authenticatedUser.id)

            try {
                const { data: existingUser, error: lookupError } = await supabase
                    .from('Users')
                    .select('*')
                    .eq('email', authenticatedUser.email)
                    .maybeSingle()

                if (lookupError) {
                    throw lookupError
                }
                if (existingUser) {
                    setUser(existingUser)
                    return
                }

                const newUser = {
                    name: authenticatedUser.user_metadata?.name ?? authenticatedUser.user_metadata?.full_name,
                    email: authenticatedUser.email,
                    picture: authenticatedUser.user_metadata?.picture ?? authenticatedUser.user_metadata?.avatar_url,
                }

                const { data: insertedUser, error: insertError } = await supabase
                    .from('Users')
                    .insert([newUser])
                    .select()
                    .single()

                if (insertError) {
                    throw insertError
                }

                setUser(insertedUser ?? newUser)
            } catch (error) {
                usersBeingCreated.delete(authenticatedUser.id)
                throw error
            }
        }

        const handleUser = (authenticatedUser) => {
            if (!authenticatedUser) {
                setUser(null)
                return
            }

            createNewUser(authenticatedUser).catch((error) => {
                console.error('Unable to create the Supabase user record:', error)
            })
        }

        // Fires once on load with the current session (INITIAL_SESSION, or null when signed out),
        // then on every sign-in, sign-out and token refresh.
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            setTimeout(() => handleUser(session?.user ?? null), 0)
        })

        return () => subscription.unsubscribe()
    }, [])

    return (
        <UserDetailContext.Provider value={{ user, setUser }}>
            {children}
        </UserDetailContext.Provider>
    )
}

export default Provider

export function DashboardProvider({ children }) {
    const context = useContext(UserDetailContext)

    if (!context) {
        throw new Error('DashboardProvider must be used within a Provider')
    }

    return (
        <UserDetailContext.Provider value={context}>
            {children}
        </UserDetailContext.Provider>
    )
}

export const useUser = () => {
    const context = useContext(UserDetailContext)
    if (!context) {
        throw new Error('useUser must be used within a Provider')
    }
    return context
}