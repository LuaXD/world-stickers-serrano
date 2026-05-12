import { useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from 'react'
import { get, onValue, push, ref, serverTimestamp, set, update } from 'firebase/database'

import { database } from '../lib/firebase'
import { parseTradeRequestsSnapshot, parseUsersSnapshot } from '../lib/stickerHelpers'
import type { TradeRequest, TradeStatus, UserRecord } from '../types/stickers'
import type { SelectedTradeLine } from './useTradeSelection'

type UseTradeRequestsParams = {
  activeSelectedUser: string | null
  activeTradePartner: string | null
  selectedOfferTradeCards: SelectedTradeLine[]
  selectedRequestTradeCards: SelectedTradeLine[]
  resetTradeSelection: () => void
  setError: Dispatch<SetStateAction<string | null>>
}

function useTradeRequests({
  activeSelectedUser,
  activeTradePartner,
  selectedOfferTradeCards,
  selectedRequestTradeCards,
  resetTradeSelection,
  setError,
}: UseTradeRequestsParams): {
  tradeRequests: TradeRequest[]
  tradeStatus: string | null
  setTradeStatus: Dispatch<SetStateAction<string | null>>
  pendingTrades: TradeRequest[]
  handleSendTradeRequest: () => Promise<void>
  handleAcceptTradeRequest: (tradeId: string) => Promise<void>
  handleDeclineTradeRequest: (tradeId: string) => Promise<void>
} {
  const [tradeRequests, setTradeRequests] = useState<TradeRequest[]>([])
  const [tradeStatus, setTradeStatus] = useState<string | null>(null)
  const observedTradeStatusRef = useRef<Record<string, TradeStatus>>({})

  useEffect(() => {
    const tradeRequestsRef = ref(database, 'tradeRequests')
    const unsubscribe = onValue(tradeRequestsRef, (snapshot) => {
      const nextTrades = parseTradeRequestsSnapshot(snapshot.val())
      setTradeRequests(nextTrades)

      if (activeSelectedUser == null) {
        observedTradeStatusRef.current = {}
        return
      }

      const previousStatuses = observedTradeStatusRef.current
      const nextStatuses: Record<string, TradeStatus> = {}
      let nextNotification: string | null = null

      for (const trade of nextTrades) {
        if (trade.from !== activeSelectedUser && trade.to !== activeSelectedUser) {
          continue
        }

        nextStatuses[trade.id] = trade.status
        const previousStatus = previousStatuses[trade.id]

        if (previousStatus === 'pending' && (trade.status === 'accepted' || trade.status === 'declined')) {
          const partner = trade.from === activeSelectedUser ? trade.to : trade.from
          nextNotification =
            trade.status === 'accepted'
              ? `Trade with ${partner} was accepted.`
              : `Trade with ${partner} was declined.`
        }
      }

      observedTradeStatusRef.current = nextStatuses

      if (nextNotification != null) {
        setTradeStatus(nextNotification)
      }
    })

    return () => {
      unsubscribe()
    }
  }, [activeSelectedUser])

  const pendingTrades = useMemo(() => {
    if (activeSelectedUser == null) {
      return []
    }

    return tradeRequests.filter((trade) => {
      if (trade.status !== 'pending') {
        return false
      }

      return trade.from === activeSelectedUser || trade.to === activeSelectedUser
    })
  }, [activeSelectedUser, tradeRequests])

  function cloneUserRecord(record: UserRecord): UserRecord {
    const stickers: UserRecord['stickers'] = {}
    const duplicates: UserRecord['duplicates'] = {}

    for (const [sectionCode, sectionStickers] of Object.entries(record.stickers)) {
      stickers[sectionCode] = { ...sectionStickers }
    }

    for (const [sectionCode, sectionDuplicates] of Object.entries(record.duplicates)) {
      duplicates[sectionCode] = { ...sectionDuplicates }
    }

    return { stickers, duplicates }
  }

  function getDuplicateAmount(record: UserRecord, sectionCode: string, stickerNumber: number): number {
    return record.duplicates[sectionCode]?.[String(stickerNumber)] ?? 0
  }

  function setDuplicateAmount(
    record: UserRecord,
    sectionCode: string,
    stickerNumber: number,
    amount: number,
  ): void {
    const stickerKey = String(stickerNumber)
    const sectionDuplicates = { ...(record.duplicates[sectionCode] ?? {}) }

    if (amount <= 0) {
      delete sectionDuplicates[stickerKey]
    } else {
      sectionDuplicates[stickerKey] = amount
    }

    if (Object.keys(sectionDuplicates).length === 0) {
      delete record.duplicates[sectionCode]
    } else {
      record.duplicates[sectionCode] = sectionDuplicates
    }
  }

  function markStickerOwned(record: UserRecord, sectionCode: string, stickerNumber: number): void {
    const stickerKey = String(stickerNumber)
    const sectionStickers = { ...(record.stickers[sectionCode] ?? {}) }
    sectionStickers[stickerKey] = true
    record.stickers[sectionCode] = sectionStickers
  }

  function canSendLines(record: UserRecord, lines: SelectedTradeLine[]): boolean {
    for (const line of lines) {
      const available = getDuplicateAmount(record, line.sectionCode, line.stickerNumber)
      if (available < line.quantity) {
        return false
      }
    }

    return true
  }

  function applyOutgoingLines(record: UserRecord, lines: SelectedTradeLine[]): void {
    for (const line of lines) {
      const available = getDuplicateAmount(record, line.sectionCode, line.stickerNumber)
      const nextAmount = available - line.quantity
      setDuplicateAmount(record, line.sectionCode, line.stickerNumber, nextAmount)
    }
  }

  function applyIncomingLines(record: UserRecord, lines: SelectedTradeLine[]): void {
    for (const line of lines) {
      const stickerKey = String(line.stickerNumber)
      const alreadyOwned = record.stickers[line.sectionCode]?.[stickerKey] === true

      if (alreadyOwned) {
        const duplicateAmount = getDuplicateAmount(record, line.sectionCode, line.stickerNumber)
        setDuplicateAmount(record, line.sectionCode, line.stickerNumber, duplicateAmount + line.quantity)
        continue
      }

      markStickerOwned(record, line.sectionCode, line.stickerNumber)

      if (line.quantity > 1) {
        const duplicateAmount = getDuplicateAmount(record, line.sectionCode, line.stickerNumber)
        setDuplicateAmount(record, line.sectionCode, line.stickerNumber, duplicateAmount + line.quantity - 1)
      }
    }
  }

  async function handleSendTradeRequest(): Promise<void> {
    if (activeSelectedUser == null || activeTradePartner == null) {
      return
    }

    if (selectedOfferTradeCards.length === 0 && selectedRequestTradeCards.length === 0) {
      setTradeStatus('Pick at least one sticker to offer or request.')
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
          quantity: card.quantity,
        })),
        requested: selectedRequestTradeCards.map((card) => ({
          section: card.sectionCode,
          sticker: card.stickerNumber,
          quantity: card.quantity,
        })),
        status: 'pending',
        createdAt: serverTimestamp(),
      })

      setTradeStatus(`Trade request sent to ${activeTradePartner}.`)
      resetTradeSelection()
    } catch {
      setTradeStatus('Could not send trade request right now.')
    }
  }

  async function handleAcceptTradeRequest(tradeId: string): Promise<void> {
    if (activeSelectedUser == null) {
      return
    }

    const selectedTrade = tradeRequests.find((trade) => trade.id === tradeId)
    if (selectedTrade == null || selectedTrade.status !== 'pending') {
      return
    }

    if (selectedTrade.to !== activeSelectedUser) {
      setTradeStatus('Only the receiver can confirm this trade.')
      return
    }

    const offeredLines: SelectedTradeLine[] = selectedTrade.offered.map((line) => ({
      key: `${line.section}:${line.sticker}`,
      sectionCode: line.section,
      stickerNumber: line.sticker,
      quantity: line.quantity,
    }))
    const requestedLines: SelectedTradeLine[] = selectedTrade.requested.map((line) => ({
      key: `${line.section}:${line.sticker}`,
      sectionCode: line.section,
      stickerNumber: line.sticker,
      quantity: line.quantity,
    }))

    try {
      const usersSnapshot = await get(ref(database, 'users'))
      const latestUsers = parseUsersSnapshot(usersSnapshot.val())
      const fromRecord = cloneUserRecord(latestUsers[selectedTrade.from] ?? { stickers: {}, duplicates: {} })
      const toRecord = cloneUserRecord(latestUsers[selectedTrade.to] ?? { stickers: {}, duplicates: {} })

      if (!canSendLines(fromRecord, offeredLines) || !canSendLines(toRecord, requestedLines)) {
        setTradeStatus('Trade quantities changed. Please review and resend.')
        return
      }

      applyOutgoingLines(fromRecord, offeredLines)
      applyIncomingLines(toRecord, offeredLines)
      applyOutgoingLines(toRecord, requestedLines)
      applyIncomingLines(fromRecord, requestedLines)

      await set(ref(database, `users/${selectedTrade.from}`), fromRecord)
      await set(ref(database, `users/${selectedTrade.to}`), toRecord)
      await update(ref(database, `tradeRequests/${tradeId}`), {
        status: 'accepted',
        resolvedAt: serverTimestamp(),
        resolvedBy: activeSelectedUser,
      })
      setTradeStatus('Trade accepted and inventories updated.')
    } catch {
      setTradeStatus('Could not confirm trade right now.')
    }
  }

  async function handleDeclineTradeRequest(tradeId: string): Promise<void> {
    if (activeSelectedUser == null) {
      return
    }

    const selectedTrade = tradeRequests.find((trade) => trade.id === tradeId)
    if (selectedTrade == null || selectedTrade.status !== 'pending') {
      return
    }

    if (selectedTrade.to !== activeSelectedUser) {
      setTradeStatus('Only the receiver can decline this trade.')
      return
    }

    try {
      await update(ref(database, `tradeRequests/${tradeId}`), {
        status: 'declined',
        resolvedAt: serverTimestamp(),
        resolvedBy: activeSelectedUser,
      })
      setTradeStatus('Trade declined.')
    } catch {
      setTradeStatus('Could not decline trade right now.')
    }
  }

  return {
    tradeRequests,
    tradeStatus,
    setTradeStatus,
    pendingTrades,
    handleSendTradeRequest,
    handleAcceptTradeRequest,
    handleDeclineTradeRequest,
  }
}

export default useTradeRequests
