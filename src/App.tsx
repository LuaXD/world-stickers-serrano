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
