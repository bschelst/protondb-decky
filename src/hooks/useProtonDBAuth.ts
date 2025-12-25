import { useEffect, useState } from 'react'
import { checkProtonDBLoginStatus } from '../actions/protondb'

export default function useProtonDBAuth() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null) // null = checking, false = not logged in, true = logged in
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const checkLoginStatus = async () => {
      try {
        setIsLoading(true)
        const loggedIn = await checkProtonDBLoginStatus()
        if (mounted) {
          setIsLoggedIn(loggedIn)
        }
      } catch (error) {
        console.error('Failed to check ProtonDB login status:', error)
        if (mounted) {
          setIsLoggedIn(false)
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    checkLoginStatus()

    return () => {
      mounted = false
    }
  }, [])

  const recheckLoginStatus = async () => {
    setIsLoading(true)
    try {
      const loggedIn = await checkProtonDBLoginStatus()
      setIsLoggedIn(loggedIn)
    } catch (error) {
      console.error('Failed to recheck ProtonDB login status:', error)
      setIsLoggedIn(false)
    } finally {
      setIsLoading(false)
    }
  }

  return { isLoggedIn, isLoading, recheckLoginStatus }
}