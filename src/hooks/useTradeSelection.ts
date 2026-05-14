import { useMemo, useState, type Dispatch, type SetStateAction } from 'react'

import type { TradeCard } from '../types/stickers'

export type SelectedTradeLine = {
  key: string
  sectionCode: string
  stickerNumber: number
  quantity: number
}

type UseTradeSelectionParams = {
  myTradeCards: TradeCard[]
  partnerTradeCards: TradeCard[]
}

function useTradeSelection({
  myTradeCards,
  partnerTradeCards,
}: UseTradeSelectionParams): {
  selectedOfferCards: Record<string, number>
  selectedRequestCards: Record<string, number>
  selectedOfferTradeCards: SelectedTradeLine[]
  selectedRequestTradeCards: SelectedTradeLine[]
  myTradeCardCountByKey: Record<string, number>
  partnerTradeCardCountByKey: Record<string, number>
  toggleOfferCard: (key: string) => void
  toggleRequestCard: (key: string) => void
  updateOfferQuantity: (key: string, quantity: number, maxQuantity: number) => void
  updateRequestQuantity: (key: string, quantity: number, maxQuantity: number) => void
  resetTradeSelection: () => void
  setSelectedOfferCards: Dispatch<SetStateAction<Record<string, number>>>
  setSelectedRequestCards: Dispatch<SetStateAction<Record<string, number>>>
  loadSelectionFromTrade: (offerLines: SelectedTradeLine[], requestLines: SelectedTradeLine[]) => void
} {
  const [selectedOfferCards, setSelectedOfferCards] = useState<Record<string, number>>({})
  const [selectedRequestCards, setSelectedRequestCards] = useState<Record<string, number>>({})

  const selectedOfferTradeCards = useMemo<SelectedTradeLine[]>(() => {
    return myTradeCards
      .map((card) => {
        const quantity = selectedOfferCards[card.key] ?? 0
        if (quantity <= 0) {
          return null
        }

        return {
          key: card.key,
          sectionCode: card.sectionCode,
          stickerNumber: card.stickerNumber,
          quantity: Math.min(quantity, card.count),
        }
      })
      .filter((line): line is SelectedTradeLine => line != null)
  }, [myTradeCards, selectedOfferCards])

  const selectedRequestTradeCards = useMemo<SelectedTradeLine[]>(() => {
    return partnerTradeCards
      .map((card) => {
        const quantity = selectedRequestCards[card.key] ?? 0
        if (quantity <= 0) {
          return null
        }

        return {
          key: card.key,
          sectionCode: card.sectionCode,
          stickerNumber: card.stickerNumber,
          quantity: Math.min(quantity, card.count),
        }
      })
      .filter((line): line is SelectedTradeLine => line != null)
  }, [partnerTradeCards, selectedRequestCards])

  const myTradeCardCountByKey = useMemo(() => {
    const counts: Record<string, number> = {}

    for (const card of myTradeCards) {
      counts[card.key] = card.count
    }

    return counts
  }, [myTradeCards])

  const partnerTradeCardCountByKey = useMemo(() => {
    const counts: Record<string, number> = {}

    for (const card of partnerTradeCards) {
      counts[card.key] = card.count
    }

    return counts
  }, [partnerTradeCards])

  function handleToggleTradeCard(
    key: string,
    setSelection: Dispatch<SetStateAction<Record<string, number>>>,
  ): void {
    setSelection((previous) => {
      const next = { ...previous }
      if ((next[key] ?? 0) > 0) {
        delete next[key]
      } else {
        next[key] = 1
      }

      return next
    })
  }

  function handleUpdateTradeQuantity(
    key: string,
    quantity: number,
    maxQuantity: number,
    setSelection: Dispatch<SetStateAction<Record<string, number>>>,
  ): void {
    setSelection((previous) => {
      const normalizedQuantity = Math.max(1, Math.min(maxQuantity, quantity))
      const next = { ...previous, [key]: normalizedQuantity }
      return next
    })
  }

  function resetTradeSelection(): void {
    setSelectedOfferCards({})
    setSelectedRequestCards({})
  }

  function loadSelectionFromTrade(offerLines: SelectedTradeLine[], requestLines: SelectedTradeLine[]): void {
    const nextOffer: Record<string, number> = {}
    const nextRequest: Record<string, number> = {}

    for (const line of offerLines) {
      nextOffer[line.key] = line.quantity
    }

    for (const line of requestLines) {
      nextRequest[line.key] = line.quantity
    }

    setSelectedOfferCards(nextOffer)
    setSelectedRequestCards(nextRequest)
  }

  return {
    selectedOfferCards,
    selectedRequestCards,
    selectedOfferTradeCards,
    selectedRequestTradeCards,
    myTradeCardCountByKey,
    partnerTradeCardCountByKey,
    toggleOfferCard: (key) => handleToggleTradeCard(key, setSelectedOfferCards),
    toggleRequestCard: (key) => handleToggleTradeCard(key, setSelectedRequestCards),
    updateOfferQuantity: (key, quantity, maxQuantity) =>
      handleUpdateTradeQuantity(key, quantity, maxQuantity, setSelectedOfferCards),
    updateRequestQuantity: (key, quantity, maxQuantity) =>
      handleUpdateTradeQuantity(key, quantity, maxQuantity, setSelectedRequestCards),
    resetTradeSelection,
    setSelectedOfferCards,
    setSelectedRequestCards,
    loadSelectionFromTrade,
  }
}

export default useTradeSelection
