"use client"

import { createContext, useContext, useReducer, useEffect } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

const AppStateContext = createContext()

const initialState = {
    user: null,
    session: null,
    loading: true,
    lastUpdate: Date.now(),
    operationStates: new Map() // Track ongoing operations
}

function appStateReducer(state, action) {
    switch (action.type) {
        case 'SET_AUTH':
            return {
                ...state,
                user: action.user,
                session: action.session,
                loading: false,
                lastUpdate: Date.now()
            }
        case 'SET_LOADING':
            return {
                ...state,
                loading: action.loading
            }
        case 'SET_OPERATION_STATE':
            const newOperationStates = new Map(state.operationStates)
            if (action.isActive) {
                newOperationStates.set(action.operation, true)
            } else {
                newOperationStates.delete(action.operation)
            }
            return {
                ...state,
                operationStates: newOperationStates
            }
        case 'FORCE_REFRESH':
            return {
                ...state,
                lastUpdate: Date.now()
            }
        case 'CLEAR_STATE':
            return {
                ...initialState,
                loading: false
            }
        default:
            return state
    }
}

export function AppStateProvider({ children }) {
    const [state, dispatch] = useReducer(appStateReducer, initialState)
    const supabase = getSupabaseBrowserClient()

    useEffect(() => {
        let mounted = true

        const initializeAuth = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession()

                if (mounted) {
                    dispatch({
                        type: 'SET_AUTH',
                        user: session?.user ?? null,
                        session: session
                    })
                }
            } catch (error) {
                console.error('Error initializing auth:', error)
                if (mounted) {
                    dispatch({ type: 'SET_LOADING', loading: false })
                }
            }
        }

        initializeAuth()

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (!mounted) return

                console.log('Auth state changed:', event, session?.user?.id)

                dispatch({
                    type: 'SET_AUTH',
                    user: session?.user ?? null,
                    session: session
                })

                // Handle sign out
                if (event === 'SIGNED_OUT') {
                    dispatch({ type: 'CLEAR_STATE' })
                    // Clear any cached data
                    if (typeof window !== 'undefined') {
                        try {
                            localStorage.removeItem('supabase.auth.token')
                            sessionStorage.clear()
                        } catch (error) {
                            console.warn('Error clearing storage:', error)
                        }
                    }
                }
            }
        )

        return () => {
            mounted = false
            subscription?.unsubscribe()
        }
    }, [supabase.auth])

    const value = {
        ...state,
        dispatch,
        // Helper functions
        setOperationState: (operation, isActive) => {
            dispatch({ type: 'SET_OPERATION_STATE', operation, isActive })
        },
        forceRefresh: () => {
            dispatch({ type: 'FORCE_REFRESH' })
        },
        isOperationActive: (operation) => {
            return state.operationStates.has(operation)
        }
    }

    return (
        <AppStateContext.Provider value={value}>
            {children}
        </AppStateContext.Provider>
    )
}

export function useAppState() {
    const context = useContext(AppStateContext)
    if (!context) {
        throw new Error('useAppState must be used within an AppStateProvider')
    }
    return context
}
