import type {
  SectionDefinition,
  TradeCard,
  TradeLine,
  TradeRequest,
  TradeStatus,
  UserDuplicates,
  UserRecord,
  UserStickers,
  UsersState,
} from '../types/stickers'

export const USER_STORAGE_KEY = 'mundial:selected-user'

export const USERNAME_SEED: Record<string, true> = {
  Addis: true,
  Carlos: true,
  Mija: true,
  'Mija Pro': true,
  Gamax: true,
  Botas: true,
  Kevin: true,
}

export const ALBUM_SECTIONS: SectionDefinition[] = [
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

export function normalizeCode(value: string): string {
  return value.trim().toUpperCase()
}

export function isValidStickerIndex(sectionCode: string, stickerIndex: number): boolean {
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

export function parseUserStickers(value: unknown): UserStickers {
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

export function parseUserDuplicates(value: unknown): UserDuplicates {
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
            : typeof rawCountValue === 'string'
              ? Number.parseInt(rawCountValue, 10)
              : Number.NaN

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
      typeof rawValue === 'number'
        ? rawValue
        : typeof rawValue === 'string'
          ? Number.parseInt(rawValue, 10)
          : Number.NaN

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

export function parseUserRecord(rawUserData: unknown): UserRecord {
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

export function parseUsersSnapshot(value: unknown): UsersState {
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

export function parseUsernamesSnapshot(value: unknown): string[] {
  if (Array.isArray(value)) {
    const names: string[] = []

    for (const rawName of value) {
      if (typeof rawName !== 'string') {
        continue
      }

      const normalizedName = rawName.trim()
      if (normalizedName.length > 0) {
        names.push(normalizedName)
      }
    }

    return names
  }

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

function parseTradeLines(value: unknown): TradeLine[] {
  if (!Array.isArray(value)) {
    return []
  }

  const lines: TradeLine[] = []

  for (const rawLine of value) {
    if (rawLine == null || typeof rawLine !== 'object') {
      continue
    }

    const line = rawLine as {
      section?: unknown
      sticker?: unknown
      quantity?: unknown
      available?: unknown
    }

    if (typeof line.section !== 'string') {
      continue
    }

    const sectionCode = normalizeCode(line.section)
    const stickerNumber =
      typeof line.sticker === 'number'
        ? Math.trunc(line.sticker)
        : typeof line.sticker === 'string'
          ? Number.parseInt(line.sticker, 10)
          : Number.NaN
    const parsedQuantity =
      typeof line.quantity === 'number'
        ? Math.trunc(line.quantity)
        : typeof line.quantity === 'string'
          ? Number.parseInt(line.quantity, 10)
          : Number.NaN
    const parsedAvailable =
      typeof line.available === 'number'
        ? Math.trunc(line.available)
        : typeof line.available === 'string'
          ? Number.parseInt(line.available, 10)
          : Number.NaN
    const quantity =
      Number.isInteger(parsedQuantity) && parsedQuantity > 0
        ? parsedQuantity
        : Number.isInteger(parsedAvailable) && parsedAvailable > 0
          ? 1
          : 0

    if (!isValidStickerIndex(sectionCode, stickerNumber)) {
      continue
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      continue
    }

    lines.push({
      section: sectionCode,
      sticker: stickerNumber,
      quantity,
    })
  }

  return lines
}

export function parseTradeRequestsSnapshot(value: unknown): TradeRequest[] {
  if (value == null || typeof value !== 'object') {
    return []
  }

  const requests: TradeRequest[] = []

  for (const [id, rawTrade] of Object.entries(value as Record<string, unknown>)) {
    if (rawTrade == null || typeof rawTrade !== 'object') {
      continue
    }

    const trade = rawTrade as {
      from?: unknown
      to?: unknown
      offered?: unknown
      requested?: unknown
      status?: unknown
      createdAt?: unknown
      replaces?: unknown
      supersededBy?: unknown
    }

    if (typeof trade.from !== 'string' || typeof trade.to !== 'string') {
      continue
    }

    const status: TradeStatus =
      trade.status === 'accepted' || trade.status === 'declined' || trade.status === 'superseded'
        ? trade.status
        : 'pending'
    const offered = parseTradeLines(trade.offered)
    const requested = parseTradeLines(trade.requested)

    if (offered.length === 0 && requested.length === 0) {
      continue
    }

    requests.push({
      id,
      from: trade.from,
      to: trade.to,
      offered,
      requested,
      status,
      createdAt: typeof trade.createdAt === 'number' ? trade.createdAt : null,
      replaces: typeof trade.replaces === 'string' && trade.replaces.length > 0 ? trade.replaces : null,
      supersededBy:
        typeof trade.supersededBy === 'string' && trade.supersededBy.length > 0 ? trade.supersededBy : null,
    })
  }

  return requests.sort((left, right) => {
    if (left.createdAt == null && right.createdAt == null) {
      return left.id.localeCompare(right.id)
    }
    if (left.createdAt == null) {
      return 1
    }
    if (right.createdAt == null) {
      return -1
    }
    return right.createdAt - left.createdAt
  })
}

export function getStickerNumbers(sectionCode: string, stickerCount: number): number[] {
  if (sectionCode === 'FWC') {
    return Array.from({ length: stickerCount }, (_, index) => index)
  }

  return Array.from({ length: stickerCount }, (_, index) => index + 1)
}

export function formatStickerLabel(sectionCode: string, stickerNumber: number): string {
  if (sectionCode === 'FWC') {
    return String(stickerNumber).padStart(2, '0')
  }

  return String(stickerNumber)
}

export function buildTradeCards(
  duplicates: UserDuplicates,
  sectionNameByCode: Record<string, string>,
): TradeCard[] {
  const cards: TradeCard[] = []

  for (const [sectionCode, sectionDuplicates] of Object.entries(duplicates)) {
    const sectionName = sectionNameByCode[sectionCode] ?? sectionCode

    for (const [stickerKey, count] of Object.entries(sectionDuplicates)) {
      if (!Number.isInteger(count) || count <= 0) {
        continue
      }

      const stickerNumber = Number.parseInt(stickerKey, 10)
      if (!Number.isInteger(stickerNumber) || !isValidStickerIndex(sectionCode, stickerNumber)) {
        continue
      }

      cards.push({
        key: `${sectionCode}:${stickerNumber}`,
        sectionCode,
        sectionName,
        stickerNumber,
        count,
        label: `${sectionCode} ${formatStickerLabel(sectionCode, stickerNumber)}`,
      })
    }
  }

  return cards.sort((left, right) => {
    if (left.count !== right.count) {
      return right.count - left.count
    }

    if (left.sectionCode !== right.sectionCode) {
      return left.sectionCode.localeCompare(right.sectionCode)
    }

    return left.stickerNumber - right.stickerNumber
  })
}
