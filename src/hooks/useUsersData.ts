import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react'
import { get, onValue, ref, set, type DatabaseReference } from 'firebase/database'

import { database } from '../lib/firebase'
import { USERNAME_SEED, USER_STORAGE_KEY, parseUsersSnapshot, parseUsernamesSnapshot } from '../lib/stickerHelpers'
import type { UserRecord, UsersState } from '../types/stickers'

export type SetUserRecord = (userName: string, updater: (current: UserRecord) => UserRecord) => void

function getUserFieldRef(username: string, field: 'stickers' | 'duplicates'): DatabaseReference {
  return ref(database, `users/${username}/${field}`)
}

function useUsersData(): {
  users: UsersState
  availableUsers: string[]
  selectedUser: string | null
  setSelectedUser: Dispatch<SetStateAction<string | null>>
  activeSelectedUser: string | null
  isConnected: boolean
  error: string | null
  setError: Dispatch<SetStateAction<string | null>>
  setUserRecord: SetUserRecord
} {
  const [users, setUsers] = useState<UsersState>({})
  const [availableUsers, setAvailableUsers] = useState<string[]>(() => Object.keys(USERNAME_SEED))
  const [selectedUser, setSelectedUser] = useState<string | null>(() => {
    const storedUser = localStorage.getItem(USER_STORAGE_KEY)
    if (storedUser == null || storedUser.trim().length === 0) {
      return null
    }

    return storedUser
  })
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const activeSelectedUser = useMemo(() => {
    if (selectedUser != null && availableUsers.includes(selectedUser)) {
      return selectedUser
    }

    return null
  }, [availableUsers, selectedUser])

  useEffect(() => {
    const usersRef = ref(database, 'users')
    const unsubscribe = onValue(usersRef, (snapshot) => {
      setUsers(parseUsersSnapshot(snapshot.val()))
    })

    return () => {
      unsubscribe()
    }
  }, [])

  useEffect(() => {
    const usernamesRef = ref(database, 'usernames')
    const unsubscribe = onValue(
      usernamesRef,
      (snapshot) => {
        const parsedUsernames = parseUsernamesSnapshot(snapshot.val())

        if (parsedUsernames.length === 0) {
          const seededNames = Object.keys(USERNAME_SEED)
          void set(usernamesRef, USERNAME_SEED).catch(() => null)
          setAvailableUsers(seededNames)
          return
        }

        setAvailableUsers(parsedUsernames)
      },
      () => {
        setAvailableUsers(Object.keys(USERNAME_SEED))
      },
    )

    return () => {
      unsubscribe()
    }
  }, [])

  useEffect(() => {
    const connectedRef = ref(database, '.info/connected')
    const unsubscribe = onValue(connectedRef, (snapshot) => {
      setIsConnected(snapshot.val() === true)
    })

    return () => {
      unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (activeSelectedUser != null) {
      localStorage.setItem(USER_STORAGE_KEY, activeSelectedUser)
      return
    }

    localStorage.removeItem(USER_STORAGE_KEY)
  }, [activeSelectedUser])

  useEffect(() => {
    if (activeSelectedUser == null) {
      return
    }

    const userStickersRef = getUserFieldRef(activeSelectedUser, 'stickers')
    const userDuplicatesRef = getUserFieldRef(activeSelectedUser, 'duplicates')

    void get(userStickersRef)
      .then((snapshot) => {
        if (!snapshot.exists()) {
          return set(userStickersRef, {})
        }

        return null
      })
      .catch(() => null)

    void get(userDuplicatesRef)
      .then((snapshot) => {
        if (!snapshot.exists()) {
          return set(userDuplicatesRef, {})
        }

        return null
      })
      .catch(() => null)
  }, [activeSelectedUser])

  function setUserRecord(userName: string, updater: (current: UserRecord) => UserRecord): void {
    setUsers((previousUsers) => {
      const current = previousUsers[userName] ?? { stickers: {}, duplicates: {} }
      return {
        ...previousUsers,
        [userName]: updater(current),
      }
    })
  }

  return {
    users,
    availableUsers,
    selectedUser,
    setSelectedUser,
    activeSelectedUser,
    isConnected,
    error,
    setError,
    setUserRecord,
  }
}

export default useUsersData
