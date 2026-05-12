import { useMemo } from 'react'

import { ALBUM_SECTIONS, buildTradeCards, normalizeCode } from '../lib/stickerHelpers'
import type { SectionDefinition, TradeCard, UserRecord, UsersState } from '../types/stickers'

type UseAlbumComputedParams = {
  users: UsersState
  activeSelectedUser: string | null
  availableUsers: string[]
  tradePartnerSelection: string | null
  searchTerm: string
}

function useAlbumComputed({
  users,
  activeSelectedUser,
  availableUsers,
  tradePartnerSelection,
  searchTerm,
}: UseAlbumComputedParams): {
  selectedUserData: UserRecord
  selectedUserStickers: UserRecord['stickers']
  selectedUserDuplicates: UserRecord['duplicates']
  tradeCandidates: string[]
  activeTradePartner: string | null
  activeTradePartnerData: UserRecord
  activeTradePartnerStickers: UserRecord['stickers']
  activeTradePartnerDuplicates: UserRecord['duplicates']
  extraSections: SectionDefinition[]
  allSections: SectionDefinition[]
  sectionNameByCode: Record<string, string>
  filteredSections: SectionDefinition[]
  myTradeCards: TradeCard[]
  partnerTradeCards: TradeCard[]
  filteredMyTradeCards: TradeCard[]
  filteredPartnerTradeCards: TradeCard[]
  offerNeededKeys: Record<string, true>
  requestNeededKeys: Record<string, true>
  ownedCounts: Record<string, number>
  duplicateCounts: Record<string, number>
  friendDuplicateOwners: Record<string, string[]>
  totals: { owned: number; albumTotal: number; percentage: number; duplicates: number }
} {
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

  const activeTradePartnerStickers = activeTradePartnerData.stickers
  const activeTradePartnerDuplicates = activeTradePartnerData.duplicates

  const extraSections = useMemo<SectionDefinition[]>(() => {
    const knownCodes = new Set(ALBUM_SECTIONS.map((section) => section.code))
    const unknownCodes = Object.keys(selectedUserStickers).filter((code) => !knownCodes.has(code))

    return unknownCodes.map((code) => {
      const indexes = Object.keys(selectedUserStickers[code] ?? {}).map((value) => Number.parseInt(value, 10))
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

  const offerNeededKeys = useMemo(() => {
    const needed: Record<string, true> = {}

    if (activeTradePartner == null) {
      return needed
    }

    for (const card of myTradeCards) {
      const partnerHas = activeTradePartnerStickers[card.sectionCode]?.[String(card.stickerNumber)] === true
      if (!partnerHas) {
        needed[card.key] = true
      }
    }

    return needed
  }, [activeTradePartner, activeTradePartnerStickers, myTradeCards])

  const requestNeededKeys = useMemo(() => {
    const needed: Record<string, true> = {}

    for (const card of partnerTradeCards) {
      const iHave = selectedUserStickers[card.sectionCode]?.[String(card.stickerNumber)] === true
      if (!iHave) {
        needed[card.key] = true
      }
    }

    return needed
  }, [partnerTradeCards, selectedUserStickers])

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
        const friendSectionStickers = userData.stickers[normalizeCode(sectionCode)] ?? {}

        for (const [stickerKey, count] of Object.entries(sectionDuplicates)) {
          if (count <= 0) {
            continue
          }

          if (friendSectionStickers[stickerKey] !== true) {
            continue
          }

          const mapKey = `${normalizeCode(sectionCode)}:${stickerKey}`
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

  return {
    selectedUserData,
    selectedUserStickers,
    selectedUserDuplicates,
    tradeCandidates,
    activeTradePartner,
    activeTradePartnerData,
    activeTradePartnerStickers,
    activeTradePartnerDuplicates,
    extraSections,
    allSections,
    sectionNameByCode,
    filteredSections,
    myTradeCards,
    partnerTradeCards,
    filteredMyTradeCards,
    filteredPartnerTradeCards,
    offerNeededKeys,
    requestNeededKeys,
    ownedCounts,
    duplicateCounts,
    friendDuplicateOwners,
    totals,
  }
}

export default useAlbumComputed
