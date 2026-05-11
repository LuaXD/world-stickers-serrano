import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react'
import { get, onValue, push, ref, remove, serverTimestamp, set } from 'firebase/database'

import { database } from './lib/firebase'

const USERNAME_SEED = ['Addis', 'Carlos', 'Mija', 'Mija Pro', 'Gamax', 'Botas', 'Kevin']
const STORAGE_KEY = 'world-cup-stickers:selected-user'
const LONG_PRESS_DURATION_MS = 450
const LOCAL_ROLLBACK_DELAY_MS = 3000

type UserStickers = Record<string, Record<string, boolean>>
type UserDuplicates = Record<string, Record<string, number>>

type UserData = {
  stickers: UserStickers
  duplicates: UserDuplicates
}

type UsersMap = Record<string, UserData>

type PendingTradeRequestCard = {
  section: string
  sticker: number
  available: number
}

type TradeCard = {
  key: string
  sectionCode: string
  stickerNumber: number
  label: string
  count: number
}

type OwnerTooltipState = {
  key: string
  owners: string[]
}

type AppTab = 'album' | 'duplicates' | 'trades'

type AlbumSection = {
  code: string
  total: number
  title: string
}

const ALBUM_SECTIONS: AlbumSection[] = [
  { code: 'FWC', total: 20, title: 'FWC Specials' },
  { code: 'ARG', total: 20, title: 'Argentina' },
  { code: 'BRA', total: 20, title: 'Brazil' },
  { code: 'ESP', total: 20, title: 'Spain' },
  { code: 'GER', total: 20, title: 'Germany' },
  { code: 'FRA', total: 20, title: 'France' },
  { code: 'ENG', total: 20, title: 'England' },
  { code: 'POR', total: 20, title: 'Portugal' },
  { code: 'ITA', total: 20, title: 'Italy' },
  { code: 'NED', total: 20, title: 'Netherlands' },
  { code: 'URU', total: 20, title: 'Uruguay' },
  { code: 'MEX', total: 20, title: 'Mexico' },
  { code: 'USA', total: 20, title: 'United States' },
  { code: 'COL', total: 20, title: 'Colombia' },
  { code: 'JPN', total: 20, title: 'Japan' },
]

function normalizeCode(rawCode: string): string {
  return rawCode.trim().toUpperCase()
}

function isValidStickerIndex(sectionCode: string, stickerNumber: number): boolean {
  if (!Number.isFinite(stickerNumber)) {
    return false
  }

  if (sectionCode === 'FWC') {
    return stickerNumber >= 0 && stickerNumber <= 19
  }

  return stickerNumber >= 1 && stickerNumber <= 20
}

function formatStickerNumber(sectionCode: string, stickerNumber: number): string {
  if (sectionCode === 'FWC') {
    return stickerNumber.toString().padStart(2, '0')
  }

  return stickerNumber.toString()
}

function formatStickerLabel(sectionCode: string, stickerNumber: number): string {
  return `${sectionCode} ${formatStickerNumber(sectionCode, stickerNumber)}`
}

function parseUserStickers(raw: unknown): UserStickers {
  if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) {
    return {}
  }

  const parsed: UserStickers = {}

  for (const [rawSectionCode, rawSectionStickers] of Object.entries(raw)) {
    const sectionCode = normalizeCode(rawSectionCode)
    if (
      rawSectionStickers == null ||
      typeof rawSectionStickers !== 'object' ||
      Array.isArray(rawSectionStickers)
    ) {
      continue
    }

    const sectionMap: Record<string, boolean> = {}

    for (const [rawStickerKey, rawValue] of Object.entries(rawSectionStickers)) {
      const stickerNumber = Number.parseInt(rawStickerKey, 10)
      if (!isValidStickerIndex(sectionCode, stickerNumber)) {
        continue
      }

      const normalizedStickerKey = formatStickerNumber(sectionCode, stickerNumber)

      if (rawValue === true || rawValue === 1 || rawValue === '1') {
        sectionMap[normalizedStickerKey] = true
      }
    }

    if (Object.keys(sectionMap).length > 0) {
      parsed[sectionCode] = sectionMap
    }
  }

  return parsed
}

function parseUserDuplicates(raw: unknown): UserDuplicates {
  if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) {
    return {}
  }

  const parsed: UserDuplicates = {}

  for (const [rawSectionCode, rawSectionDuplicates] of Object.entries(raw)) {
    const sectionCode = normalizeCode(rawSectionCode)
    if (
      rawSectionDuplicates == null ||
      typeof rawSectionDuplicates !== 'object' ||
      Array.isArray(rawSectionDuplicates)
    ) {
      continue
    }

    const sectionMap: Record<string, number> = {}

    for (const [rawStickerKey, rawValue] of Object.entries(rawSectionDuplicates)) {
      const stickerNumber = Number.parseInt(rawStickerKey, 10)
      if (!isValidStickerIndex(sectionCode, stickerNumber)) {
        continue
      }

      const parsedCount = Number.parseInt(String(rawValue), 10)
      if (!Number.isFinite(parsedCount) || parsedCount <= 0) {
        continue
      }

      const normalizedStickerKey = formatStickerNumber(sectionCode, stickerNumber)
      sectionMap[normalizedStickerKey] = parsedCount
    }

    if (Object.keys(sectionMap).length > 0) {
      parsed[sectionCode] = sectionMap
    }
  }

  return parsed
}

function parseDuplicateFallbackFromStickers(stickers: UserStickers): UserDuplicates {
  const fallback: UserDuplicates = {}

  for (const [sectionCode, sectionStickers] of Object.entries(stickers)) {
    const duplicatesSection: Record<string, number> = {}

    for (const [stickerKey, rawValue] of Object.entries(sectionStickers)) {
      const stickerNumber = Number.parseInt(stickerKey, 10)
      if (!isValidStickerIndex(sectionCode, stickerNumber)) {
        continue
      }

      const numericValue =
        typeof rawValue === 'number'
          ? rawValue
          : rawValue === true
            ? 1
            : Number.parseInt(String(rawValue), 10)

      if (Number.isFinite(numericValue) && numericValue > 1) {
        duplicatesSection[formatStickerNumber(sectionCode, stickerNumber)] = numericValue
      }
    }

    if (Object.keys(duplicatesSection).length > 0) {
      fallback[sectionCode] = duplicatesSection
    }
  }

  return fallback
}

function mergeDuplicateMaps(primary: UserDuplicates, fallback: UserDuplicates): UserDuplicates {
  const merged: UserDuplicates = {}

  for (const [sectionCode, sectionMap] of Object.entries(fallback)) {
    merged[sectionCode] = { ...sectionMap }
  }

  for (const [sectionCode, sectionMap] of Object.entries(primary)) {
    merged[sectionCode] = {
      ...(merged[sectionCode] ?? {}),
      ...sectionMap,
    }
  }

  return merged
}

function parseUserRecord(rawUserRecord: unknown): UserData {
  const parsedStickers = parseUserStickers(
    rawUserRecord != null && typeof rawUserRecord === 'object'
      ? (rawUserRecord as { stickers?: unknown }).stickers
      : undefined,
  )
  const parsedDuplicates = parseUserDuplicates(
    rawUserRecord != null && typeof rawUserRecord === 'object'
      ? (rawUserRecord as { duplicates?: unknown }).duplicates
      : undefined,
  )
  const fallbackDuplicates = parseDuplicateFallbackFromStickers(parsedStickers)

  return {
    stickers: parsedStickers,
    duplicates: mergeDuplicateMaps(parsedDuplicates, fallbackDuplicates),
  }
}

function parseUsersSnapshot(rawUsers: unknown): UsersMap {
  if (rawUsers == null || typeof rawUsers !== 'object' || Array.isArray(rawUsers)) {
    return {}
  }

  const nextUsers: UsersMap = {}

  for (const [username, rawUserData] of Object.entries(rawUsers)) {
    if (username.trim().length === 0) {
      continue
    }

    nextUsers[username] = parseUserRecord(rawUserData)
  }

  return nextUsers
}

function buildTradeCards(duplicates: UserDuplicates): TradeCard[] {
  const cards: TradeCard[] = []

  for (const [sectionCode, sectionMap] of Object.entries(duplicates)) {
    for (const [stickerKey, count] of Object.entries(sectionMap)) {
      if (!Number.isFinite(count) || count <= 0) {
        continue
      }

      const stickerNumber = Number.parseInt(stickerKey, 10)
      if (!isValidStickerIndex(sectionCode, stickerNumber)) {
        continue
      }

      cards.push({
        key: `${sectionCode}:${formatStickerNumber(sectionCode, stickerNumber)}`,
        sectionCode,
        stickerNumber,
        label: formatStickerLabel(sectionCode, stickerNumber),
        count,
      })
    }
  }

  return cards.sort((leftCard, rightCard) => {
    if (rightCard.count !== leftCard.count) {
      return rightCard.count - leftCard.count
    }

    if (leftCard.sectionCode !== rightCard.sectionCode) {
      return leftCard.sectionCode.localeCompare(rightCard.sectionCode)
    }

    return leftCard.stickerNumber - rightCard.stickerNumber
  })
}

function readPersistedUser(): string | null {
  if (typeof window === 'undefined') {
    return null
  }

  const stored = window.localStorage.getItem(STORAGE_KEY)
  return stored != null && stored.length > 0 ? stored : null
}

export default function App() {
  const [availableUsers, setAvailableUsers] = useState<string[]>(USERNAME_SEED)
  const [selectedUser, setSelectedUser] = useState<string | null>(() => readPersistedUser())
  const [users, setUsers] = useState<UsersMap>({})
  const [activeTab, setActiveTab] = useState<AppTab>('album')
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({})
  const [showOwnedSections, setShowOwnedSections] = useState<Record<string, boolean>>({})
  const [activeOwners, setActiveOwners] = useState<OwnerTooltipState | null>(null)
  const [tradePartnerSelection, setTradePartnerSelection] = useState<string | null>(null)
  const [selectedOfferCards, setSelectedOfferCards] = useState<Record<string, true>>({})
  const [selectedRequestCards, setSelectedRequestCards] = useState<Record<string, true>>({})
  const [tradeStatus, setTradeStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [longPressTimerId, setLongPressTimerId] = useState<number | null>(null)
  const [skipNextToggleKey, setSkipNextToggleKey] = useState<string | null>(null)

  useEffect(() => {
    if (selectedUser == null) {
      return
    }

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, selectedUser)
    }
  }, [selectedUser])

  useEffect(() => {
    const usernamesRef = ref(database, 'usernames')

    const unsubscribe = onValue(
      usernamesRef,
      async (snapshot) => {
        const raw = snapshot.val()

        if (!Array.isArray(raw) || raw.length === 0) {
          try {
            await set(usernamesRef, USERNAME_SEED)
            setAvailableUsers(USERNAME_SEED)
          } catch {
            setError('Could not load usernames from database.')
          }
          return
        }

        const nextUsernames = raw
          .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
          .map((value) => value.trim())

        setAvailableUsers(nextUsernames.length > 0 ? nextUsernames : USERNAME_SEED)
      },
      () => setError('Failed to subscribe to usernames.'),
    )

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    const usersRef = ref(database, 'users')

    const unsubscribe = onValue(
      usersRef,
      (snapshot) => {
        const parsedUsers = parseUsersSnapshot(snapshot.val())
        setUsers(parsedUsers)
      },
      () => setError('Failed to subscribe to sticker data.'),
    )

    return () => unsubscribe()
  }, [])

  const activeSelectedUser =
    selectedUser != null && availableUsers.includes(selectedUser) ? selectedUser : null

  const selectedUserData = activeSelectedUser != null ? users[activeSelectedUser] : undefined
  const selectedUserStickers = useMemo(() => selectedUserData?.stickers ?? {}, [selectedUserData])
  const selectedUserDuplicates = useMemo(
    () => selectedUserData?.duplicates ?? {},
    [selectedUserData],
  )

  const tradeCandidates = useMemo(
    () => availableUsers.filter((username) => username !== activeSelectedUser),
    [availableUsers, activeSelectedUser],
  )
  const activeTradePartner = useMemo(() => {
    if (tradeCandidates.length === 0) {
      return null
    }
    if (
      tradePartnerSelection != null &&
      tradeCandidates.includes(tradePartnerSelection)
    ) {
      return tradePartnerSelection
    }
    return tradeCandidates[0]
  }, [tradeCandidates, tradePartnerSelection])

  const partnerData = activeTradePartner != null ? users[activeTradePartner] : undefined
  const partnerDuplicates = useMemo(() => partnerData?.duplicates ?? {}, [partnerData])

  const totalOwnedCount = useMemo(() => {
    let count = 0
    for (const sectionMap of Object.values(selectedUserStickers)) {
      for (const hasSticker of Object.values(sectionMap)) {
        if (hasSticker === true) {
          count += 1
        }
      }
    }
    return count
  }, [selectedUserStickers])

  const totalDuplicateCount = useMemo(() => {
    let count = 0
    for (const sectionMap of Object.values(selectedUserDuplicates)) {
      for (const duplicateAmount of Object.values(sectionMap)) {
        if (Number.isFinite(duplicateAmount) && duplicateAmount > 0) {
          count += duplicateAmount
        }
      }
    }
    return count
  }, [selectedUserDuplicates])

  const myTradeCards = useMemo(
    () => buildTradeCards(selectedUserDuplicates),
    [selectedUserDuplicates],
  )
  const partnerTradeCards = useMemo(() => buildTradeCards(partnerDuplicates), [partnerDuplicates])

  const offeredCards = useMemo(
    () => myTradeCards.filter((card) => selectedOfferCards[card.key] === true),
    [myTradeCards, selectedOfferCards],
  )
  const requestedCards = useMemo(
    () => partnerTradeCards.filter((card) => selectedRequestCards[card.key] === true),
    [partnerTradeCards, selectedRequestCards],
  )

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

    return owners
  }, [users, activeSelectedUser])

  const filteredSections = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (term.length === 0) {
      return ALBUM_SECTIONS
    }

    return ALBUM_SECTIONS.filter((section) =>
      `${section.code} ${section.title}`.toLowerCase().includes(term),
    )
  }, [searchTerm])

  const filteredMyTradeCards = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (term.length === 0) {
      return myTradeCards
    }

    return myTradeCards.filter((card) =>
      `${card.sectionCode} ${card.label}`.toLowerCase().includes(term),
    )
  }, [myTradeCards, searchTerm])

  const filteredPartnerTradeCards = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (term.length === 0) {
      return partnerTradeCards
    }

    return partnerTradeCards.filter((card) =>
      `${card.sectionCode} ${card.label}`.toLowerCase().includes(term),
    )
  }, [partnerTradeCards, searchTerm])

  const clearLongPressTimer = () => {
    if (longPressTimerId != null) {
      window.clearTimeout(longPressTimerId)
      setLongPressTimerId(null)
    }
  }

  const handleSelectUser = (username: string) => {
    setSelectedUser(username)
    setTradePartnerSelection(null)
    setSelectedOfferCards({})
    setSelectedRequestCards({})
    setActiveOwners(null)
    setError(null)
    setTradeStatus(null)
  }

  const handleToggleSection = (sectionCode: string) => {
    setExpandedSections((current) => ({
      ...current,
      [sectionCode]: !(current[sectionCode] ?? false),
    }))
  }

  const handleToggleShowOwned = (sectionCode: string) => {
    setShowOwnedSections((current) => ({
      ...current,
      [sectionCode]: !(current[sectionCode] ?? false),
    }))
  }

  const handleOwnerHoverStart = (ownerMapKey: string) => {
    const owners = friendDuplicateOwners[ownerMapKey]
    if (owners == null || owners.length === 0) {
      return
    }
    setActiveOwners({ key: ownerMapKey, owners })
  }

  const handleOwnerHoverEnd = (ownerMapKey: string) => {
    setActiveOwners((current) => {
      if (current == null || current.key !== ownerMapKey) {
        return current
      }
      return null
    })
  }

  const handleOwnerTouchStart = (ownerMapKey: string) => {
    const owners = friendDuplicateOwners[ownerMapKey]
    if (owners == null || owners.length === 0) {
      return
    }
    clearLongPressTimer()
    const timerId = window.setTimeout(() => {
      setSkipNextToggleKey(ownerMapKey)
      setActiveOwners({ key: ownerMapKey, owners })
      setLongPressTimerId(null)
    }, LONG_PRESS_DURATION_MS)
    setLongPressTimerId(timerId)
  }

  const handleOwnerTouchEnd = () => {
    clearLongPressTimer()
  }

  const handleToggleTradeCard = (
    cardKey: string,
    setState: Dispatch<SetStateAction<Record<string, true>>>,
  ) => {
    setState((current) => {
      const next = { ...current }
      if (next[cardKey] === true) {
        delete next[cardKey]
      } else {
        next[cardKey] = true
      }
      return next
    })
  }

  const handleSendTradeRequest = async () => {
    if (activeSelectedUser == null || activeTradePartner == null) {
      return
    }

    if (offeredCards.length === 0 || requestedCards.length === 0) {
      setTradeStatus('Select at least one card from each list.')
      return
    }

    setTradeStatus(null)
    setError(null)

    const toPayloadCard = (card: TradeCard): PendingTradeRequestCard => ({
      section: card.sectionCode,
      sticker: card.stickerNumber,
      available: card.count,
    })

    try {
      const tradeRequestsRef = ref(database, 'tradeRequests')
      await set(push(tradeRequestsRef), {
        from: activeSelectedUser,
        to: activeTradePartner,
        offered: offeredCards.map(toPayloadCard),
        requested: requestedCards.map(toPayloadCard),
        status: 'pending',
        createdAt: serverTimestamp(),
      })
      setTradeStatus(`Trade request sent to ${activeTradePartner}.`)
      setSelectedOfferCards({})
      setSelectedRequestCards({})
    } catch {
      setTradeStatus('Could not send trade request, please retry.')
    }
  }

  const handleToggleSticker = async (sectionCode: string, stickerNumber: number) => {
    if (activeSelectedUser == null) {
      return
    }

    const normalizedSectionCode = normalizeCode(sectionCode)
    const stickerKey = formatStickerNumber(normalizedSectionCode, stickerNumber)
    const stickerPath = `users/${activeSelectedUser}/stickers/${normalizedSectionCode}/${stickerKey}`
    const stickerRef = ref(database, stickerPath)

    const currentlyOwned = selectedUserStickers[normalizedSectionCode]?.[stickerKey] === true

    const currentUserSnapshot = users[activeSelectedUser] ?? {
      stickers: {},
      duplicates: {},
    }

    const nextSectionStickers = {
      ...(currentUserSnapshot.stickers[normalizedSectionCode] ?? {}),
      [stickerKey]: !currentlyOwned,
    }

    if (!currentlyOwned) {
      nextSectionStickers[stickerKey] = true
    } else {
      delete nextSectionStickers[stickerKey]
    }

    const hasAnyStickerInSection = Object.keys(nextSectionStickers).length > 0

    const nextUserStickers: UserStickers = {
      ...currentUserSnapshot.stickers,
    }

    if (hasAnyStickerInSection) {
      nextUserStickers[normalizedSectionCode] = nextSectionStickers
    } else {
      delete nextUserStickers[normalizedSectionCode]
    }

    const previousUsers = users
    setUsers((current) => ({
      ...current,
      [activeSelectedUser]: {
        ...currentUserSnapshot,
        stickers: nextUserStickers,
      },
    }))
    setError(null)

    try {
      if (currentlyOwned) {
        await remove(stickerRef)
      } else {
        await set(stickerRef, true)
      }
    } catch {
      setUsers(previousUsers)
      setError('Could not update sticker right now.')

      window.setTimeout(async () => {
        try {
          const snapshot = await get(ref(database, `users/${activeSelectedUser}`))
          const latest = parseUserRecord(snapshot.val())
          setUsers((current) => ({
            ...current,
            [activeSelectedUser]: latest,
          }))
        } catch {
          setError('Sync failed after update error.')
        }
      }, LOCAL_ROLLBACK_DELAY_MS)
    }
  }

  const handleChangeDuplicate = async (
    sectionCode: string,
    stickerNumber: number,
    delta: 1 | -1,
  ) => {
    if (activeSelectedUser == null) {
      return
    }

    const normalizedSectionCode = normalizeCode(sectionCode)
    const stickerKey = formatStickerNumber(normalizedSectionCode, stickerNumber)
    const duplicatePath = `users/${activeSelectedUser}/duplicates/${normalizedSectionCode}/${stickerKey}`
    const duplicateRef = ref(database, duplicatePath)

    const currentValue = selectedUserDuplicates[normalizedSectionCode]?.[stickerKey] ?? 0
    const nextValue = Math.max(0, currentValue + delta)

    const currentUserSnapshot = users[activeSelectedUser] ?? {
      stickers: {},
      duplicates: {},
    }

    const nextSectionDuplicates = {
      ...(currentUserSnapshot.duplicates[normalizedSectionCode] ?? {}),
    }

    if (nextValue > 0) {
      nextSectionDuplicates[stickerKey] = nextValue
    } else {
      delete nextSectionDuplicates[stickerKey]
    }

    const hasAnyDuplicateInSection = Object.keys(nextSectionDuplicates).length > 0

    const nextUserDuplicates: UserDuplicates = {
      ...currentUserSnapshot.duplicates,
    }

    if (hasAnyDuplicateInSection) {
      nextUserDuplicates[normalizedSectionCode] = nextSectionDuplicates
    } else {
      delete nextUserDuplicates[normalizedSectionCode]
    }

    const previousUsers = users
    setUsers((current) => ({
      ...current,
      [activeSelectedUser]: {
        ...currentUserSnapshot,
        duplicates: nextUserDuplicates,
      },
    }))
    setError(null)

    try {
      if (nextValue === 0) {
        await remove(duplicateRef)
      } else {
        await set(duplicateRef, nextValue)
      }
    } catch {
      setUsers(previousUsers)
      setError('Could not update duplicate count right now.')

      window.setTimeout(async () => {
        try {
          const snapshot = await get(ref(database, `users/${activeSelectedUser}`))
          const latest = parseUserRecord(snapshot.val())
          setUsers((current) => ({
            ...current,
            [activeSelectedUser]: latest,
          }))
        } catch {
          setError('Sync failed after duplicate update error.')
        }
      }, LOCAL_ROLLBACK_DELAY_MS)
    }
  }

  const handleStickerPress = async (
    sectionCode: string,
    stickerNumber: number,
    ownerMapKey: string,
  ) => {
    const shouldSkipToggle = skipNextToggleKey === ownerMapKey

    if (shouldSkipToggle) {
      setSkipNextToggleKey(null)
      return
    }

    setActiveOwners((current) => {
      if (current == null || current.key !== ownerMapKey) {
        return current
      }
      return null
    })

    await handleToggleSticker(sectionCode, stickerNumber)
  }

  useEffect(() => {
    return () => {
      if (longPressTimerId != null) {
        window.clearTimeout(longPressTimerId)
      }
    }
  }, [longPressTimerId])

  if (activeSelectedUser == null) {
    return (
      <main className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col px-5 pb-[max(env(safe-area-inset-bottom),1.25rem)] pt-[max(env(safe-area-inset-top),1.25rem)] text-zinc-100">
        <section className="mt-10 rounded-3xl border border-white/10 bg-zinc-900/75 p-6 shadow-2xl shadow-black/30 backdrop-blur">
          <h1 className="text-2xl font-bold">Choose your name</h1>
          <p className="mt-2 text-sm text-zinc-300">
            Tap your user once, then start checking your album.
          </p>
          <div className="mt-6 grid grid-cols-1 gap-3">
            {availableUsers.map((username) => (
              <button
                type="button"
                key={username}
                onClick={() => handleSelectUser(username)}
                className="min-h-11 rounded-2xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-left text-base font-medium transition active:scale-[0.99] active:border-zinc-500 active:bg-zinc-700"
              >
                {username}
              </button>
            ))}
          </div>
          {error != null ? (
            <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {error}
            </p>
          ) : null}
        </section>
      </main>
    )
  }

  return (
    <main className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col px-4 pb-[calc(max(env(safe-area-inset-bottom),1rem)+4.75rem)] pt-[max(env(safe-area-inset-top),0.75rem)] text-zinc-100">
      <header className="sticky top-0 z-20 rounded-3xl border border-white/10 bg-zinc-900/90 p-4 shadow-xl shadow-black/20 backdrop-blur">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold">
              {activeTab === 'album'
                ? 'World Cup Album 2026'
                : activeTab === 'duplicates'
                  ? 'Duplicates'
                  : 'Trades'}
            </h1>
            <p className="mt-1 text-xs text-zinc-300">
              {activeTab === 'album'
                ? `${activeSelectedUser}: ${totalOwnedCount} collected`
                : activeTab === 'duplicates'
                  ? `${activeSelectedUser}: ${totalDuplicateCount} total duplicates`
                  : `${activeSelectedUser}: ${offeredCards.length} offering / ${requestedCards.length} requested`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setSelectedUser(null)
              setTradePartnerSelection(null)
              setSelectedOfferCards({})
              setSelectedRequestCards({})
              setActiveOwners(null)
              setTradeStatus(null)
            }}
            className="min-h-11 rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs font-semibold text-zinc-200 transition active:scale-[0.98] active:bg-zinc-700"
          >
            Change
          </button>
        </div>

        <div className="mt-3 rounded-2xl border border-zinc-700/70 bg-zinc-800/60 px-3 py-2">
          <div className="text-[11px] uppercase tracking-wide text-zinc-400">Quick search</div>
          <label className="mt-1 flex items-center gap-2">
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              type="search"
              placeholder={activeTab === 'trades' ? 'Search cards...' : 'Search countries...'}
              className="h-11 w-full rounded-xl border border-zinc-600 bg-zinc-900 px-3 text-sm text-zinc-100 outline-none ring-0 placeholder:text-zinc-500 focus:border-blue-400"
            />
          </label>
        </div>

        {error != null ? (
          <p className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {error}
          </p>
        ) : null}

        {tradeStatus != null ? (
          <p className="mt-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">
            {tradeStatus}
          </p>
        ) : null}
      </header>

      {activeTab === 'trades' ? (
        <section className="mt-4 space-y-3">
          <article className="rounded-2xl border border-white/10 bg-zinc-900/80 p-3">
            <label className="flex flex-col gap-2 text-sm text-zinc-300">
              <span className="font-semibold text-zinc-100">Trade with</span>
              <select
                value={activeTradePartner ?? ''}
                onChange={(event) => {
                  const nextPartner = event.target.value
                  setTradePartnerSelection(nextPartner.length > 0 ? nextPartner : null)
                  setSelectedOfferCards({})
                  setSelectedRequestCards({})
                  setTradeStatus(null)
                }}
                className="h-11 rounded-xl border border-zinc-600 bg-zinc-900 px-3 text-sm text-zinc-100 outline-none focus:border-blue-400"
              >
                {tradeCandidates.map((username) => (
                  <option key={username} value={username}>
                    {username}
                  </option>
                ))}
              </select>
            </label>
          </article>

          <article className="rounded-2xl border border-white/10 bg-zinc-900/80 p-3">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Your duplicates</h2>
              <span className="text-xs text-zinc-400">Sorted by quantity</span>
            </div>
            {filteredMyTradeCards.length === 0 ? (
              <p className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-4 text-sm text-zinc-400">
                You have no duplicates to offer.
              </p>
            ) : (
              <ul className="max-h-60 space-y-2 overflow-y-auto pr-1">
                {filteredMyTradeCards.map((card) => {
                  const selected = selectedOfferCards[card.key] === true
                  return (
                    <li key={card.key}>
                      <button
                        type="button"
                        onClick={() => handleToggleTradeCard(card.key, setSelectedOfferCards)}
                        className={`flex min-h-11 w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-sm transition active:scale-[0.99] ${
                          selected
                            ? 'border-blue-400 bg-blue-500/20 text-blue-100'
                            : 'border-zinc-700 bg-zinc-900 text-zinc-100 active:border-zinc-500'
                        }`}
                      >
                        <span>{card.label}</span>
                        <span className="font-semibold">x{card.count}</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </article>

          <article className="rounded-2xl border border-white/10 bg-zinc-900/80 p-3">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold">
                {activeTradePartner != null ? `${activeTradePartner}'s duplicates` : 'Requested cards'}
              </h2>
              <span className="text-xs text-zinc-400">Select what you want</span>
            </div>
            {activeTradePartner == null ? (
              <p className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-4 text-sm text-zinc-400">
                No other user available.
              </p>
            ) : filteredPartnerTradeCards.length === 0 ? (
              <p className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-4 text-sm text-zinc-400">
                {activeTradePartner} has no duplicates right now.
              </p>
            ) : (
              <ul className="max-h-60 space-y-2 overflow-y-auto pr-1">
                {filteredPartnerTradeCards.map((card) => {
                  const selected = selectedRequestCards[card.key] === true
                  return (
                    <li key={card.key}>
                      <button
                        type="button"
                        onClick={() => handleToggleTradeCard(card.key, setSelectedRequestCards)}
                        className={`flex min-h-11 w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-sm transition active:scale-[0.99] ${
                          selected
                            ? 'border-amber-400 bg-amber-500/20 text-amber-100'
                            : 'border-zinc-700 bg-zinc-900 text-zinc-100 active:border-zinc-500'
                        }`}
                      >
                        <span>{card.label}</span>
                        <span className="font-semibold">x{card.count}</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </article>

          <button
            type="button"
            onClick={handleSendTradeRequest}
            disabled={
              activeTradePartner == null || offeredCards.length === 0 || requestedCards.length === 0
            }
            className="min-h-11 w-full rounded-2xl border border-emerald-400/60 bg-emerald-500/20 px-4 py-3 text-sm font-semibold text-emerald-100 transition active:scale-[0.99] disabled:cursor-not-allowed disabled:border-zinc-700 disabled:bg-zinc-800 disabled:text-zinc-500"
          >
            Send trade request
          </button>
        </section>
      ) : (
        <section className="mt-4 space-y-3">
          {filteredSections.map((section) => {
            const normalizedSectionCode = normalizeCode(section.code)
            const sectionStickers = selectedUserStickers[normalizedSectionCode] ?? {}
            const sectionDuplicates = selectedUserDuplicates[normalizedSectionCode] ?? {}
            const isExpanded = expandedSections[normalizedSectionCode] ?? false
            const showOwned = showOwnedSections[normalizedSectionCode] ?? false

            const stickerNumbers = Array.from({ length: section.total }, (_, index) =>
              normalizedSectionCode === 'FWC' ? index : index + 1,
            )

            const visibleStickerNumbers =
              activeTab === 'album' && !showOwned
                ? stickerNumbers.filter((stickerNumber) => {
                    const stickerKey = formatStickerNumber(normalizedSectionCode, stickerNumber)
                    return sectionStickers[stickerKey] !== true
                  })
                : stickerNumbers

            const ownedInSection = stickerNumbers.reduce((count, stickerNumber) => {
              const stickerKey = formatStickerNumber(normalizedSectionCode, stickerNumber)
              return sectionStickers[stickerKey] === true ? count + 1 : count
            }, 0)

            const duplicateCountInSection = Object.values(sectionDuplicates).reduce(
              (accumulator, value) => accumulator + value,
              0,
            )

            return (
              <article
                key={section.code}
                className="rounded-2xl border border-white/10 bg-zinc-900/80 p-3 shadow-md shadow-black/20"
              >
                <button
                  type="button"
                  onClick={() => handleToggleSection(normalizedSectionCode)}
                  className="flex min-h-11 w-full items-center justify-between gap-3 rounded-xl border border-zinc-700 bg-zinc-800/90 px-3 py-2 text-left transition active:scale-[0.99] active:border-zinc-500"
                >
                  <div>
                    <div className="text-sm font-semibold">
                      {section.code} · {section.title}
                    </div>
                    <div className="text-xs text-zinc-400">
                      {activeTab === 'album'
                        ? `${ownedInSection}/${section.total} collected`
                        : `${duplicateCountInSection} duplicates`}
                    </div>
                  </div>
                  <span className="text-xl leading-none">{isExpanded ? '−' : '+'}</span>
                </button>

                {isExpanded ? (
                  <div className="mt-3 space-y-3">
                    {activeTab === 'album' ? (
                      <button
                        type="button"
                        onClick={() => handleToggleShowOwned(normalizedSectionCode)}
                        className="min-h-11 rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-200 transition active:scale-[0.99] active:border-zinc-500"
                      >
                        {showOwned ? 'Hide collected' : 'Show collected'}
                      </button>
                    ) : null}

                    <div className="grid grid-cols-4 gap-2 xs:grid-cols-5">
                      {visibleStickerNumbers.length === 0 && activeTab === 'album' ? (
                        <p className="col-span-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-4 text-center text-sm text-zinc-400">
                          All collected in this section.
                        </p>
                      ) : (
                        visibleStickerNumbers.map((stickerNumber) => {
                          const stickerKey = formatStickerNumber(normalizedSectionCode, stickerNumber)
                          const hasSticker = sectionStickers[stickerKey] === true
                          const duplicateValue = sectionDuplicates[stickerKey] ?? 0
                          const ownerMapKey = `${normalizedSectionCode}:${stickerKey}`
                          const duplicateOwners = friendDuplicateOwners[ownerMapKey] ?? []
                          const hasFriendDuplicate = duplicateOwners.length > 0
                          const isOwnerPopoverVisible =
                            activeOwners != null && activeOwners.key === ownerMapKey

                          if (activeTab === 'duplicates' && duplicateValue <= 0) {
                            return (
                              <div
                                key={`${section.code}-${stickerNumber}`}
                                className="flex min-h-11 items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900 px-2 py-2 text-sm text-zinc-500"
                              >
                                <span className="font-medium">
                                  {formatStickerNumber(normalizedSectionCode, stickerNumber)}
                                </span>
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleChangeDuplicate(normalizedSectionCode, stickerNumber, -1)
                                    }
                                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-400 active:scale-[0.98]"
                                    aria-label={`Decrease duplicates for ${formatStickerLabel(normalizedSectionCode, stickerNumber)}`}
                                  >
                                    −
                                  </button>
                                  <span className="w-6 text-center text-xs">0</span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleChangeDuplicate(normalizedSectionCode, stickerNumber, 1)
                                    }
                                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-200 active:scale-[0.98]"
                                    aria-label={`Increase duplicates for ${formatStickerLabel(normalizedSectionCode, stickerNumber)}`}
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                            )
                          }

                          if (activeTab === 'duplicates') {
                            return (
                              <div
                                key={`${section.code}-${stickerNumber}`}
                                className="flex min-h-11 items-center justify-between rounded-xl border border-zinc-700 bg-zinc-800 px-2 py-2 text-sm"
                              >
                                <span className="font-medium">
                                  {formatStickerNumber(normalizedSectionCode, stickerNumber)}
                                </span>
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleChangeDuplicate(normalizedSectionCode, stickerNumber, -1)
                                    }
                                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-100 active:scale-[0.98]"
                                    aria-label={`Decrease duplicates for ${formatStickerLabel(normalizedSectionCode, stickerNumber)}`}
                                  >
                                    −
                                  </button>
                                  <span className="w-6 text-center text-xs font-semibold">
                                    {duplicateValue}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleChangeDuplicate(normalizedSectionCode, stickerNumber, 1)
                                    }
                                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-100 active:scale-[0.98]"
                                    aria-label={`Increase duplicates for ${formatStickerLabel(normalizedSectionCode, stickerNumber)}`}
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                            )
                          }

                          return (
                            <div key={`${section.code}-${stickerNumber}`} className="relative">
                              <button
                                type="button"
                                onClick={() =>
                                  handleStickerPress(
                                    normalizedSectionCode,
                                    stickerNumber,
                                    ownerMapKey,
                                  )
                                }
                                onMouseEnter={() => handleOwnerHoverStart(ownerMapKey)}
                                onMouseLeave={() => handleOwnerHoverEnd(ownerMapKey)}
                                onTouchStart={() => handleOwnerTouchStart(ownerMapKey)}
                                onTouchEnd={handleOwnerTouchEnd}
                                onTouchCancel={handleOwnerTouchEnd}
                                className={`relative flex min-h-11 w-full items-center justify-center rounded-xl border text-sm font-semibold transition active:scale-[0.98] ${
                                  hasSticker
                                    ? 'border-emerald-400/70 bg-emerald-500/20 text-emerald-100'
                                    : hasFriendDuplicate
                                      ? 'border-amber-400/70 bg-amber-500/20 text-amber-100'
                                      : 'border-zinc-700 bg-zinc-800 text-zinc-300'
                                }`}
                                aria-label={`Toggle ${formatStickerLabel(normalizedSectionCode, stickerNumber)}`}
                              >
                                {formatStickerNumber(normalizedSectionCode, stickerNumber)}
                              </button>
                              {isOwnerPopoverVisible ? (
                                <div className="pointer-events-none absolute left-1/2 top-full z-30 mt-2 w-40 -translate-x-1/2 rounded-xl border border-amber-300/50 bg-zinc-950/95 px-2 py-1 text-[11px] text-amber-100 shadow-lg shadow-black/40">
                                  {activeOwners.owners.join(', ')}
                                </div>
                              ) : null}
                            </div>
                          )
                        })
                      )}
                    </div>
                  </div>
                ) : null}
              </article>
            )
          })}
        </section>
      )}

      <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto flex w-full max-w-md gap-2 border-t border-white/10 bg-zinc-950/95 px-4 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-2 backdrop-blur">
        <button
          type="button"
          onClick={() => {
            setActiveTab('album')
            setActiveOwners(null)
          }}
          className={`min-h-11 flex-1 rounded-xl border px-3 py-2 text-sm font-semibold transition active:scale-[0.98] ${
            activeTab === 'album'
              ? 'border-blue-400 bg-blue-500/20 text-blue-100'
              : 'border-zinc-700 bg-zinc-900 text-zinc-300'
          }`}
        >
          Album
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('duplicates')
            setActiveOwners(null)
          }}
          className={`min-h-11 flex-1 rounded-xl border px-3 py-2 text-sm font-semibold transition active:scale-[0.98] ${
            activeTab === 'duplicates'
              ? 'border-blue-400 bg-blue-500/20 text-blue-100'
              : 'border-zinc-700 bg-zinc-900 text-zinc-300'
          }`}
        >
          Duplicates
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('trades')
            setActiveOwners(null)
          }}
          className={`min-h-11 flex-1 rounded-xl border px-3 py-2 text-sm font-semibold transition active:scale-[0.98] ${
            activeTab === 'trades'
              ? 'border-blue-400 bg-blue-500/20 text-blue-100'
              : 'border-zinc-700 bg-zinc-900 text-zinc-300'
          }`}
        >
          Trades
        </button>
      </nav>
    </main>
  )
}
