export type SectionDefinition = {
  code: string
  name: string
  flag: string
  stickerCount: number
}

export type UserStickers = Record<string, Record<string, true>>
export type UserDuplicates = Record<string, Record<string, number>>
export type UserRecord = {
  stickers: UserStickers
  duplicates: UserDuplicates
}
export type UsersState = Record<string, UserRecord>

export type AppTab = 'album' | 'duplicates' | 'trades'

export type ActiveOwners = {
  key: string
  label: string
}

export type TradeCard = {
  key: string
  sectionCode: string
  sectionName: string
  stickerNumber: number
  count: number
  label: string
}

export type TradeLine = {
  section: string
  sticker: number
  quantity: number
}

export type TradeStatus = 'pending' | 'accepted' | 'declined' | 'superseded'

export type TradeRequest = {
  id: string
  from: string
  to: string
  offered: TradeLine[]
  requested: TradeLine[]
  status: TradeStatus
  createdAt: number | null
  replaces?: string | null
  supersededBy?: string | null
}
