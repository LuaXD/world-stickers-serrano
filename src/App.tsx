import { useEffect, useMemo, useRef, useState } from 'react'
import { get, ref, remove, set, type DatabaseReference } from 'firebase/database'

import AlbumSections from './components/AlbumSections'
import BottomTabs from './components/BottomTabs'
import NamePicker from './components/NamePicker'
import PendingTradesDropdown from './components/PendingTradesDropdown'
import TradesTab from './components/TradesTab'
import { database } from './lib/firebase'
import { formatStickerLabel, getStickerNumbers, normalizeCode, parseUserRecord } from './lib/stickerHelpers'
import useAlbumComputed from './hooks/useAlbumComputed'
import useTradeRequests from './hooks/useTradeRequests'
import useTradeSelection from './hooks/useTradeSelection'
import useUsersData from './hooks/useUsersData'
import type { ActiveOwners, AppTab } from './types/stickers'

function getStickerRef(username: string, sectionCode: string, stickerNumber: number): DatabaseReference {
  return ref(database, `users/${username}/stickers/${sectionCode}/${stickerNumber}`)
}

function getDuplicateRef(username: string, sectionCode: string, stickerNumber: number): DatabaseReference {
  return ref(database, `users/${username}/duplicates/${sectionCode}/${stickerNumber}`)
}

function App() {
  const {
    users,
    availableUsers,
    setSelectedUser,
    activeSelectedUser,
    isConnected,
    error,
    setError,
    setUserRecord,
  } = useUsersData()
  const [activeTab, setActiveTab] = useState<AppTab>('album')
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    FWC: true,
    CC: false,
    MEX: false,
  })
  const [showOwnedBySection, setShowOwnedBySection] = useState<Record<string, boolean>>({})
  const [activeOwners, setActiveOwners] = useState<ActiveOwners | null>(null)
  const [tradePartnerSelection, setTradePartnerSelection] = useState<string | null>(null)
  const [recentlyMarkedKeys, setRecentlyMarkedKeys] = useState<Record<string, true>>({})

  const longPressTimerRef = useRef<number | null>(null)
  const skipNextToggleKeyRef = useRef<string | null>(null)

  useEffect(() => {
    return () => {
      if (longPressTimerRef.current != null) {
        globalThis.clearTimeout(longPressTimerRef.current)
      }
    }
  }, [])

  const {
    selectedUserStickers,
    selectedUserDuplicates,
    tradeCandidates,
    activeTradePartner,
    filteredSections,
    myTradeCards,
    partnerTradeCards,
    filteredMyTradeCards,
    filteredPartnerTradeCards,
    ownedCounts,
    duplicateCounts,
    friendDuplicateOwners,
    totals,
  } = useAlbumComputed({
    users,
    activeSelectedUser,
    availableUsers,
    tradePartnerSelection,
    searchTerm,
  })

  const {
    selectedOfferCards,
    selectedRequestCards,
    selectedOfferTradeCards,
    selectedRequestTradeCards,
    myTradeCardCountByKey,
    partnerTradeCardCountByKey,
    toggleOfferCard,
    toggleRequestCard,
    updateOfferQuantity,
    updateRequestQuantity,
    resetTradeSelection,
  } = useTradeSelection({
    myTradeCards,
    partnerTradeCards,
  })

  const {
    tradeStatus,
    setTradeStatus,
    pendingTrades,
    handleSendTradeRequest,
    handleAcceptTradeRequest,
    handleDeclineTradeRequest,
  } = useTradeRequests({
    activeSelectedUser,
    activeTradePartner,
    selectedOfferTradeCards,
    selectedRequestTradeCards,
    resetTradeSelection,
    setError,
  })

  const activeOwnersList = useMemo(() => {
    if (activeOwners == null) {
      return []
    }

    return friendDuplicateOwners[activeOwners.key] ?? []
  }, [activeOwners, friendDuplicateOwners])

  function clearRecentlyMarked(stickerMapKey: string): void {
    setRecentlyMarkedKeys((previous) => {
      if (previous[stickerMapKey] == null) {
        return previous
      }

      const next = { ...previous }
      delete next[stickerMapKey]
      return next
    })
  }

  function markRecentlyForUndo(stickerMapKey: string): void {
    setRecentlyMarkedKeys((previous) => ({
      ...previous,
      [stickerMapKey]: true,
    }))
  }

  function clearRecentlyMarkedForSection(sectionCode: string): void {
    const keyPrefix = `${sectionCode}:`

    setRecentlyMarkedKeys((previous) => {
      let hasChanged = false
      const next: Record<string, true> = {}

      for (const [key, value] of Object.entries(previous)) {
        if (key.startsWith(keyPrefix)) {
          hasChanged = true
          continue
        }
        next[key] = value
      }

      if (!hasChanged) {
        return previous
      }

      return next
    })
  }

  async function handleToggleSticker(sectionCode: string, stickerNumber: number): Promise<void> {
    if (activeSelectedUser == null) {
      return
    }

    setError(null)
    const normalizedCode = normalizeCode(sectionCode)
    const stickerKey = String(stickerNumber)
    const stickerMapKey = `${normalizedCode}:${stickerKey}`
    const currentUserRecord = users[activeSelectedUser] ?? { stickers: {}, duplicates: {} }
    const currentSectionStickers = currentUserRecord.stickers[normalizedCode] ?? {}
    const isOwned = currentSectionStickers[stickerKey] === true

    setUserRecord(activeSelectedUser, (current) => {
      const nextStickers = { ...current.stickers }
      const nextSectionStickers = { ...(current.stickers[normalizedCode] ?? {}) }

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

    if (isOwned) {
      clearRecentlyMarked(stickerMapKey)
    } else {
      markRecentlyForUndo(stickerMapKey)
    }

    try {
      if (isOwned) {
        await remove(getStickerRef(activeSelectedUser, normalizedCode, stickerNumber))
      } else {
        await set(getStickerRef(activeSelectedUser, normalizedCode, stickerNumber), true)
      }
    } catch {
      clearRecentlyMarked(stickerMapKey)
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
    if (expandedSections[code] === true) {
      clearRecentlyMarkedForSection(code)
    }

    setExpandedSections((previous) => {
      const currentValue = previous[code]
      return {
        ...previous,
        [code]: currentValue == null ? true : !currentValue,
      }
    })
  }

  function handleToggleShowOwned(code: string): void {
    clearRecentlyMarkedForSection(code)

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
      globalThis.clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }

    longPressTimerRef.current = globalThis.setTimeout(() => {
      setActiveOwners(meta)
      skipNextToggleKeyRef.current = meta.key
      longPressTimerRef.current = null
    }, 420)
  }

  function handleOwnerTouchEnd(metaKey: string): void {
    if (longPressTimerRef.current != null) {
      globalThis.clearTimeout(longPressTimerRef.current)
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

  function formatPendingTradeLine(sectionCode: string, stickerNumber: number, quantity: number): string {
    return `${sectionCode} ${formatStickerLabel(sectionCode, stickerNumber)} x${quantity}`
  }

  if (activeSelectedUser == null) {
    return (
      <NamePicker
        availableUsers={availableUsers}
        onSelectUser={(username) => {
          setSelectedUser(username)
          setTradePartnerSelection(null)
          resetTradeSelection()
          setTradeStatus(null)
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
                setTradeStatus(null)
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
        {pendingTrades.length > 0 ? (
          <PendingTradesDropdown
            activeUsername={activeSelectedUser}
            trades={pendingTrades}
            formatTradeLine={formatPendingTradeLine}
            onAccept={(tradeId) => {
              void handleAcceptTradeRequest(tradeId)
            }}
            onDecline={(tradeId) => {
              void handleDeclineTradeRequest(tradeId)
            }}
          />
        ) : null}

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
              setTradeStatus(null)
            }}
            onToggleOfferCard={(cardKey) => {
              toggleOfferCard(cardKey)
            }}
            onToggleRequestCard={(cardKey) => {
              toggleRequestCard(cardKey)
            }}
            onUpdateOfferQuantity={(cardKey, quantity) => {
              const maxQuantity = myTradeCardCountByKey[cardKey] ?? 1
              updateOfferQuantity(cardKey, quantity, maxQuantity)
            }}
            onUpdateRequestQuantity={(cardKey, quantity) => {
              const maxQuantity = partnerTradeCardCountByKey[cardKey] ?? 1
              updateRequestQuantity(cardKey, quantity, maxQuantity)
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
            recentlyMarkedKeys={recentlyMarkedKeys}
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
