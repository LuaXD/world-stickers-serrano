import { useEffect, useMemo, useRef, useState } from 'react'
import { get, onValue, ref, remove, set, type DatabaseReference } from 'firebase/database'
import { database } from './lib/firebase'

type SectionDefinition = {
  code: string
  name: string
  flag: string
  stickerCount: number
}

type UserStickers = Record<string, Record<string, true>>
type UserDuplicates = Record<string, Record<string, number>>
type UserRecord = {
  stickers: UserStickers
  duplicates: UserDuplicates
}
type UsersState = Record<string, UserRecord>
type AppTab = 'album' | 'duplicates'
type ActiveOwners = {
  key: string
  label: string
}

const USER_STORAGE_KEY = 'mundial:selected-user'
const USERNAME_SEED: Record<string, true> = {
  Addis: true,
  Carlos: true,
  Mija: true,
  'Mija Pro': true,
  Gamax: true,
  Botas: true,
  Kevin: true,
}

const ALBUM_SECTIONS: SectionDefinition[] = [
  { code: 'FWC', name: 'World Cup Legends', flag: '⭐', stickerCount: 20 },
  { code: 'CC', name: 'Coca-Cola', flag: '🥤', stickerCount: 14 },
  { code: 'MEX', name: 'Mexico', flag: '🇲🇽', stickerCount: 20 },
  { code: 'RSA', name: 'South Africa', flag: '🇿🇦', stickerCount: 20 },
  { code: 'KOR', name: 'South Korea', flag: '🇰🇷', stickerCount: 20 },
  { code: 'CZE', name: 'Czechia', flag: '🇨🇿', stickerCount: 20 },
  { code: 'CAN', name: 'Canada', flag: '🇨🇦', stickerCount: 20 },
  { code: 'BIH', name: 'Bosnia', flag: '🇧🇦', stickerCount: 20 },
  { code: 'QAT', name: 'Qatar', flag: '🇶🇦', stickerCount: 20 },
  { code: 'SUI', name: 'Switzerland', flag: '🇨🇭', stickerCount: 20 },
  { code: 'BRA', name: 'Brazil', flag: '🇧🇷', stickerCount: 20 },
  { code: 'MAR', name: 'Morocco', flag: '🇲🇦', stickerCount: 20 },
  { code: 'HAI', name: 'Haiti', flag: '🇭🇹', stickerCount: 20 },
  { code: 'SCO', name: 'Scotland', flag: '🏴', stickerCount: 20 },
  { code: 'USA', name: 'United States', flag: '🇺🇸', stickerCount: 20 },
  { code: 'PAR', name: 'Paraguay', flag: '🇵🇾', stickerCount: 20 },
  { code: 'AUS', name: 'Australia', flag: '🇦🇺', stickerCount: 20 },
  { code: 'TUR', name: 'Turkey', flag: '🇹🇷', stickerCount: 20 },
  { code: 'GER', name: 'Germany', flag: '🇩🇪', stickerCount: 20 },
  { code: 'CUW', name: 'Curacao', flag: '🇨🇼', stickerCount: 20 },
  { code: 'CIV', name: 'Ivory Coast', flag: '🇨🇮', stickerCount: 20 },
  { code: 'ECU', name: 'Ecuador', flag: '🇪🇨', stickerCount: 20 },
  { code: 'NED', name: 'Netherlands', flag: '🇳🇱', stickerCount: 20 },
  { code: 'JPN', name: 'Japan', flag: '🇯🇵', stickerCount: 20 },
  { code: 'SWE', name: 'Sweden', flag: '🇸🇪', stickerCount: 20 },
  { code: 'TUN', name: 'Tunisia', flag: '🇹🇳', stickerCount: 20 },
  { code: 'BEL', name: 'Belgium', flag: '🇧🇪', stickerCount: 20 },
  { code: 'EGY', name: 'Egypt', flag: '🇪🇬', stickerCount: 20 },
  { code: 'IRN', name: 'Iran', flag: '🇮🇷', stickerCount: 20 },
  { code: 'NZL', name: 'New Zealand', flag: '🇳🇿', stickerCount: 20 },
  { code: 'ESP', name: 'Spain', flag: '🇪🇸', stickerCount: 20 },
  { code: 'CPV', name: 'Cape Verde', flag: '🇨🇻', stickerCount: 20 },
  { code: 'KSA', name: 'Saudi Arabia', flag: '🇸🇦', stickerCount: 20 },
  { code: 'URU', name: 'Uruguay', flag: '🇺🇾', stickerCount: 20 },
  { code: 'FRA', name: 'France', flag: '🇫🇷', stickerCount: 20 },
  { code: 'SEN', name: 'Senegal', flag: '🇸🇳', stickerCount: 20 },
  { code: 'IRQ', name: 'Iraq', flag: '🇮🇶', stickerCount: 20 },
  { code: 'NOR', name: 'Norway', flag: '🇳🇴', stickerCount: 20 },
  { code: 'ARG', name: 'Argentina', flag: '🇦🇷', stickerCount: 20 },
  { code: 'ALG', name: 'Algeria', flag: '🇩🇿', stickerCount: 20 },
  { code: 'AUT', name: 'Austria', flag: '🇦🇹', stickerCount: 20 },
  { code: 'JOR', name: 'Jordan', flag: '🇯🇴', stickerCount: 20 },
  { code: 'POR', name: 'Portugal', flag: '🇵🇹', stickerCount: 20 },
  { code: 'COD', name: 'DR Congo', flag: '🇨🇩', stickerCount: 20 },
  { code: 'UZB', name: 'Uzbekistan', flag: '🇺🇿', stickerCount: 20 },
  { code: 'COL', name: 'Colombia', flag: '🇨🇴', stickerCount: 20 },
  { code: 'ENG', name: 'England', flag: '🏴', stickerCount: 20 },
  { code: 'CRO', name: 'Croatia', flag: '🇭🇷', stickerCount: 20 },
  { code: 'GHA', name: 'Ghana', flag: '🇬🇭', stickerCount: 20 },
  { code: 'PAN', name: 'Panama', flag: '🇵🇦', stickerCount: 20 },
]

function normalizeCode(value: string): string {
  return value.trim().toUpperCase()
}

function isValidStickerIndex(sectionCode: string, stickerIndex: number): boolean {
  if (!Number.isInteger(stickerIndex)) {
    return false
  }

  if (sectionCode === 'FWC') {
    return stickerIndex >= 0
  }

  return stickerIndex > 0
}

function addStickerToUser(target: UserStickers, sectionCode: string, stickerIndex: number): void {
  if (!isValidStickerIndex(sectionCode, stickerIndex)) {
    return
  }

  target[sectionCode] ??= {}
  target[sectionCode][String(stickerIndex)] = true
}

function addDuplicateCount(
  target: UserDuplicates,
  sectionCode: string,
  stickerIndex: number,
  count: number,
): void {
  if (!isValidStickerIndex(sectionCode, stickerIndex)) {
    return
  }

  if (!Number.isFinite(count)) {
    return
  }

  const normalizedCount = Math.trunc(count)
  if (normalizedCount <= 0) {
    return
  }

  target[sectionCode] ??= {}
  target[sectionCode][String(stickerIndex)] =
    (target[sectionCode][String(stickerIndex)] ?? 0) + normalizedCount
}

function parseUserStickers(value: unknown): UserStickers {
  if (value == null || typeof value !== 'object') {
    return {}
  }

  const stickers: UserStickers = {}
  const rawStickers = value as Record<string, unknown>

  for (const [rawKey, rawValue] of Object.entries(rawStickers)) {
    if (rawValue != null && typeof rawValue === 'object') {
      const sectionCode = normalizeCode(rawKey)
      const sectionRecord = rawValue as Record<string, unknown>

      for (const [rawIndex, rawOwnedValue] of Object.entries(sectionRecord)) {
        const stickerIndex = Number.parseInt(rawIndex, 10)
        const isOwned =
          rawOwnedValue === true ||
          (typeof rawOwnedValue === 'number' && rawOwnedValue > 0) ||
          rawOwnedValue === 'true'

        if (isOwned) {
          addStickerToUser(stickers, sectionCode, stickerIndex)
        }
      }

      continue
    }

    const match = /^(.+)\s+(\d+)$/.exec(rawKey)
    if (match == null) {
      continue
    }

    const sectionCode = normalizeCode(match[1])
    const stickerIndex = Number.parseInt(match[2], 10)
    const isOwned =
      rawValue === true || (typeof rawValue === 'number' && rawValue > 0) || rawValue === 'true'

    if (isOwned) {
      addStickerToUser(stickers, sectionCode, stickerIndex)
    }
  }

  return stickers
}

function parseUserDuplicates(value: unknown): UserDuplicates {
  if (value == null || typeof value !== 'object') {
    return {}
  }

  const duplicates: UserDuplicates = {}
  const rawDuplicates = value as Record<string, unknown>

  for (const [rawKey, rawValue] of Object.entries(rawDuplicates)) {
    if (rawValue != null && typeof rawValue === 'object') {
      const sectionCode = normalizeCode(rawKey)
      const sectionRecord = rawValue as Record<string, unknown>

      for (const [rawIndex, rawCountValue] of Object.entries(sectionRecord)) {
        const stickerIndex = Number.parseInt(rawIndex, 10)
        const numericValue =
          typeof rawCountValue === 'number'
            ? rawCountValue
            : Number.parseInt(String(rawCountValue), 10)

        addDuplicateCount(duplicates, sectionCode, stickerIndex, numericValue)
      }

      continue
    }

    const match = /^(.+)\s+(\d+)$/.exec(rawKey)
    if (match == null) {
      continue
    }

    const sectionCode = normalizeCode(match[1])
    const stickerIndex = Number.parseInt(match[2], 10)
    const numericValue =
      typeof rawValue === 'number' ? rawValue : Number.parseInt(String(rawValue), 10)

    addDuplicateCount(duplicates, sectionCode, stickerIndex, numericValue)
  }

  return duplicates
}

function parseDuplicateFallbackFromStickers(value: unknown): UserDuplicates {
  if (value == null || typeof value !== 'object') {
    return {}
  }

  const duplicates: UserDuplicates = {}
  const rawStickers = value as Record<string, unknown>

  for (const [rawKey, rawValue] of Object.entries(rawStickers)) {
    if (rawValue != null && typeof rawValue === 'object') {
      const sectionCode = normalizeCode(rawKey)
      const sectionRecord = rawValue as Record<string, unknown>

      for (const [rawIndex, rawCountValue] of Object.entries(sectionRecord)) {
        if (typeof rawCountValue !== 'number') {
          continue
        }

        const stickerIndex = Number.parseInt(rawIndex, 10)
        addDuplicateCount(duplicates, sectionCode, stickerIndex, rawCountValue - 1)
      }

      continue
    }

    if (typeof rawValue !== 'number') {
      continue
    }

    const match = /^(.+)\s+(\d+)$/.exec(rawKey)
    if (match == null) {
      continue
    }

    const sectionCode = normalizeCode(match[1])
    const stickerIndex = Number.parseInt(match[2], 10)
    addDuplicateCount(duplicates, sectionCode, stickerIndex, rawValue - 1)
  }

  return duplicates
}

function mergeDuplicateMaps(primary: UserDuplicates, secondary: UserDuplicates): UserDuplicates {
  const merged: UserDuplicates = {}
  const sections = new Set<string>([...Object.keys(primary), ...Object.keys(secondary)])

  for (const sectionCode of sections) {
    const sectionValues: Record<string, number> = {}
    const primarySection = primary[sectionCode] ?? {}
    const secondarySection = secondary[sectionCode] ?? {}
    const stickerKeys = new Set<string>([
      ...Object.keys(primarySection),
      ...Object.keys(secondarySection),
    ])

    for (const stickerKey of stickerKeys) {
      const total = (primarySection[stickerKey] ?? 0) + (secondarySection[stickerKey] ?? 0)
      if (total > 0) {
        sectionValues[stickerKey] = total
      }
    }

    if (Object.keys(sectionValues).length > 0) {
      merged[sectionCode] = sectionValues
    }
  }

  return merged
}

function parseUserRecord(rawUserData: unknown): UserRecord {
  if (rawUserData == null || typeof rawUserData !== 'object') {
    return { stickers: {}, duplicates: {} }
  }

  const userData = rawUserData as { stickers?: unknown; duplicates?: unknown }
  const stickers = parseUserStickers(userData.stickers)
  const duplicatesFromPath = parseUserDuplicates(userData.duplicates)
  const duplicatesFromStickers = parseDuplicateFallbackFromStickers(userData.stickers)
  const duplicates = mergeDuplicateMaps(duplicatesFromPath, duplicatesFromStickers)

  return { stickers, duplicates }
}

function parseUsersSnapshot(value: unknown): UsersState {
  if (value == null || typeof value !== 'object') {
    return {}
  }

  const users: UsersState = {}
  const rawUsers = value as Record<string, unknown>

  for (const [username, rawUserData] of Object.entries(rawUsers)) {
    users[username] = parseUserRecord(rawUserData)
  }

  return users
}

function parseUsernamesSnapshot(value: unknown): string[] {
  if (value == null || typeof value !== 'object') {
    return []
  }

  const names: string[] = []
  const entries = Object.entries(value as Record<string, unknown>)

  for (const [name, rawValue] of entries) {
    const normalizedName = name.trim()
    const isEnabled =
      rawValue === true ||
      rawValue === 1 ||
      rawValue === 'true' ||
      (typeof rawValue === 'string' && rawValue.trim().length > 0)

    if (normalizedName.length > 0 && isEnabled) {
      names.push(normalizedName)
    }
  }

  return names
}

function getStickerRef(username: string, sectionCode: string, stickerNumber: number): DatabaseReference {
  return ref(database, `users/${username}/stickers/${sectionCode}/${stickerNumber}`)
}

function getDuplicateRef(username: string, sectionCode: string, stickerNumber: number): DatabaseReference {
  return ref(database, `users/${username}/duplicates/${sectionCode}/${stickerNumber}`)
}

function getStickerNumbers(sectionCode: string, stickerCount: number): number[] {
  if (sectionCode === 'FWC') {
    return Array.from({ length: stickerCount }, (_, index) => index)
  }

  return Array.from({ length: stickerCount }, (_, index) => index + 1)
}

function formatStickerLabel(sectionCode: string, stickerNumber: number): string {
  if (sectionCode === 'FWC') {
    return String(stickerNumber).padStart(2, '0')
  }

  return String(stickerNumber)
}

function App() {
  const [users, setUsers] = useState<UsersState>({})
  const [availableUsers, setAvailableUsers] = useState<string[]>(() => Object.keys(USERNAME_SEED))
  const [selectedUser, setSelectedUser] = useState<string | null>(() => {
    const storedUser = localStorage.getItem(USER_STORAGE_KEY)
    if (storedUser == null || storedUser.trim().length === 0) {
      return null
    }

    return storedUser
  })
  const [activeTab, setActiveTab] = useState<AppTab>('album')
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    FWC: true,
    CC: false,
    MEX: false,
  })
  const [showOwnedBySection, setShowOwnedBySection] = useState<Record<string, boolean>>({})
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeOwners, setActiveOwners] = useState<ActiveOwners | null>(null)

  const longPressTimerRef = useRef<number | null>(null)
  const skipNextToggleKeyRef = useRef<string | null>(null)

  const activeSelectedUser = useMemo(() => {
    if (selectedUser != null && availableUsers.includes(selectedUser)) {
      return selectedUser
    }

    return null
  }, [availableUsers, selectedUser])

  useEffect(() => {
    return () => {
      if (longPressTimerRef.current != null) {
        window.clearTimeout(longPressTimerRef.current)
      }
    }
  }, [])

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
          void set(usernamesRef, USERNAME_SEED).catch(() => {
            return null
          })
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

    const userStickersRef = ref(database, `users/${activeSelectedUser}/stickers`)
    const userDuplicatesRef = ref(database, `users/${activeSelectedUser}/duplicates`)

    void get(userStickersRef)
      .then((snapshot) => {
        if (!snapshot.exists()) {
          return set(userStickersRef, {})
        }

        return null
      })
      .catch(() => {
        return null
      })

    void get(userDuplicatesRef)
      .then((snapshot) => {
        if (!snapshot.exists()) {
          return set(userDuplicatesRef, {})
        }

        return null
      })
      .catch(() => {
        return null
      })
  }, [activeSelectedUser])

  const selectedUserData = useMemo<UserRecord>(() => {
    if (activeSelectedUser == null) {
      return { stickers: {}, duplicates: {} }
    }

    return users[activeSelectedUser] ?? { stickers: {}, duplicates: {} }
  }, [activeSelectedUser, users])

  const selectedUserStickers = selectedUserData.stickers
  const selectedUserDuplicates = selectedUserData.duplicates

  const extraSections = useMemo<SectionDefinition[]>(() => {
    const knownCodes = new Set(ALBUM_SECTIONS.map((section) => section.code))
    const unknownCodes = Object.keys(selectedUserStickers).filter((code) => !knownCodes.has(code))

    return unknownCodes.map((code) => {
      const indexes = Object.keys(selectedUserStickers[code] ?? {}).map((value) =>
        Number.parseInt(value, 10),
      )
      const maxValue = indexes.reduce((highest, value) => {
        if (Number.isInteger(value) && value > highest) {
          return value
        }

        return highest
      }, 0)

      return {
        code,
        name: code,
        flag: '🏷️',
        stickerCount: Math.max(maxValue, 20),
      }
    })
  }, [selectedUserStickers])

  const allSections = useMemo(() => {
    return [...ALBUM_SECTIONS, ...extraSections]
  }, [extraSections])

  const filteredSections = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    if (normalizedSearch.length === 0) {
      return allSections
    }

    return allSections.filter((section) => {
      return (
        section.code.toLowerCase().includes(normalizedSearch) ||
        section.name.toLowerCase().includes(normalizedSearch)
      )
    })
  }, [allSections, searchTerm])

  const ownedCounts = useMemo(() => {
    const counts: Record<string, number> = {}

    for (const section of allSections) {
      counts[section.code] = Object.keys(selectedUserStickers[section.code] ?? {}).length
    }

    return counts
  }, [allSections, selectedUserStickers])

  const duplicateCounts = useMemo(() => {
    const counts: Record<string, number> = {}

    for (const section of allSections) {
      const duplicates = selectedUserDuplicates[section.code] ?? {}
      counts[section.code] = Object.values(duplicates).reduce((sum, value) => sum + value, 0)
    }

    return counts
  }, [allSections, selectedUserDuplicates])

  const friendDuplicateOwners = useMemo(() => {
    const owners: Record<string, string[]> = {}

    for (const [username, userData] of Object.entries(users)) {
      if (activeSelectedUser != null && username === activeSelectedUser) {
        continue
      }

      for (const [sectionCode, sectionDuplicates] of Object.entries(userData.duplicates)) {
        const friendSectionStickers = userData.stickers[sectionCode] ?? {}

        for (const [stickerKey, count] of Object.entries(sectionDuplicates)) {
          if (count <= 0) {
            continue
          }

          if (friendSectionStickers[stickerKey] !== true) {
            continue
          }

          const mapKey = `${sectionCode}:${stickerKey}`
          owners[mapKey] ??= []

          if (count > 1) {
            owners[mapKey].push(`${username} (${count})`)
          } else {
            owners[mapKey].push(username)
          }
        }
      }
    }

    for (const key of Object.keys(owners)) {
      owners[key] = owners[key].sort((left, right) => left.localeCompare(right))
    }

    return owners
  }, [activeSelectedUser, users])

  const totals = useMemo(() => {
    let owned = 0
    let albumTotal = 0
    let duplicates = 0

    for (const section of allSections) {
      owned += ownedCounts[section.code] ?? 0
      albumTotal += section.stickerCount
      duplicates += duplicateCounts[section.code] ?? 0
    }

    const percentage = albumTotal === 0 ? 0 : Math.round((owned / albumTotal) * 100)
    return { owned, albumTotal, percentage, duplicates }
  }, [allSections, duplicateCounts, ownedCounts])

  const activeOwnersList = useMemo(() => {
    if (activeOwners == null) {
      return []
    }

    return friendDuplicateOwners[activeOwners.key] ?? []
  }, [activeOwners, friendDuplicateOwners])

  function setUserRecord(userName: string, updater: (current: UserRecord) => UserRecord): void {
    setUsers((previousUsers) => {
      const current = previousUsers[userName] ?? { stickers: {}, duplicates: {} }
      return {
        ...previousUsers,
        [userName]: updater(current),
      }
    })
  }

  async function handleToggleSticker(sectionCode: string, stickerNumber: number) {
    if (activeSelectedUser == null) {
      return
    }

    setError(null)
    const normalizedCode = normalizeCode(sectionCode)
    const stickerKey = String(stickerNumber)
    const isOwned = selectedUserStickers[normalizedCode]?.[stickerKey] === true

    setUserRecord(activeSelectedUser, (current) => {
      const nextStickers: UserStickers = {
        ...current.stickers,
      }
      const nextSectionStickers = {
        ...(nextStickers[normalizedCode] ?? {}),
      }

      if (isOwned) {
        delete nextSectionStickers[stickerKey]
      } else {
        nextSectionStickers[stickerKey] = true
      }

      if (Object.keys(nextSectionStickers).length === 0) {
        delete nextStickers[normalizedCode]
      } else {
        nextStickers[normalizedCode] = nextSectionStickers
      }

      return {
        ...current,
        stickers: nextStickers,
      }
    })

    try {
      if (isOwned) {
        await remove(getStickerRef(activeSelectedUser, normalizedCode, stickerNumber))
        return
      }

      await set(getStickerRef(activeSelectedUser, normalizedCode, stickerNumber), true)
    } catch {
      setError('Unable to update sticker right now.')
      const userRef = ref(database, `users/${activeSelectedUser}`)
      void get(userRef).then((snapshot) => {
        setUserRecord(activeSelectedUser, () => parseUserRecord(snapshot.val()))
      })
    }
  }

  async function handleChangeDuplicate(sectionCode: string, stickerNumber: number, delta: number) {
    if (activeSelectedUser == null) {
      return
    }

    setError(null)
    const normalizedCode = normalizeCode(sectionCode)
    const stickerKey = String(stickerNumber)
    const currentCount = selectedUserDuplicates[normalizedCode]?.[stickerKey] ?? 0
    const nextCount = Math.max(0, currentCount + delta)

    setUserRecord(activeSelectedUser, (current) => {
      const nextDuplicates: UserDuplicates = {
        ...current.duplicates,
      }
      const nextSectionDuplicates = {
        ...(nextDuplicates[normalizedCode] ?? {}),
      }

      if (nextCount <= 0) {
        delete nextSectionDuplicates[stickerKey]
      } else {
        nextSectionDuplicates[stickerKey] = nextCount
      }

      if (Object.keys(nextSectionDuplicates).length === 0) {
        delete nextDuplicates[normalizedCode]
      } else {
        nextDuplicates[normalizedCode] = nextSectionDuplicates
      }

      return {
        ...current,
        duplicates: nextDuplicates,
      }
    })

    try {
      if (nextCount <= 0) {
        await remove(getDuplicateRef(activeSelectedUser, normalizedCode, stickerNumber))
        return
      }

      await set(getDuplicateRef(activeSelectedUser, normalizedCode, stickerNumber), nextCount)
    } catch {
      setError('Unable to update duplicates right now.')
      const userRef = ref(database, `users/${activeSelectedUser}`)
      void get(userRef).then((snapshot) => {
        setUserRecord(activeSelectedUser, () => parseUserRecord(snapshot.val()))
      })
    }
  }

  function handleToggleSection(code: string): void {
    setExpandedSections((previous) => {
      const currentValue = previous[code]
      return {
        ...previous,
        [code]: currentValue == null ? true : !currentValue,
      }
    })
  }

  function handleToggleShowOwned(code: string): void {
    setShowOwnedBySection((previous) => {
      const currentValue = previous[code]
      return {
        ...previous,
        [code]: currentValue == null ? true : !currentValue,
      }
    })
  }

  function handleOwnerHoverStart(meta: ActiveOwners): void {
    setActiveOwners(meta)
  }

  function handleOwnerHoverEnd(metaKey: string): void {
    setActiveOwners((previous) => {
      if (previous != null && previous.key === metaKey) {
        return null
      }

      return previous
    })
  }

  function handleOwnerTouchStart(meta: ActiveOwners | null): void {
    if (meta == null) {
      return
    }

    if (longPressTimerRef.current != null) {
      window.clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }

    longPressTimerRef.current = window.setTimeout(() => {
      setActiveOwners(meta)
      skipNextToggleKeyRef.current = meta.key
      longPressTimerRef.current = null
    }, 420)
  }

  function handleOwnerTouchEnd(metaKey: string): void {
    if (longPressTimerRef.current != null) {
      window.clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }

    handleOwnerHoverEnd(metaKey)
  }

  function handleStickerPress(sectionCode: string, stickerNumber: number): void {
    const normalizedCode = normalizeCode(sectionCode)
    const key = `${normalizedCode}:${stickerNumber}`

    if (skipNextToggleKeyRef.current != null && skipNextToggleKeyRef.current === key) {
      skipNextToggleKeyRef.current = null
      return
    }

    setActiveOwners(null)
    void handleToggleSticker(normalizedCode, stickerNumber)
  }

  if (activeSelectedUser == null) {
    return (
      <main className="mx-auto min-h-[100dvh] w-full max-w-[430px] bg-[#0e0f12] px-5 pb-[max(env(safe-area-inset-bottom),24px)] pt-[max(env(safe-area-inset-top),24px)] text-white">
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5">
          <h1 className="text-2xl font-semibold tracking-tight">Choose your name</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Select one name and start registering stickers with one tap.
          </p>
          <div className="mt-5 space-y-3">
            {availableUsers.map((username) => (
              <button
                key={username}
                type="button"
                className="flex h-12 w-full items-center justify-between rounded-xl border border-zinc-700 bg-zinc-950 px-4 text-left text-base font-medium active:scale-[0.99]"
                onClick={() => {
                  setSelectedUser(username)
                }}
              >
                <span>{username}</span>
                <span className="text-zinc-500">→</span>
              </button>
            ))}
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="mx-auto min-h-[100dvh] w-full max-w-[430px] bg-[#0e0f12] pb-[calc(env(safe-area-inset-bottom)+84px)] pt-[max(env(safe-area-inset-top),16px)] text-white">
      <div className="px-4">
        <header className="pt-2">
          <h1 className="text-[30px] font-semibold leading-tight">
            {activeTab === 'duplicates' ? 'Duplicates' : 'World Cup Album 2026'}
          </h1>
          <div className="mt-2 flex items-center justify-between text-zinc-400">
            <button
              type="button"
              className="rounded-lg border border-zinc-700 px-2 py-1 text-xs active:scale-[0.98]"
              onClick={() => {
                setSelectedUser(null)
              }}
            >
              {activeSelectedUser}
            </button>
            <span
              className={`rounded-full px-2 py-1 text-[11px] ${
                isConnected ? 'bg-emerald-600/30 text-emerald-200' : 'bg-rose-600/30 text-rose-200'
              }`}
            >
              {isConnected ? 'Live' : 'Offline'}
            </span>
          </div>
          <div className="mt-3 border-b border-zinc-800 pb-2">
            {activeTab === 'duplicates' ? (
              <div className="text-sm text-zinc-300">Total: {totals.duplicates}</div>
            ) : (
              <div className="flex items-end justify-between">
                <div className="text-4xl font-semibold leading-none">{totals.owned}</div>
                <div className="mb-1 text-sm text-zinc-400">
                  of {totals.albumTotal} <span className="ml-2 text-white">{totals.percentage}%</span>
                </div>
              </div>
            )}
          </div>
        </header>

        <section className="mt-4">
          <div className="flex items-center gap-2">
            <div className="flex h-12 flex-1 items-center rounded-xl border border-zinc-800 bg-zinc-900 px-3">
              <span className="mr-2 text-zinc-500">⌕</span>
              <input
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value)
                }}
                className="w-full bg-transparent text-[15px] text-zinc-100 outline-none placeholder:text-zinc-500"
                placeholder="Search countries..."
                inputMode="search"
              />
            </div>
            <button
              type="button"
              className="grid h-12 w-12 place-items-center rounded-xl border border-zinc-800 bg-zinc-900 text-xl"
            >
              ↗
            </button>
            <button
              type="button"
              className="grid h-12 w-12 place-items-center rounded-xl border border-zinc-800 bg-zinc-900 text-xl"
            >
              ☰
            </button>
          </div>
        </section>

        {error == null ? null : (
          <p className="mt-3 rounded-xl border border-rose-600/40 bg-rose-600/20 px-3 py-2 text-xs text-rose-100">
            {error}
          </p>
        )}

        <section className="mt-4 space-y-3">
          {filteredSections.map((section) => {
            const isSearching = searchTerm.trim().length > 0
            const isExpanded = isSearching || expandedSections[section.code] === true
            const ownedSet = selectedUserStickers[section.code] ?? {}
            const ownedCount = ownedCounts[section.code] ?? 0
            const duplicateCount = duplicateCounts[section.code] ?? 0
            const stickerNumbers = getStickerNumbers(section.code, section.stickerCount)
            const showOwned = showOwnedBySection[section.code] === true
            const visibleAlbumNumbers = showOwned
              ? stickerNumbers
              : stickerNumbers.filter((number) => ownedSet[String(number)] !== true)

            return (
              <article key={section.code} className="overflow-hidden rounded-2xl bg-zinc-900/85">
                <button
                  type="button"
                  className="flex h-14 w-full items-center justify-between border border-zinc-800 px-3"
                  onClick={() => {
                    handleToggleSection(section.code)
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{section.flag}</span>
                    <span className="text-xl font-semibold tracking-wide">{section.code}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-semibold">
                      {activeTab === 'duplicates'
                        ? duplicateCount
                        : `${ownedCount}/${section.stickerCount}`}
                    </span>
                    <span className="text-zinc-400">{isExpanded ? '⌃' : '⌄'}</span>
                  </div>
                </button>

                {isExpanded ? (
                  <div className="border-x border-b border-zinc-800 px-3 pb-3 pt-3">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <div className="text-xs text-zinc-400">{section.name}</div>
                      {activeTab === 'album' ? (
                        <button
                          type="button"
                          className="rounded-full border border-zinc-700 px-3 py-1 text-[11px] text-zinc-200"
                          onClick={() => {
                            handleToggleShowOwned(section.code)
                          }}
                        >
                          {showOwned ? 'Hide marked' : 'Show marked'}
                        </button>
                      ) : null}
                    </div>

                    {activeTab === 'album' ? (
                      visibleAlbumNumbers.length === 0 ? (
                        <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-4 text-center text-xs text-zinc-400">
                          No missing stickers in this section.
                        </div>
                      ) : (
                        <div className="grid grid-cols-6 gap-2 sm:grid-cols-7">
                          {visibleAlbumNumbers.map((stickerNumber) => {
                            const stickerKey = String(stickerNumber)
                            const isOwned = ownedSet[stickerKey] === true
                            const ownerMapKey = `${section.code}:${stickerKey}`
                            const ownersList = friendDuplicateOwners[ownerMapKey] ?? []
                            const hasOwners = ownersList.length > 0
                            const ownersMeta: ActiveOwners | null = hasOwners
                              ? {
                                  key: ownerMapKey,
                                  label: `${section.code} ${formatStickerLabel(section.code, stickerNumber)}`,
                                }
                              : null

                            return (
                              <button
                                key={`${section.code}-${stickerNumber}`}
                                type="button"
                                className={`h-11 rounded-xl border text-[20px] font-semibold leading-none active:scale-[0.97] ${
                                  isOwned
                                    ? 'border-white bg-white text-zinc-900'
                                    : hasOwners
                                      ? 'border-amber-400/80 bg-amber-500/10 text-amber-200'
                                      : 'border-zinc-500 bg-transparent text-zinc-100'
                                }`}
                                onMouseEnter={() => {
                                  if (ownersMeta != null) {
                                    handleOwnerHoverStart(ownersMeta)
                                  }
                                }}
                                onMouseLeave={() => {
                                  handleOwnerHoverEnd(ownerMapKey)
                                }}
                                onTouchStart={() => {
                                  handleOwnerTouchStart(ownersMeta)
                                }}
                                onTouchEnd={() => {
                                  handleOwnerTouchEnd(ownerMapKey)
                                }}
                                onTouchCancel={() => {
                                  handleOwnerTouchEnd(ownerMapKey)
                                }}
                                onClick={() => {
                                  handleStickerPress(section.code, stickerNumber)
                                }}
                              >
                                {formatStickerLabel(section.code, stickerNumber)}
                              </button>
                            )
                          })}
                        </div>
                      )
                    ) : (
                      <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
                        {stickerNumbers.map((stickerNumber) => {
                          const stickerKey = String(stickerNumber)
                          const currentDuplicate = selectedUserDuplicates[section.code]?.[stickerKey] ?? 0

                          return (
                            <div
                              key={`${section.code}-duplicate-${stickerNumber}`}
                              className="rounded-2xl border border-zinc-500 bg-zinc-900 p-2"
                            >
                              <div className="mb-3 text-center text-[24px] font-semibold leading-none text-zinc-100">
                                {formatStickerLabel(section.code, stickerNumber)}
                              </div>
                              <div className="mb-2 text-center text-xs text-zinc-300">
                                {currentDuplicate}
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  type="button"
                                  disabled={currentDuplicate <= 0}
                                  className={`h-8 rounded-full text-lg ${
                                    currentDuplicate <= 0
                                      ? 'bg-zinc-800 text-zinc-500'
                                      : 'bg-zinc-700 text-zinc-100 active:scale-[0.97]'
                                  }`}
                                  onClick={() => {
                                    void handleChangeDuplicate(section.code, stickerNumber, -1)
                                  }}
                                >
                                  −
                                </button>
                                <button
                                  type="button"
                                  className="h-8 rounded-full bg-zinc-600 text-lg text-zinc-100 active:scale-[0.97]"
                                  onClick={() => {
                                    void handleChangeDuplicate(section.code, stickerNumber, 1)
                                  }}
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                ) : null}
              </article>
            )
          })}
        </section>
      </div>

      {activeTab === 'album' && activeOwners != null && activeOwnersList.length > 0 ? (
        <div className="fixed bottom-[74px] left-1/2 z-20 w-[min(92%,420px)] -translate-x-1/2 rounded-xl border border-amber-400/40 bg-amber-500/15 px-3 py-2 text-xs text-amber-100">
          <div className="font-semibold">{activeOwners.label}</div>
          <div className="mt-1">{activeOwnersList.join(', ')}</div>
        </div>
      ) : null}

      <nav className="fixed bottom-0 left-1/2 z-20 w-full max-w-[430px] -translate-x-1/2 border-t border-zinc-800 bg-[#101115] pb-[max(env(safe-area-inset-bottom),10px)] pt-2">
        <ul className="grid grid-cols-2 text-center text-xs">
          <li>
            <button
              type="button"
              className={activeTab === 'album' ? 'w-full text-white' : 'w-full text-zinc-500'}
              onClick={() => {
                setActiveTab('album')
                setActiveOwners(null)
              }}
            >
              <div className="text-lg">🏆</div>
              <div>Album</div>
            </button>
          </li>
          <li>
            <button
              type="button"
              className={activeTab === 'duplicates' ? 'w-full text-white' : 'w-full text-zinc-500'}
              onClick={() => {
                setActiveTab('duplicates')
                setActiveOwners(null)
              }}
            >
              <div className="text-lg">🗂️</div>
              <div>Duplicates</div>
            </button>
          </li>
        </ul>
      </nav>
    </main>
  )
}

export default App
/*
import { useEffect, useMemo, useState } from 'react'
import { get, onValue, ref, remove, set, type DatabaseReference } from 'firebase/database'
import { database } from './lib/firebase'

type SectionDefinition = {
  code: string
  name: string
  flag: string
  stickerCount: number
}

type UserStickers = Record<string, Record<string, true>>
type UserDuplicates = Record<string, Record<string, number>>
type UserRecord = {
  stickers: UserStickers
  duplicates: UserDuplicates
}
type UsersState = Record<string, UserRecord>
type AppTab = 'album' | 'duplicates'

const USER_STORAGE_KEY = 'mundial:selected-user'
const USERNAME_SEED: Record<string, true> = {
  Addis: true,
  Carlos: true,
  Mija: true,
  'Mija Pro': true,
  Gamax: true,
  Botas: true,
  Kevin: true,
}

const ALBUM_SECTIONS: SectionDefinition[] = [
  { code: 'FWC', name: 'World Cup Legends', flag: '⭐', stickerCount: 20 },
  { code: 'CC', name: 'Coca-Cola', flag: '🥤', stickerCount: 14 },
  { code: 'MEX', name: 'Mexico', flag: '🇲🇽', stickerCount: 20 },
  { code: 'RSA', name: 'South Africa', flag: '🇿🇦', stickerCount: 20 },
  { code: 'KOR', name: 'South Korea', flag: '🇰🇷', stickerCount: 20 },
  { code: 'CZE', name: 'Czechia', flag: '🇨🇿', stickerCount: 20 },
  { code: 'CAN', name: 'Canada', flag: '🇨🇦', stickerCount: 20 },
  { code: 'BIH', name: 'Bosnia', flag: '🇧🇦', stickerCount: 20 },
  { code: 'QAT', name: 'Qatar', flag: '🇶🇦', stickerCount: 20 },
  { code: 'SUI', name: 'Switzerland', flag: '🇨🇭', stickerCount: 20 },
  { code: 'BRA', name: 'Brazil', flag: '🇧🇷', stickerCount: 20 },
  { code: 'MAR', name: 'Morocco', flag: '🇲🇦', stickerCount: 20 },
  { code: 'HAI', name: 'Haiti', flag: '🇭🇹', stickerCount: 20 },
  { code: 'SCO', name: 'Scotland', flag: '🏴', stickerCount: 20 },
  { code: 'USA', name: 'United States', flag: '🇺🇸', stickerCount: 20 },
  { code: 'PAR', name: 'Paraguay', flag: '🇵🇾', stickerCount: 20 },
  { code: 'AUS', name: 'Australia', flag: '🇦🇺', stickerCount: 20 },
  { code: 'TUR', name: 'Turkey', flag: '🇹🇷', stickerCount: 20 },
  { code: 'GER', name: 'Germany', flag: '🇩🇪', stickerCount: 20 },
  { code: 'CUW', name: 'Curacao', flag: '🇨🇼', stickerCount: 20 },
  { code: 'CIV', name: 'Ivory Coast', flag: '🇨🇮', stickerCount: 20 },
  { code: 'ECU', name: 'Ecuador', flag: '🇪🇨', stickerCount: 20 },
  { code: 'NED', name: 'Netherlands', flag: '🇳🇱', stickerCount: 20 },
  { code: 'JPN', name: 'Japan', flag: '🇯🇵', stickerCount: 20 },
  { code: 'SWE', name: 'Sweden', flag: '🇸🇪', stickerCount: 20 },
  { code: 'TUN', name: 'Tunisia', flag: '🇹🇳', stickerCount: 20 },
  { code: 'BEL', name: 'Belgium', flag: '🇧🇪', stickerCount: 20 },
  { code: 'EGY', name: 'Egypt', flag: '🇪🇬', stickerCount: 20 },
  { code: 'IRN', name: 'Iran', flag: '🇮🇷', stickerCount: 20 },
  { code: 'NZL', name: 'New Zealand', flag: '🇳🇿', stickerCount: 20 },
  { code: 'ESP', name: 'Spain', flag: '🇪🇸', stickerCount: 20 },
  { code: 'CPV', name: 'Cape Verde', flag: '🇨🇻', stickerCount: 20 },
  { code: 'KSA', name: 'Saudi Arabia', flag: '🇸🇦', stickerCount: 20 },
  { code: 'URU', name: 'Uruguay', flag: '🇺🇾', stickerCount: 20 },
  { code: 'FRA', name: 'France', flag: '🇫🇷', stickerCount: 20 },
  { code: 'SEN', name: 'Senegal', flag: '🇸🇳', stickerCount: 20 },
  { code: 'IRQ', name: 'Iraq', flag: '🇮🇶', stickerCount: 20 },
  { code: 'NOR', name: 'Norway', flag: '🇳🇴', stickerCount: 20 },
  { code: 'ARG', name: 'Argentina', flag: '🇦🇷', stickerCount: 20 },
  { code: 'ALG', name: 'Algeria', flag: '🇩🇿', stickerCount: 20 },
  { code: 'AUT', name: 'Austria', flag: '🇦🇹', stickerCount: 20 },
  { code: 'JOR', name: 'Jordan', flag: '🇯🇴', stickerCount: 20 },
  { code: 'POR', name: 'Portugal', flag: '🇵🇹', stickerCount: 20 },
  { code: 'COD', name: 'DR Congo', flag: '🇨🇩', stickerCount: 20 },
  { code: 'UZB', name: 'Uzbekistan', flag: '🇺🇿', stickerCount: 20 },
  { code: 'COL', name: 'Colombia', flag: '🇨🇴', stickerCount: 20 },
  { code: 'ENG', name: 'England', flag: '🏴', stickerCount: 20 },
  { code: 'CRO', name: 'Croatia', flag: '🇭🇷', stickerCount: 20 },
  { code: 'GHA', name: 'Ghana', flag: '🇬🇭', stickerCount: 20 },
  { code: 'PAN', name: 'Panama', flag: '🇵🇦', stickerCount: 20 },
]

function normalizeCode(value: string): string {
  return value.trim().toUpperCase()
}

function isValidStickerIndex(sectionCode: string, stickerIndex: number): boolean {
  if (!Number.isInteger(stickerIndex)) {
    return false
  }

  if (sectionCode === 'FWC') {
    return stickerIndex >= 0
  }

  return stickerIndex > 0
}

function addStickerToUser(target: UserStickers, sectionCode: string, stickerIndex: number): void {
  if (!isValidStickerIndex(sectionCode, stickerIndex)) {
    return
  }

  target[sectionCode] ??= {}
  target[sectionCode][String(stickerIndex)] = true
}

function addDuplicateCount(
  target: UserDuplicates,
  sectionCode: string,
  stickerIndex: number,
  count: number,
): void {
  if (!isValidStickerIndex(sectionCode, stickerIndex)) {
    return
  }

  if (!Number.isFinite(count)) {
    return
  }

  const normalizedCount = Math.trunc(count)

  if (normalizedCount <= 0) {
    return
  }

  target[sectionCode] ??= {}
  target[sectionCode][String(stickerIndex)] = (target[sectionCode][String(stickerIndex)] ?? 0) + normalizedCount
}

function parseUserStickers(value: unknown): UserStickers {
  if (value == null || typeof value !== 'object') {
    return {}
  }

  const stickers: UserStickers = {}
  const rawStickers = value as Record<string, unknown>

  for (const [rawKey, rawValue] of Object.entries(rawStickers)) {
    if (rawValue != null && typeof rawValue === 'object') {
      const sectionCode = normalizeCode(rawKey)
      const sectionRecord = rawValue as Record<string, unknown>

      for (const [rawIndex, rawOwnedValue] of Object.entries(sectionRecord)) {
        const stickerIndex = Number.parseInt(rawIndex, 10)
        const isOwned =
          rawOwnedValue === true ||
          (typeof rawOwnedValue === 'number' && rawOwnedValue > 0) ||
          rawOwnedValue === 'true'

        if (isOwned) {
          addStickerToUser(stickers, sectionCode, stickerIndex)
        }
      }

      continue
    }

    const match = /^(.+)\s+(\d+)$/.exec(rawKey)
    if (match == null) {
      continue
    }

    const sectionCode = normalizeCode(match[1])
    const stickerIndex = Number.parseInt(match[2], 10)
    const isOwned =
      rawValue === true || (typeof rawValue === 'number' && rawValue > 0) || rawValue === 'true'

    if (isOwned) {
      addStickerToUser(stickers, sectionCode, stickerIndex)
    }
  }

  return stickers
}

function parseUserDuplicates(value: unknown): UserDuplicates {
  if (value == null || typeof value !== 'object') {
    return {}
  }

  const duplicates: UserDuplicates = {}
  const rawDuplicates = value as Record<string, unknown>

  for (const [rawKey, rawValue] of Object.entries(rawDuplicates)) {
    if (rawValue != null && typeof rawValue === 'object') {
      const sectionCode = normalizeCode(rawKey)
      const sectionRecord = rawValue as Record<string, unknown>

      for (const [rawIndex, rawCountValue] of Object.entries(sectionRecord)) {
        const stickerIndex = Number.parseInt(rawIndex, 10)
        const numericValue =
          typeof rawCountValue === 'number'
            ? rawCountValue
            : Number.parseInt(String(rawCountValue), 10)

        addDuplicateCount(duplicates, sectionCode, stickerIndex, numericValue)
      }

      continue
    }

    const match = /^(.+)\s+(\d+)$/.exec(rawKey)
    if (match == null) {
      continue
    }

    const sectionCode = normalizeCode(match[1])
    const stickerIndex = Number.parseInt(match[2], 10)
    const numericValue =
      typeof rawValue === 'number' ? rawValue : Number.parseInt(String(rawValue), 10)

    addDuplicateCount(duplicates, sectionCode, stickerIndex, numericValue)
  }

  return duplicates
}

function parseDuplicateFallbackFromStickers(value: unknown): UserDuplicates {
  if (value == null || typeof value !== 'object') {
    return {}
  }

  const duplicates: UserDuplicates = {}
  const rawStickers = value as Record<string, unknown>

  for (const [rawKey, rawValue] of Object.entries(rawStickers)) {
    if (rawValue != null && typeof rawValue === 'object') {
      const sectionCode = normalizeCode(rawKey)
      const sectionRecord = rawValue as Record<string, unknown>

      for (const [rawIndex, rawCountValue] of Object.entries(sectionRecord)) {
        if (typeof rawCountValue !== 'number') {
          continue
        }

        const stickerIndex = Number.parseInt(rawIndex, 10)
        addDuplicateCount(duplicates, sectionCode, stickerIndex, rawCountValue - 1)
      }

      continue
    }

    if (typeof rawValue !== 'number') {
      continue
    }

    const match = /^(.+)\s+(\d+)$/.exec(rawKey)
    if (match == null) {
      continue
    }

    const sectionCode = normalizeCode(match[1])
    const stickerIndex = Number.parseInt(match[2], 10)
    addDuplicateCount(duplicates, sectionCode, stickerIndex, rawValue - 1)
  }

  return duplicates
}

function mergeDuplicateMaps(primary: UserDuplicates, secondary: UserDuplicates): UserDuplicates {
  const merged: UserDuplicates = {}
  const sections = new Set<string>([...Object.keys(primary), ...Object.keys(secondary)])

  for (const sectionCode of sections) {
    const sectionValues: Record<string, number> = {}
    const primarySection = primary[sectionCode] ?? {}
    const secondarySection = secondary[sectionCode] ?? {}
    const stickerKeys = new Set<string>([
      ...Object.keys(primarySection),
      ...Object.keys(secondarySection),
    ])

    for (const stickerKey of stickerKeys) {
      const total = (primarySection[stickerKey] ?? 0) + (secondarySection[stickerKey] ?? 0)
      if (total > 0) {
        sectionValues[stickerKey] = total
      }
    }

    if (Object.keys(sectionValues).length > 0) {
      merged[sectionCode] = sectionValues
    }
  }

  return merged
}

function parseUserRecord(rawUserData: unknown): UserRecord {
  if (rawUserData == null || typeof rawUserData !== 'object') {
    return { stickers: {}, duplicates: {} }
  }

  const userData = rawUserData as { stickers?: unknown; duplicates?: unknown }
  const stickers = parseUserStickers(userData.stickers)
  const duplicatesFromPath = parseUserDuplicates(userData.duplicates)
  const duplicatesFromStickers = parseDuplicateFallbackFromStickers(userData.stickers)
  const duplicates = mergeDuplicateMaps(duplicatesFromPath, duplicatesFromStickers)

  return { stickers, duplicates }
}

function parseUsersSnapshot(value: unknown): UsersState {
  if (value == null || typeof value !== 'object') {
    return {}
  }

  const users: UsersState = {}
  const rawUsers = value as Record<string, unknown>

  for (const [username, rawUserData] of Object.entries(rawUsers)) {
    users[username] = parseUserRecord(rawUserData)
  }

  return users
}

function parseUsernamesSnapshot(value: unknown): string[] {
  if (value == null || typeof value !== 'object') {
    return []
  }

  const names: string[] = []
  const entries = Object.entries(value as Record<string, unknown>)

  for (const [name, rawValue] of entries) {
    const normalizedName = name.trim()
    const isEnabled =
      rawValue === true ||
      rawValue === 1 ||
      rawValue === 'true' ||
      (typeof rawValue === 'string' && rawValue.trim().length > 0)

    if (normalizedName.length > 0 && isEnabled) {
      names.push(normalizedName)
    }
  }

  return names
}

function getStickerRef(username: string, sectionCode: string, stickerNumber: number): DatabaseReference {
  return ref(database, `users/${username}/stickers/${sectionCode}/${stickerNumber}`)
}

function getDuplicateRef(username: string, sectionCode: string, stickerNumber: number): DatabaseReference {
  return ref(database, `users/${username}/duplicates/${sectionCode}/${stickerNumber}`)
}

function getStickerNumbers(sectionCode: string, stickerCount: number): number[] {
  if (sectionCode === 'FWC') {
    return Array.from({ length: stickerCount }, (_, index) => index)
  }

  return Array.from({ length: stickerCount }, (_, index) => index + 1)
}

function formatStickerLabel(sectionCode: string, stickerNumber: number): string {
  if (sectionCode === 'FWC') {
    return String(stickerNumber).padStart(2, '0')
  }

  return String(stickerNumber)
}

function App() {
  const [users, setUsers] = useState<UsersState>({})
  const [availableUsers, setAvailableUsers] = useState<string[]>(Object.keys(USERNAME_SEED))
  const [selectedUser, setSelectedUser] = useState<string | null>(() => {
    const storedUser = localStorage.getItem(USER_STORAGE_KEY)
    if (storedUser == null || storedUser.trim().length === 0) {
      return null
    }

    return storedUser
  })
  const [activeTab, setActiveTab] = useState<AppTab>('album')
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    FWC: true,
    CC: false,
    MEX: false,
  })
  const [showOwnedBySection, setShowOwnedBySection] = useState<Record<string, boolean>>({})
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
          void set(usernamesRef, USERNAME_SEED).catch(() => {
            return null
          })
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

    const userStickersRef = ref(database, `users/${activeSelectedUser}/stickers`)
    const userDuplicatesRef = ref(database, `users/${activeSelectedUser}/duplicates`)

    void get(userStickersRef)
      .then((snapshot) => {
        if (!snapshot.exists()) {
          return set(userStickersRef, {})
        }

        return null
      })
      .catch(() => {
        return null
      })

    void get(userDuplicatesRef)
      .then((snapshot) => {
        if (!snapshot.exists()) {
          return set(userDuplicatesRef, {})
        }

        return null
      })
      .catch(() => {
        return null
      })
  }, [activeSelectedUser])

  const selectedUserData = useMemo<UserRecord>(() => {
    if (activeSelectedUser == null) {
      return { stickers: {}, duplicates: {} }
    }

    return users[activeSelectedUser] ?? { stickers: {}, duplicates: {} }
  }, [activeSelectedUser, users])

  const selectedUserStickers = selectedUserData.stickers
  const selectedUserDuplicates = selectedUserData.duplicates

  const extraSections = useMemo<SectionDefinition[]>(() => {
    const knownCodes = new Set(ALBUM_SECTIONS.map((section) => section.code))
    const unknownCodes = Object.keys(selectedUserStickers).filter((code) => !knownCodes.has(code))

    return unknownCodes.map((code) => {
      const indexes = Object.keys(selectedUserStickers[code] ?? {}).map((value) =>
        Number.parseInt(value, 10),
      )
      const maxValue = indexes.reduce((highest, value) => {
        if (Number.isInteger(value) && value > highest) {
          return value
        }

        return highest
      }, 0)

      return {
        code,
        name: code,
        flag: '🏷️',
        stickerCount: Math.max(maxValue, 20),
      }
    })
  }, [selectedUserStickers])

  const allSections = useMemo(() => {
    return [...ALBUM_SECTIONS, ...extraSections]
  }, [extraSections])

  const filteredSections = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    if (normalizedSearch.length === 0) {
      return allSections
    }

    return allSections.filter((section) => {
      return (
        section.code.toLowerCase().includes(normalizedSearch) ||
        section.name.toLowerCase().includes(normalizedSearch)
      )
    })
  }, [allSections, searchTerm])

  const ownedCounts = useMemo(() => {
    const counts: Record<string, number> = {}

    for (const section of allSections) {
      counts[section.code] = Object.keys(selectedUserStickers[section.code] ?? {}).length
    }

    return counts
  }, [allSections, selectedUserStickers])

  const duplicateCounts = useMemo(() => {
    const counts: Record<string, number> = {}

    for (const section of allSections) {
      const duplicates = selectedUserDuplicates[section.code] ?? {}
      counts[section.code] = Object.values(duplicates).reduce((sum, value) => sum + value, 0)
    }

    return counts
  }, [allSections, selectedUserDuplicates])

  const totals = useMemo(() => {
    let owned = 0
    let albumTotal = 0
    let duplicates = 0

    for (const section of allSections) {
      owned += ownedCounts[section.code] ?? 0
      albumTotal += section.stickerCount
      duplicates += duplicateCounts[section.code] ?? 0
    }

    const percentage = albumTotal === 0 ? 0 : Math.round((owned / albumTotal) * 100)
    return { owned, albumTotal, percentage, duplicates }
  }, [allSections, duplicateCounts, ownedCounts])

  function setUserRecord(userName: string, updater: (current: UserRecord) => UserRecord): void {
    setUsers((previousUsers) => {
      const current = previousUsers[userName] ?? { stickers: {}, duplicates: {} }
      return {
        ...previousUsers,
        [userName]: updater(current),
      }
    })
  }

  async function handleToggleSticker(sectionCode: string, stickerNumber: number) {
    if (activeSelectedUser == null) {
      return
    }

    setError(null)
    const normalizedCode = normalizeCode(sectionCode)
    const stickerKey = String(stickerNumber)
    const isOwned = selectedUserStickers[normalizedCode]?.[stickerKey] === true

    setUserRecord(activeSelectedUser, (current) => {
      const nextStickers: UserStickers = {
        ...current.stickers,
      }
      const nextSectionStickers = {
        ...(nextStickers[normalizedCode] ?? {}),
      }

      if (isOwned) {
        delete nextSectionStickers[stickerKey]
      } else {
        nextSectionStickers[stickerKey] = true
      }

      if (Object.keys(nextSectionStickers).length === 0) {
        delete nextStickers[normalizedCode]
      } else {
        nextStickers[normalizedCode] = nextSectionStickers
      }

      return {
        ...current,
        stickers: nextStickers,
      }
    })

    try {
      if (isOwned) {
        await remove(getStickerRef(activeSelectedUser, normalizedCode, stickerNumber))
        return
      }

      await set(getStickerRef(activeSelectedUser, normalizedCode, stickerNumber), true)
    } catch {
      setError('Unable to update sticker right now.')
      const userRef = ref(database, `users/${activeSelectedUser}`)
      void get(userRef).then((snapshot) => {
        setUserRecord(activeSelectedUser, () => parseUserRecord(snapshot.val()))
      })
    }
  }

  async function handleChangeDuplicate(sectionCode: string, stickerNumber: number, delta: number) {
    if (activeSelectedUser == null) {
      return
    }

    setError(null)
    const normalizedCode = normalizeCode(sectionCode)
    const stickerKey = String(stickerNumber)
    const currentCount = selectedUserDuplicates[normalizedCode]?.[stickerKey] ?? 0
    const nextCount = Math.max(0, currentCount + delta)

    setUserRecord(activeSelectedUser, (current) => {
      const nextDuplicates: UserDuplicates = {
        ...current.duplicates,
      }
      const nextSectionDuplicates = {
        ...(nextDuplicates[normalizedCode] ?? {}),
      }

      if (nextCount <= 0) {
        delete nextSectionDuplicates[stickerKey]
      } else {
        nextSectionDuplicates[stickerKey] = nextCount
      }

      if (Object.keys(nextSectionDuplicates).length === 0) {
        delete nextDuplicates[normalizedCode]
      } else {
        nextDuplicates[normalizedCode] = nextSectionDuplicates
      }

      return {
        ...current,
        duplicates: nextDuplicates,
      }
    })

    try {
      if (nextCount <= 0) {
        await remove(getDuplicateRef(activeSelectedUser, normalizedCode, stickerNumber))
        return
      }

      await set(getDuplicateRef(activeSelectedUser, normalizedCode, stickerNumber), nextCount)
    } catch {
      setError('Unable to update duplicates right now.')
      const userRef = ref(database, `users/${activeSelectedUser}`)
      void get(userRef).then((snapshot) => {
        setUserRecord(activeSelectedUser, () => parseUserRecord(snapshot.val()))
      })
    }
  }

  function handleToggleSection(code: string): void {
    setExpandedSections((previous) => {
      const currentValue = previous[code]
      return {
        ...previous,
        [code]: currentValue == null ? true : !currentValue,
      }
    })
  }

  function handleToggleShowOwned(code: string): void {
    setShowOwnedBySection((previous) => {
      const currentValue = previous[code]
      return {
        ...previous,
        [code]: currentValue == null ? true : !currentValue,
      }
    })
  }

  if (activeSelectedUser == null) {
    return (
      <main className="mx-auto min-h-[100dvh] w-full max-w-[430px] bg-[#0e0f12] px-5 pb-[max(env(safe-area-inset-bottom),24px)] pt-[max(env(safe-area-inset-top),24px)] text-white">
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5">
          <h1 className="text-2xl font-semibold tracking-tight">Choose your name</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Select one name and start registering stickers with one tap.
          </p>
          <div className="mt-5 space-y-3">
            {availableUsers.map((username) => (
              <button
                key={username}
                type="button"
                className="flex h-12 w-full items-center justify-between rounded-xl border border-zinc-700 bg-zinc-950 px-4 text-left text-base font-medium active:scale-[0.99]"
                onClick={() => {
                  setSelectedUser(username)
                }}
              >
                <span>{username}</span>
                <span className="text-zinc-500">→</span>
              </button>
            ))}
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="mx-auto min-h-[100dvh] w-full max-w-[430px] bg-[#0e0f12] pb-[calc(env(safe-area-inset-bottom)+84px)] pt-[max(env(safe-area-inset-top),16px)] text-white">
      <div className="px-4">
        <header className="pt-2">
          <h1 className="text-[30px] font-semibold leading-tight">
            {activeTab === 'duplicates' ? 'Duplicates' : 'World Cup Album 2026'}
          </h1>
          <div className="mt-2 flex items-center justify-between text-zinc-400">
            <button
              type="button"
              className="rounded-lg border border-zinc-700 px-2 py-1 text-xs active:scale-[0.98]"
              onClick={() => {
                setSelectedUser(null)
              }}
            >
              {activeSelectedUser}
            </button>
            <span
              className={`rounded-full px-2 py-1 text-[11px] ${
                isConnected ? 'bg-emerald-600/30 text-emerald-200' : 'bg-rose-600/30 text-rose-200'
              }`}
            >
              {isConnected ? 'Live' : 'Offline'}
            </span>
          </div>
          <div className="mt-3 border-b border-zinc-800 pb-2">
            {activeTab === 'duplicates' ? (
              <div className="text-sm text-zinc-300">Total: {totals.duplicates}</div>
            ) : (
              <div className="flex items-end justify-between">
                <div className="text-4xl font-semibold leading-none">{totals.owned}</div>
                <div className="mb-1 text-sm text-zinc-400">
                  of {totals.albumTotal} <span className="ml-2 text-white">{totals.percentage}%</span>
                </div>
              </div>
            )}
          </div>
        </header>

        <section className="mt-4">
          <div className="flex items-center gap-2">
            <div className="flex h-12 flex-1 items-center rounded-xl border border-zinc-800 bg-zinc-900 px-3">
              <span className="mr-2 text-zinc-500">⌕</span>
              <input
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value)
                }}
                className="w-full bg-transparent text-[15px] text-zinc-100 outline-none placeholder:text-zinc-500"
                placeholder="Search countries..."
                inputMode="search"
              />
            </div>
            <button
              type="button"
              className="grid h-12 w-12 place-items-center rounded-xl border border-zinc-800 bg-zinc-900 text-xl"
            >
              ↗
            </button>
            <button
              type="button"
              className="grid h-12 w-12 place-items-center rounded-xl border border-zinc-800 bg-zinc-900 text-xl"
            >
              ☰
            </button>
          </div>
        </section>

        {error == null ? null : (
          <p className="mt-3 rounded-xl border border-rose-600/40 bg-rose-600/20 px-3 py-2 text-xs text-rose-100">
            {error}
          </p>
        )}

        <section className="mt-4 space-y-3">
          {filteredSections.map((section) => {
            const isSearching = searchTerm.trim().length > 0
            const isExpanded = isSearching || expandedSections[section.code] === true
            const ownedSet = selectedUserStickers[section.code] ?? {}
            const ownedCount = ownedCounts[section.code] ?? 0
            const duplicateCount = duplicateCounts[section.code] ?? 0
            const stickerNumbers = getStickerNumbers(section.code, section.stickerCount)
            const showOwned = showOwnedBySection[section.code] === true
            const visibleAlbumNumbers = showOwned
              ? stickerNumbers
              : stickerNumbers.filter((number) => ownedSet[String(number)] !== true)

            return (
              <article key={section.code} className="overflow-hidden rounded-2xl bg-zinc-900/85">
                <button
                  type="button"
                  className="flex h-14 w-full items-center justify-between border border-zinc-800 px-3"
                  onClick={() => {
                    handleToggleSection(section.code)
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{section.flag}</span>
                    <span className="text-xl font-semibold tracking-wide">{section.code}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-semibold">
                      {activeTab === 'duplicates'
                        ? duplicateCount
                        : `${ownedCount}/${section.stickerCount}`}
                    </span>
                    <span className="text-zinc-400">{isExpanded ? '⌃' : '⌄'}</span>
                  </div>
                </button>

                {isExpanded ? (
                  <div className="border-x border-b border-zinc-800 px-3 pb-3 pt-3">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <div className="text-xs text-zinc-400">{section.name}</div>
                      {activeTab === 'album' ? (
                        <button
                          type="button"
                          className="rounded-full border border-zinc-700 px-3 py-1 text-[11px] text-zinc-200"
                          onClick={() => {
                            handleToggleShowOwned(section.code)
                          }}
                        >
                          {showOwned ? 'Hide marked' : 'Show marked'}
                        </button>
                      ) : null}
                    </div>

                    {activeTab === 'album' ? (
                      visibleAlbumNumbers.length === 0 ? (
                        <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-4 text-center text-xs text-zinc-400">
                          No missing stickers in this section.
                        </div>
                      ) : (
                        <div className="grid grid-cols-6 gap-2 sm:grid-cols-7">
                          {visibleAlbumNumbers.map((stickerNumber) => {
                            const stickerKey = String(stickerNumber)
                            const isOwned = ownedSet[stickerKey] === true

                            return (
                              <button
                                key={`${section.code}-${stickerNumber}`}
                                type="button"
                                className={`h-11 rounded-xl border text-[20px] font-semibold leading-none active:scale-[0.97] ${
                                  isOwned
                                    ? 'border-white bg-white text-zinc-900'
                                    : 'border-zinc-500 bg-transparent text-zinc-100'
                                }`}
                                onClick={() => {
                                  void handleToggleSticker(section.code, stickerNumber)
                                }}
                              >
                                {formatStickerLabel(section.code, stickerNumber)}
                              </button>
                            )
                          })}
                        </div>
                      )
                    ) : (
                      <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
                        {stickerNumbers.map((stickerNumber) => {
                          const stickerKey = String(stickerNumber)
                          const currentDuplicate = selectedUserDuplicates[section.code]?.[stickerKey] ?? 0

                          return (
                            <div
                              key={`${section.code}-duplicate-${stickerNumber}`}
                              className="rounded-2xl border border-zinc-500 bg-zinc-900 p-2"
                            >
                              <div className="mb-3 text-center text-[24px] font-semibold leading-none text-zinc-100">
                                {formatStickerLabel(section.code, stickerNumber)}
                              </div>
                              <div className="mb-2 text-center text-xs text-zinc-300">
                                {currentDuplicate}
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  type="button"
                                  disabled={currentDuplicate <= 0}
                                  className={`h-8 rounded-full text-lg ${
                                    currentDuplicate <= 0
                                      ? 'bg-zinc-800 text-zinc-500'
                                      : 'bg-zinc-700 text-zinc-100 active:scale-[0.97]'
                                  }`}
                                  onClick={() => {
                                    void handleChangeDuplicate(section.code, stickerNumber, -1)
                                  }}
                                >
                                  −
                                </button>
                                <button
                                  type="button"
                                  className="h-8 rounded-full bg-zinc-600 text-lg text-zinc-100 active:scale-[0.97]"
                                  onClick={() => {
                                    void handleChangeDuplicate(section.code, stickerNumber, 1)
                                  }}
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                ) : null}
              </article>
            )
          })}
        </section>
      </div>

      <nav className="fixed bottom-0 left-1/2 z-20 w-full max-w-[430px] -translate-x-1/2 border-t border-zinc-800 bg-[#101115] pb-[max(env(safe-area-inset-bottom),10px)] pt-2">
        <ul className="grid grid-cols-2 text-center text-xs">
          <li>
            <button
              type="button"
              className={activeTab === 'album' ? 'w-full text-white' : 'w-full text-zinc-500'}
              onClick={() => {
                setActiveTab('album')
              }}
            >
              <div className="text-lg">🏆</div>
              <div>Album</div>
            </button>
          </li>
          <li>
            <button
              type="button"
              className={activeTab === 'duplicates' ? 'w-full text-white' : 'w-full text-zinc-500'}
              onClick={() => {
                setActiveTab('duplicates')
              }}
            >
              <div className="text-lg">🗂️</div>
              <div>Duplicates</div>
            </button>
          </li>
        </ul>
      </nav>
    </main>
  )
}

export default App
*/
/*
import { useEffect, useMemo, useState } from 'react'
import {
  get,
  onValue,
  ref,
  remove,
  set,
  type DatabaseReference,
} from 'firebase/database'
import { database } from './lib/firebase'

type SectionDefinition = {
  code: string
  name: string
  flag: string
  stickerCount: number
}

type UserStickers = Record<string, Record<string, true>>
type UsersState = Record<string, UserStickers>

const USER_STORAGE_KEY = 'mundial:selected-user'
const USERNAME_SEED: Record<string, true> = {
  Addis: true,
  Carlos: true,
  Mija: true,
  'Mija Pro': true,
  Gamax: true,
  Botas: true,
  Kevin: true,
}

const ALBUM_SECTIONS: SectionDefinition[] = [
  { code: 'FWC', name: 'World Cup Legends', flag: '⭐', stickerCount: 20 },
  { code: 'CC', name: 'Coca-Cola', flag: '🥤', stickerCount: 14 },
  { code: 'MEX', name: 'Mexico', flag: '🇲🇽', stickerCount: 20 },
  { code: 'RSA', name: 'South Africa', flag: '🇿🇦', stickerCount: 20 },
  { code: 'KOR', name: 'South Korea', flag: '🇰🇷', stickerCount: 20 },
  { code: 'CZE', name: 'Czechia', flag: '🇨🇿', stickerCount: 20 },
  { code: 'CAN', name: 'Canada', flag: '🇨🇦', stickerCount: 20 },
  { code: 'BIH', name: 'Bosnia', flag: '🇧🇦', stickerCount: 20 },
  { code: 'QAT', name: 'Qatar', flag: '🇶🇦', stickerCount: 20 },
  { code: 'SUI', name: 'Switzerland', flag: '🇨🇭', stickerCount: 20 },
  { code: 'BRA', name: 'Brazil', flag: '🇧🇷', stickerCount: 20 },
  { code: 'MAR', name: 'Morocco', flag: '🇲🇦', stickerCount: 20 },
  { code: 'HAI', name: 'Haiti', flag: '🇭🇹', stickerCount: 20 },
  { code: 'SCO', name: 'Scotland', flag: '🏴', stickerCount: 20 },
  { code: 'USA', name: 'United States', flag: '🇺🇸', stickerCount: 20 },
  { code: 'PAR', name: 'Paraguay', flag: '🇵🇾', stickerCount: 20 },
  { code: 'AUS', name: 'Australia', flag: '🇦🇺', stickerCount: 20 },
  { code: 'TUR', name: 'Turkey', flag: '🇹🇷', stickerCount: 20 },
  { code: 'GER', name: 'Germany', flag: '🇩🇪', stickerCount: 20 },
  { code: 'CUW', name: 'Curacao', flag: '🇨🇼', stickerCount: 20 },
  { code: 'CIV', name: 'Ivory Coast', flag: '🇨🇮', stickerCount: 20 },
  { code: 'ECU', name: 'Ecuador', flag: '🇪🇨', stickerCount: 20 },
  { code: 'NED', name: 'Netherlands', flag: '🇳🇱', stickerCount: 20 },
  { code: 'JPN', name: 'Japan', flag: '🇯🇵', stickerCount: 20 },
  { code: 'SWE', name: 'Sweden', flag: '🇸🇪', stickerCount: 20 },
  { code: 'TUN', name: 'Tunisia', flag: '🇹🇳', stickerCount: 20 },
  { code: 'BEL', name: 'Belgium', flag: '🇧🇪', stickerCount: 20 },
  { code: 'EGY', name: 'Egypt', flag: '🇪🇬', stickerCount: 20 },
  { code: 'IRN', name: 'Iran', flag: '🇮🇷', stickerCount: 20 },
  { code: 'NZL', name: 'New Zealand', flag: '🇳🇿', stickerCount: 20 },
  { code: 'ESP', name: 'Spain', flag: '🇪🇸', stickerCount: 20 },
  { code: 'CPV', name: 'Cape Verde', flag: '🇨🇻', stickerCount: 20 },
  { code: 'KSA', name: 'Saudi Arabia', flag: '🇸🇦', stickerCount: 20 },
  { code: 'URU', name: 'Uruguay', flag: '🇺🇾', stickerCount: 20 },
  { code: 'FRA', name: 'France', flag: '🇫🇷', stickerCount: 20 },
  { code: 'SEN', name: 'Senegal', flag: '🇸🇳', stickerCount: 20 },
  { code: 'IRQ', name: 'Iraq', flag: '🇮🇶', stickerCount: 20 },
  { code: 'NOR', name: 'Norway', flag: '🇳🇴', stickerCount: 20 },
  { code: 'ARG', name: 'Argentina', flag: '🇦🇷', stickerCount: 20 },
  { code: 'ALG', name: 'Algeria', flag: '🇩🇿', stickerCount: 20 },
  { code: 'AUT', name: 'Austria', flag: '🇦🇹', stickerCount: 20 },
  { code: 'JOR', name: 'Jordan', flag: '🇯🇴', stickerCount: 20 },
  { code: 'POR', name: 'Portugal', flag: '🇵🇹', stickerCount: 20 },
  { code: 'COD', name: 'DR Congo', flag: '🇨🇩', stickerCount: 20 },
  { code: 'UZB', name: 'Uzbekistan', flag: '🇺🇿', stickerCount: 20 },
  { code: 'COL', name: 'Colombia', flag: '🇨🇴', stickerCount: 20 },
  { code: 'ENG', name: 'England', flag: '🏴', stickerCount: 20 },
  { code: 'CRO', name: 'Croatia', flag: '🇭🇷', stickerCount: 20 },
  { code: 'GHA', name: 'Ghana', flag: '🇬🇭', stickerCount: 20 },
  { code: 'PAN', name: 'Panama', flag: '🇵🇦', stickerCount: 20 },
]

function normalizeCode(value: string): string {
  return value.trim().toUpperCase()
}

function addStickerToUser(
  target: UserStickers,
  sectionCode: string,
  stickerIndex: number,
): void {
  const isInteger = Number.isInteger(stickerIndex)
  const isFwcIndexValid = sectionCode === 'FWC' && stickerIndex >= 0
  const isDefaultIndexValid = sectionCode !== 'FWC' && stickerIndex > 0

  if (!isInteger || (!isFwcIndexValid && !isDefaultIndexValid)) {
    return
  }

  target[sectionCode] ??= {}

  target[sectionCode][String(stickerIndex)] = true
}

function parseUserStickers(value: unknown): UserStickers {
  if (value == null || typeof value !== 'object') {
    return {}
  }

  const stickers: UserStickers = {}
  const rawStickers = value as Record<string, unknown>

  for (const [rawKey, rawValue] of Object.entries(rawStickers)) {
    if (rawValue != null && typeof rawValue === 'object') {
      const sectionCode = normalizeCode(rawKey)
      const sectionRecord = rawValue as Record<string, unknown>

      for (const [rawIndex, rawOwnedValue] of Object.entries(sectionRecord)) {
        const stickerIndex = Number.parseInt(rawIndex, 10)
        const isOwned =
          rawOwnedValue === true ||
          (typeof rawOwnedValue === 'number' && rawOwnedValue > 0) ||
          rawOwnedValue === 'true'

        if (isOwned) {
          addStickerToUser(stickers, sectionCode, stickerIndex)
        }
      }

      continue
    }

    const match = /^(.+)\s+(\d+)$/.exec(rawKey)
    if (match == null) {
      continue
    }

    const sectionCode = normalizeCode(match[1])
    const stickerIndex = Number.parseInt(match[2], 10)
    const isOwned =
      rawValue === true || (typeof rawValue === 'number' && rawValue > 0) || rawValue === 'true'

    if (isOwned) {
      addStickerToUser(stickers, sectionCode, stickerIndex)
    }
  }

  return stickers
}

function parseUsersSnapshot(value: unknown): UsersState {
  if (value == null || typeof value !== 'object') {
    return {}
  }

  const users: UsersState = {}
  const rawUsers = value as Record<string, unknown>

  for (const [username, rawUserData] of Object.entries(rawUsers)) {
    if (rawUserData == null || typeof rawUserData !== 'object') {
      users[username] = {}
      continue
    }

    const stickersValue = (rawUserData as { stickers?: unknown }).stickers
    users[username] = parseUserStickers(stickersValue)
  }

  return users
}

function parseUsernamesSnapshot(value: unknown): string[] {
  if (value == null || typeof value !== 'object') {
    return []
  }

  const names: string[] = []
  const entries = Object.entries(value as Record<string, unknown>)

  for (const [name, rawValue] of entries) {
    const normalizedName = name.trim()
    const isEnabled =
      rawValue === true ||
      rawValue === 1 ||
      rawValue === 'true' ||
      (typeof rawValue === 'string' && rawValue.trim().length > 0)

    if (normalizedName.length > 0 && isEnabled) {
      names.push(normalizedName)
    }
  }

  return names
}

function getSectionRef(username: string, sectionCode: string, stickerNumber: number): DatabaseReference {
  return ref(database, `users/${username}/stickers/${sectionCode}/${stickerNumber}`)
}

function App() {
  const [users, setUsers] = useState<UsersState>({})
  const [availableUsers, setAvailableUsers] = useState<string[]>(Object.keys(USERNAME_SEED))
  const [selectedUser, setSelectedUser] = useState<string | null>(() => {
    const storedUser = localStorage.getItem(USER_STORAGE_KEY)
    if (storedUser == null || storedUser.trim().length === 0) {
      return null
    }

    return storedUser
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    MEX: true,
    FWC: false,
    CC: false,
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
      const nextUsers = parseUsersSnapshot(snapshot.val())
      setUsers(nextUsers)
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
          void set(usernamesRef, USERNAME_SEED).catch(() => {
            return null
          })
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

    const userStickersRef = ref(database, `users/${activeSelectedUser}/stickers`)
    void get(userStickersRef)
      .then((snapshot) => {
        if (!snapshot.exists()) {
          return set(userStickersRef, {})
        }

        return null
      })
      .catch(() => {
        return null
      })
  }, [activeSelectedUser])

  const selectedUserStickers = useMemo<UserStickers>(() => {
    if (activeSelectedUser == null) {
      return {}
    }

    return users[activeSelectedUser] ?? {}
  }, [activeSelectedUser, users])

  const extraSections = useMemo<SectionDefinition[]>(() => {
    const knownCodes = new Set(ALBUM_SECTIONS.map((section) => section.code))
    const unknownCodes = Object.keys(selectedUserStickers).filter((code) => !knownCodes.has(code))

    return unknownCodes.map((code) => {
      const indexes = Object.keys(selectedUserStickers[code] ?? {}).map((value) =>
        Number.parseInt(value, 10),
      )
      const maxValue = indexes.reduce((highest, value) => {
        if (Number.isInteger(value) && value > highest) {
          return value
        }

        return highest
      }, 0)

      return {
        code,
        name: code,
        flag: '🏷️',
        stickerCount: Math.max(maxValue, 20),
      }
    })
  }, [selectedUserStickers])

  const allSections = useMemo(() => {
    return [...ALBUM_SECTIONS, ...extraSections]
  }, [extraSections])

  const filteredSections = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    if (normalizedSearch.length === 0) {
      return allSections
    }

    return allSections.filter((section) => {
      return (
        section.code.toLowerCase().includes(normalizedSearch) ||
        section.name.toLowerCase().includes(normalizedSearch)
      )
    })
  }, [allSections, searchTerm])

  const sectionCounts = useMemo(() => {
    const counts: Record<string, number> = {}

    for (const section of allSections) {
      const owned = selectedUserStickers[section.code]
      counts[section.code] = owned == null ? 0 : Object.keys(owned).length
    }

    return counts
  }, [allSections, selectedUserStickers])

  const totals = useMemo(() => {
    let owned = 0
    let albumTotal = 0

    for (const section of allSections) {
      owned += sectionCounts[section.code] ?? 0
      albumTotal += section.stickerCount
    }

    const percentage = albumTotal === 0 ? 0 : Math.round((owned / albumTotal) * 100)
    return { owned, albumTotal, percentage }
  }, [allSections, sectionCounts])

  async function handleToggleSticker(sectionCode: string, stickerNumber: number) {
    if (activeSelectedUser == null) {
      return
    }

    setError(null)
    const normalizedCode = normalizeCode(sectionCode)
    const stickerKey = String(stickerNumber)
    const isOwned = selectedUserStickers[normalizedCode]?.[stickerKey] === true

    setUsers((previousUsers) => {
      const previousUserStickers = previousUsers[activeSelectedUser] ?? {}
      const nextUserStickers: UserStickers = {
        ...previousUserStickers,
      }
      const nextSectionStickers = {
        ...(nextUserStickers[normalizedCode] ?? {}),
      }

      if (isOwned) {
        delete nextSectionStickers[stickerKey]
      } else {
        nextSectionStickers[stickerKey] = true
      }

      if (Object.keys(nextSectionStickers).length === 0) {
        delete nextUserStickers[normalizedCode]
      } else {
        nextUserStickers[normalizedCode] = nextSectionStickers
      }

      return {
        ...previousUsers,
        [activeSelectedUser]: nextUserStickers,
      }
    })

    try {
      if (isOwned) {
        await remove(getSectionRef(activeSelectedUser, normalizedCode, stickerNumber))
        return
      }

      await set(getSectionRef(activeSelectedUser, normalizedCode, stickerNumber), true)
    } catch {
      setError('Unable to update sticker right now.')
      const userRef = ref(database, `users/${activeSelectedUser}`)
      void get(userRef).then((snapshot) => {
        const snapshotValue = snapshot.val()

        if (snapshotValue == null || typeof snapshotValue !== 'object') {
          return
        }

        const stickerValue = (snapshotValue as { stickers?: unknown }).stickers
        const parsedStickers = parseUserStickers(stickerValue)

        setUsers((previousUsers) => {
          return {
            ...previousUsers,
            [activeSelectedUser]: parsedStickers,
          }
        })
      })
    }
  }

  function handleToggleSection(code: string): void {
    setExpandedSections((previous) => {
      const currentValue = previous[code]
      return {
        ...previous,
        [code]: currentValue == null ? true : !currentValue,
      }
    })
  }

  if (activeSelectedUser == null) {
    return (
      <main className="mx-auto min-h-[100dvh] w-full max-w-[430px] bg-[#0e0f12] px-5 pb-[max(env(safe-area-inset-bottom),24px)] pt-[max(env(safe-area-inset-top),24px)] text-white">
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5">
          <h1 className="text-2xl font-semibold tracking-tight">Choose your name</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Select one name and start registering stickers with one tap.
          </p>
          <div className="mt-5 space-y-3">
            {availableUsers.map((username) => (
              <button
                key={username}
                type="button"
                className="flex h-12 w-full items-center justify-between rounded-xl border border-zinc-700 bg-zinc-950 px-4 text-left text-base font-medium active:scale-[0.99]"
                onClick={() => {
                  setSelectedUser(username)
                }}
              >
                <span>{username}</span>
                <span className="text-zinc-500">→</span>
              </button>
            ))}
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="mx-auto min-h-[100dvh] w-full max-w-[430px] bg-[#0e0f12] pb-[calc(env(safe-area-inset-bottom)+84px)] pt-[max(env(safe-area-inset-top),16px)] text-white">
      <div className="px-4">
        <header className="pt-2">
          <h1 className="text-[30px] font-semibold leading-tight">World Cup Album 2026</h1>
          <div className="mt-2 flex items-center justify-between text-zinc-400">
            <button
              type="button"
              className="rounded-lg border border-zinc-700 px-2 py-1 text-xs active:scale-[0.98]"
              onClick={() => {
                setSelectedUser(null)
              }}
            >
              {activeSelectedUser}
            </button>
            <span
              className={`rounded-full px-2 py-1 text-[11px] ${
                isConnected ? 'bg-emerald-600/30 text-emerald-200' : 'bg-rose-600/30 text-rose-200'
              }`}
            >
              {isConnected ? 'Live' : 'Offline'}
            </span>
          </div>
          <div className="mt-3 flex items-end justify-between border-b border-zinc-800 pb-2">
            <div className="text-4xl font-semibold leading-none">{totals.owned}</div>
            <div className="mb-1 text-sm text-zinc-400">
              of {totals.albumTotal} <span className="ml-2 text-white">{totals.percentage}%</span>
            </div>
          </div>
        </header>

        <section className="mt-4">
          <div className="flex items-center gap-2">
            <div className="flex h-12 flex-1 items-center rounded-xl border border-zinc-800 bg-zinc-900 px-3">
              <span className="mr-2 text-zinc-500">⌕</span>
              <input
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value)
                }}
                className="w-full bg-transparent text-[15px] text-zinc-100 outline-none placeholder:text-zinc-500"
                placeholder="Search countries..."
                inputMode="search"
              />
            </div>
            <button
              type="button"
              className="grid h-12 w-12 place-items-center rounded-xl border border-zinc-800 bg-zinc-900 text-xl"
            >
              ↗
            </button>
            <button
              type="button"
              className="grid h-12 w-12 place-items-center rounded-xl border border-zinc-800 bg-zinc-900 text-xl"
            >
              ☰
            </button>
          </div>
        </section>

        {error == null ? null : (
          <p className="mt-3 rounded-xl border border-rose-600/40 bg-rose-600/20 px-3 py-2 text-xs text-rose-100">
            {error}
          </p>
        )}

        <section className="mt-4 space-y-3">
          {filteredSections.map((section) => {
            const isSearching = searchTerm.trim().length > 0
            const isExpanded = isSearching || expandedSections[section.code] === true
            const ownedSet = selectedUserStickers[section.code] ?? {}
            const ownedCount = sectionCounts[section.code] ?? 0

            return (
              <article key={section.code} className="overflow-hidden rounded-2xl bg-zinc-900/85">
                <button
                  type="button"
                  className="flex h-14 w-full items-center justify-between border border-zinc-800 px-3"
                  onClick={() => {
                    handleToggleSection(section.code)
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{section.flag}</span>
                    <span className="text-xl font-semibold tracking-wide">{section.code}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-semibold">
                      {ownedCount}/{section.stickerCount}
                    </span>
                    <span className="text-zinc-400">{isExpanded ? '⌃' : '⌄'}</span>
                  </div>
                </button>

                {isExpanded ? (
                  <div className="border-x border-b border-zinc-800 px-3 pb-3 pt-3">
                    <div className="mb-3 text-xs text-zinc-400">{section.name}</div>
                    <div className="grid grid-cols-6 gap-2 sm:grid-cols-7">
                      {(section.code === 'FWC'
                        ? Array.from({ length: section.stickerCount }, (_, index) => index)
                        : Array.from({ length: section.stickerCount }, (_, index) => index + 1)
                      ).map((stickerNumber) => {
                        const stickerKey = String(stickerNumber)
                        const isOwned = ownedSet[stickerKey] === true
                        const stickerLabel =
                          section.code === 'FWC'
                            ? String(stickerNumber).padStart(2, '0')
                            : String(stickerNumber)

                        return (
                          <button
                            key={`${section.code}-${stickerNumber}`}
                            type="button"
                            className={`h-11 rounded-xl border text-[20px] font-semibold leading-none active:scale-[0.97] ${
                              isOwned
                                ? 'border-white bg-white text-zinc-900'
                                : 'border-zinc-500 bg-transparent text-zinc-100'
                            }`}
                            onClick={() => {
                              void handleToggleSticker(section.code, stickerNumber)
                            }}
                          >
                            {stickerLabel}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ) : null}
              </article>
            )
          })}
        </section>
      </div>

      <nav className="fixed bottom-0 left-1/2 z-20 w-full max-w-[430px] -translate-x-1/2 border-t border-zinc-800 bg-[#101115] pb-[max(env(safe-area-inset-bottom),10px)] pt-2">
        <ul className="grid grid-cols-4 text-center text-xs">
          <li>
            <button type="button" className="w-full text-white">
              <div className="text-lg">🏆</div>
              <div>Album</div>
            </button>
          </li>
          <li>
            <button type="button" className="w-full text-zinc-500">
              <div className="text-lg">🗂️</div>
              <div>Duplicates</div>
            </button>
          </li>
          <li>
            <button type="button" className="w-full text-zinc-500">
              <div className="text-lg">⌕</div>
              <div>Search+</div>
            </button>
          </li>
          <li>
            <button type="button" className="w-full text-zinc-500">
              <div className="text-lg">⚙︎</div>
              <div>Settings</div>
            </button>
          </li>
        </ul>
      </nav>
    </main>
  )
}

export default App
*/
