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
