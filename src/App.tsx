import { useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from 'react'
import {
  get,
  onValue,
  push,
  ref,
  remove,
  serverTimestamp,
  set,
  type DatabaseReference,
} from 'firebase/database'

import AlbumSections from './components/AlbumSections'
import BottomTabs from './components/BottomTabs'
import NamePicker from './components/NamePicker'
import TradesTab from './components/TradesTab'
import { database } from './lib/firebase'
import {
  ALBUM_SECTIONS,
  USERNAME_SEED,
  USER_STORAGE_KEY,
  buildTradeCards,
  formatStickerLabel,
  getStickerNumbers,
  normalizeCode,
  parseUserRecord,
  parseUsernamesSnapshot,
  parseUsersSnapshot,
} from './lib/stickerHelpers'
import type { ActiveOwners, AppTab, SectionDefinition, UserRecord, UsersState } from './types/stickers'

function getStickerRef(username: string, sectionCode: string, stickerNumber: number): DatabaseReference {
  return ref(database, `users/${username}/stickers/${sectionCode}/${stickerNumber}`)
}

function getDuplicateRef(username: string, sectionCode: string, stickerNumber: number): DatabaseReference {
  return ref(database, `users/${username}/duplicates/${sectionCode}/${stickerNumber}`)
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
  const [tradeStatus, setTradeStatus] = useState<string | null>(null)
  const [activeOwners, setActiveOwners] = useState<ActiveOwners | null>(null)
  const [tradePartnerSelection, setTradePartnerSelection] = useState<string | null>(null)
  const [selectedOfferCards, setSelectedOfferCards] = useState<Record<string, true>>({})
  const [selectedRequestCards, setSelectedRequestCards] = useState<Record<string, true>>({})

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

    const userStickersRef = ref(database, `users/${activeSelectedUser}/stickers`)
    const userDuplicatesRef = ref(database, `users/${activeSelectedUser}/duplicates`)

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

  const selectedUserData = useMemo<UserRecord>(() => {
    if (activeSelectedUser == null) {
      return { stickers: {}, duplicates: {} }
    }

    return users[activeSelectedUser] ?? { stickers: {}, duplicates: {} }
  }, [activeSelectedUser, users])

  const selectedUserStickers = selectedUserData.stickers
  const selectedUserDuplicates = selectedUserData.duplicates

  const tradeCandidates = useMemo(() => {
    return availableUsers.filter((username) => {
      return activeSelectedUser != null && username !== activeSelectedUser
    })
  }, [activeSelectedUser, availableUsers])

  const activeTradePartner = useMemo(() => {
    if (tradeCandidates.length === 0) {
      return null
    }

    if (tradePartnerSelection != null && tradeCandidates.includes(tradePartnerSelection)) {
      return tradePartnerSelection
    }

    return tradeCandidates[0]
  }, [tradeCandidates, tradePartnerSelection])

  const activeTradePartnerData = useMemo<UserRecord>(() => {
    if (activeTradePartner == null) {
      return { stickers: {}, duplicates: {} }
    }

    return users[activeTradePartner] ?? { stickers: {}, duplicates: {} }
  }, [activeTradePartner, users])

  const activeTradePartnerDuplicates = activeTradePartnerData.duplicates

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

  const sectionNameByCode = useMemo(() => {
    const map: Record<string, string> = {}

    for (const section of allSections) {
      map[section.code] = section.name
    }

    return map
  }, [allSections])

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

  const myTradeCards = useMemo(() => {
    return buildTradeCards(selectedUserDuplicates, sectionNameByCode)
  }, [sectionNameByCode, selectedUserDuplicates])

  const partnerTradeCards = useMemo(() => {
    return buildTradeCards(activeTradePartnerDuplicates, sectionNameByCode)
  }, [activeTradePartnerDuplicates, sectionNameByCode])

  const filteredMyTradeCards = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    if (normalizedSearch.length === 0) {
      return myTradeCards
    }

    return myTradeCards.filter((card) => {
      return (
        card.label.toLowerCase().includes(normalizedSearch) ||
        card.sectionName.toLowerCase().includes(normalizedSearch)
      )
    })
  }, [myTradeCards, searchTerm])

  const filteredPartnerTradeCards = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    if (normalizedSearch.length === 0) {
      return partnerTradeCards
    }

    return partnerTradeCards.filter((card) => {
      return (
        card.label.toLowerCase().includes(normalizedSearch) ||
        card.sectionName.toLowerCase().includes(normalizedSearch)
      )
    })
  }, [partnerTradeCards, searchTerm])

  const selectedOfferTradeCards = useMemo(() => {
    return myTradeCards.filter((card) => {
      return selectedOfferCards[card.key] === true
    })
  }, [myTradeCards, selectedOfferCards])

  const selectedRequestTradeCards = useMemo(() => {
    return partnerTradeCards.filter((card) => {
      return selectedRequestCards[card.key] === true
    })
  }, [partnerTradeCards, selectedRequestCards])

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

  async function handleToggleSticker(sectionCode: string, stickerNumber: number): Promise<void> {
    if (activeSelectedUser == null) {
      return
    }

    setError(null)
    const normalizedCode = normalizeCode(sectionCode)
    const stickerKey = String(stickerNumber)
    const isOwned = selectedUserStickers[normalizedCode]?.[stickerKey] === true

    setUserRecord(activeSelectedUser, (current) => {
      const nextStickers = { ...current.stickers }
      const nextSectionStickers = { ...(nextStickers[normalizedCode] ?? {}) }

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
      } else {
        await set(getStickerRef(activeSelectedUser, normalizedCode, stickerNumber), true)
      }
    } catch {
      setError('Unable to update sticker right now.')
      const userRef = ref(database, `users/${activeSelectedUser}`)
      void get(userRef).then((snapshot) => {
        setUserRecord(activeSelectedUser, () => parseUserRecord(snapshot.val()))
      })
    }
  }

  async function handleChangeDuplicate(
    sectionCode: string,
    stickerNumber: number,
    delta: number,
  ): Promise<void> {
    if (activeSelectedUser == null) {
      return
    }

    setError(null)
    const normalizedCode = normalizeCode(sectionCode)
    const stickerKey = String(stickerNumber)
    const currentCount = selectedUserDuplicates[normalizedCode]?.[stickerKey] ?? 0
    const nextCount = Math.max(0, currentCount + delta)

    setUserRecord(activeSelectedUser, (current) => {
      const nextDuplicates = { ...current.duplicates }
      const nextSectionDuplicates = { ...(nextDuplicates[normalizedCode] ?? {}) }

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
      } else {
        await set(getDuplicateRef(activeSelectedUser, normalizedCode, stickerNumber), nextCount)
      }
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

  function resetTradeSelection(): void {
    setSelectedOfferCards({})
    setSelectedRequestCards({})
    setTradeStatus(null)
  }

  function handleToggleTradeCard(
    key: string,
    setSelection: Dispatch<SetStateAction<Record<string, true>>>,
  ): void {
    setSelection((previous) => {
      const next = { ...previous }
      if (next[key] === true) {
        delete next[key]
      } else {
        next[key] = true
      }

      return next
    })
  }

  async function handleSendTradeRequest(): Promise<void> {
    if (activeSelectedUser == null || activeTradePartner == null) {
      return
    }

    if (selectedOfferTradeCards.length === 0 || selectedRequestTradeCards.length === 0) {
      setTradeStatus('Pick at least one sticker to offer and one to request.')
      return
    }

    setError(null)
    setTradeStatus(null)

    try {
      const tradeRequestsRef = ref(database, 'tradeRequests')
      await set(push(tradeRequestsRef), {
        from: activeSelectedUser,
        to: activeTradePartner,
        offered: selectedOfferTradeCards.map((card) => ({
          section: card.sectionCode,
          sticker: card.stickerNumber,
          available: card.count,
        })),
        requested: selectedRequestTradeCards.map((card) => ({
          section: card.sectionCode,
          sticker: card.stickerNumber,
          available: card.count,
        })),
        status: 'pending',
        createdAt: serverTimestamp(),
      })

      setTradeStatus(`Trade request sent to ${activeTradePartner}.`)
      setSelectedOfferCards({})
      setSelectedRequestCards({})
    } catch {
      setTradeStatus('Could not send trade request right now.')
    }
  }

  if (activeSelectedUser == null) {
    return (
      <NamePicker
        availableUsers={availableUsers}
        onSelectUser={(username) => {
          setSelectedUser(username)
          setTradePartnerSelection(null)
          resetTradeSelection()
        }}
      />
    )
  }

  return (
    <main className="mx-auto min-h-[100dvh] w-full max-w-[430px] bg-[#0e0f12] pb-[calc(env(safe-area-inset-bottom)+84px)] pt-[max(env(safe-area-inset-top),16px)] text-white">
      <div className="px-4">
        <header className="pt-2">
          <h1 className="text-[30px] font-semibold leading-tight">
            {activeTab === 'album'
              ? 'World Cup Album 2026'
              : activeTab === 'duplicates'
                ? 'Duplicates'
                : 'Trades'}
          </h1>
          <div className="mt-2 flex items-center justify-between text-zinc-400">
            <button
              type="button"
              className="rounded-lg border border-zinc-700 px-2 py-1 text-xs active:scale-[0.98]"
              onClick={() => {
                setSelectedUser(null)
                setTradePartnerSelection(null)
                resetTradeSelection()
                setActiveTab('album')
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
            {activeTab === 'album' ? (
              <div className="flex items-end justify-between">
                <div className="text-4xl font-semibold leading-none">{totals.owned}</div>
                <div className="mb-1 text-sm text-zinc-400">
                  of {totals.albumTotal} <span className="ml-2 text-white">{totals.percentage}%</span>
                </div>
              </div>
            ) : activeTab === 'duplicates' ? (
              <div className="text-sm text-zinc-300">Total: {totals.duplicates}</div>
            ) : (
              <div className="text-sm text-zinc-300">
                Offer: {selectedOfferTradeCards.length} · Want: {selectedRequestTradeCards.length}
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
                placeholder={activeTab === 'trades' ? 'Search stickers...' : 'Search countries...'}
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
        {tradeStatus == null ? null : (
          <p className="mt-3 rounded-xl border border-emerald-600/40 bg-emerald-600/20 px-3 py-2 text-xs text-emerald-100">
            {tradeStatus}
          </p>
        )}

        {activeTab === 'trades' ? (
          <TradesTab
            activeTradePartner={activeTradePartner}
            tradeCandidates={tradeCandidates}
            filteredMyTradeCards={filteredMyTradeCards}
            filteredPartnerTradeCards={filteredPartnerTradeCards}
            selectedOfferCards={selectedOfferCards}
            selectedRequestCards={selectedRequestCards}
            selectedOfferCount={selectedOfferTradeCards.length}
            selectedRequestCount={selectedRequestTradeCards.length}
            onPartnerChange={(partner) => {
              setTradePartnerSelection(partner)
              resetTradeSelection()
            }}
            onToggleOfferCard={(cardKey) => {
              handleToggleTradeCard(cardKey, setSelectedOfferCards)
            }}
            onToggleRequestCard={(cardKey) => {
              handleToggleTradeCard(cardKey, setSelectedRequestCards)
            }}
            onSendTradeRequest={() => {
              void handleSendTradeRequest()
            }}
          />
        ) : (
          <AlbumSections
            activeTab={activeTab}
            filteredSections={filteredSections}
            searchTerm={searchTerm}
            expandedSections={expandedSections}
            selectedUserStickers={selectedUserStickers}
            ownedCounts={ownedCounts}
            duplicateCounts={duplicateCounts}
            showOwnedBySection={showOwnedBySection}
            selectedUserDuplicates={selectedUserDuplicates}
            friendDuplicateOwners={friendDuplicateOwners}
            onToggleSection={handleToggleSection}
            onToggleShowOwned={handleToggleShowOwned}
            onOwnerHoverStart={handleOwnerHoverStart}
            onOwnerHoverEnd={handleOwnerHoverEnd}
            onOwnerTouchStart={handleOwnerTouchStart}
            onOwnerTouchEnd={handleOwnerTouchEnd}
            onStickerPress={handleStickerPress}
            onChangeDuplicate={handleChangeDuplicate}
            getStickerNumbers={getStickerNumbers}
            formatStickerLabel={formatStickerLabel}
          />
        )}
      </div>

      {activeTab === 'album' && activeOwners != null && activeOwnersList.length > 0 ? (
        <div className="fixed bottom-[74px] left-1/2 z-20 w-[min(92%,420px)] -translate-x-1/2 rounded-xl border border-amber-400/40 bg-amber-500/15 px-3 py-2 text-xs text-amber-100">
          <div className="font-semibold">{activeOwners.label}</div>
          <div className="mt-1">{activeOwnersList.join(', ')}</div>
        </div>
      ) : null}

      <BottomTabs
        activeTab={activeTab}
        onChangeTab={(tab) => {
          setActiveTab(tab)
          setActiveOwners(null)
        }}
      />
    </main>
  )
}

export default App
