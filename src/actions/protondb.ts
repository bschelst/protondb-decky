import { fetchNoCors } from '@decky/api';
import ProtonDBTier from '../../types/ProtonDBTier'

export async function getProtonDBInfo(
  appId: string
): Promise<ProtonDBTier | undefined> {
  try {
    const res = await fetchNoCors(
      `https://www.protondb.com/api/v1/reports/summaries/${appId}.json`,
      {
        method: 'GET'
      }
    )

    if (res.status === 200) {
      return (await res.json())?.tier
    }
  } catch (error) {
   console.log(error)
   return "pending"
  }
  return undefined
}

export async function getLinuxInfo(
  appId: string
): Promise<boolean> {
  try {
    const res = await fetchNoCors(
      `https://store.steampowered.com/api/appdetails/?appids=${appId}`,
      {
        method: 'GET'
      }
    )

    if (res.status === 200) {
      return Boolean(
        (await res.json())?.[appId as string]?.data?.platforms?.linux
      )
    }
  } catch (error) {
   console.log(error);
  }
  return false
}

export async function checkProtonDBLoginStatus(): Promise<boolean> {
  try {
    // Check if user is logged in by accessing the contribute page
    const res = await fetchNoCors(
      'https://www.protondb.com/contribute',
      {
        method: 'GET',
        credentials: 'include'
      }
    )

    if (res.status === 200) {
      const text = await res.text()

      // If the page contains "Not Ready Yet!" or "Not logged in with Steam", user is not logged in
      const isNotLoggedIn = text.includes('Not Ready Yet!') ||
                           text.includes('Not logged in with Steam')

      // Return true if user IS logged in (i.e., NOT showing the error messages)
      return !isNotLoggedIn
    }

    // If we can't get the page, assume not logged in
    return false
  } catch (error) {
    console.log('ProtonDB login check failed:', error)
    // If we can't check, assume not logged in for safety
    return false
  }
}

