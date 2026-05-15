import type {
  ActiveOwners,
  AppTab,
  SectionDefinition,
  UserDuplicates,
  UserStickers,
} from '../types/stickers'

type AlbumSectionsProps = {
  activeTab: AppTab
  filteredSections: SectionDefinition[]
  searchTerm: string
  expandedSections: Record<string, boolean>
  selectedUserStickers: UserStickers
  ownedCounts: Record<string, number>
  futureOwnedCounts: Record<string, number>
  showOwnedBySection: Record<string, boolean>
  selectedUserDuplicates: UserDuplicates
  adjustedUserDuplicates: UserDuplicates
  incomingPendingMap: Record<string, Record<string, number>>
  friendDuplicateOwners: Record<string, string[]>
  recentlyMarkedKeys: Record<string, true>
  onToggleSection: (code: string) => void
  onToggleShowOwned: (code: string) => void
  onOwnerHoverStart: (meta: ActiveOwners) => void
  onOwnerHoverEnd: (metaKey: string) => void
  onOwnerTouchStart: (meta: ActiveOwners | null) => void
  onOwnerTouchEnd: (metaKey: string) => void
  onStickerPress: (sectionCode: string, stickerNumber: number) => void
  onChangeDuplicate: (sectionCode: string, stickerNumber: number, delta: number) => void
  getStickerNumbers: (sectionCode: string, stickerCount: number) => number[]
  formatStickerLabel: (sectionCode: string, stickerNumber: number) => string
}

export default function AlbumSections({
  activeTab,
  filteredSections,
  searchTerm,
  expandedSections,
  selectedUserStickers,
  ownedCounts,
  futureOwnedCounts,
  showOwnedBySection,
  selectedUserDuplicates,
  adjustedUserDuplicates,
  incomingPendingMap,
  friendDuplicateOwners,
  recentlyMarkedKeys,
  onToggleSection,
  onToggleShowOwned,
  onOwnerHoverStart,
  onOwnerHoverEnd,
  onOwnerTouchStart,
  onOwnerTouchEnd,
  onStickerPress,
  onChangeDuplicate,
  getStickerNumbers,
  formatStickerLabel,
}: AlbumSectionsProps) {
  return (
    <section className="mt-4 space-y-3">
      {filteredSections.map((section) => {
        const isSearching = searchTerm.trim().length > 0
        const isExpanded = isSearching || expandedSections[section.code] === true
        const ownedSet = selectedUserStickers[section.code] ?? {}
        const ownedCount = ownedCounts[section.code] ?? 0
        const futureOwned = futureOwnedCounts[section.code] ?? ownedCount
        const availableDuplicateCount = Object.values(adjustedUserDuplicates[section.code] ?? {}).reduce(
          (sum, qty) => sum + qty,
          0,
        )
        const stickerNumbers = getStickerNumbers(section.code, section.stickerCount)
        const showOwned = showOwnedBySection[section.code] === true
        const visibleAlbumNumbers = showOwned
          ? stickerNumbers
          : stickerNumbers.filter((number) => {
              const stickerKey = String(number)
              const mapKey = `${section.code}:${stickerKey}`
              return ownedSet[stickerKey] !== true || recentlyMarkedKeys[mapKey] === true
            })

        const duplicateEntries =
          activeTab === 'album'
            ? []
            : stickerNumbers
                .map((stickerNumber) => {
                  const stickerKey = String(stickerNumber)
                  const currentDuplicate = selectedUserDuplicates[section.code]?.[stickerKey] ?? 0
                  const adjustedDuplicate = adjustedUserDuplicates[section.code]?.[stickerKey] ?? 0
                  const locked = Math.max(0, currentDuplicate - adjustedDuplicate)
                  const available = adjustedDuplicate
                  const isOwned = selectedUserStickers[section.code]?.[stickerKey] === true
                  const shouldDisplay = isOwned || currentDuplicate > 0

                  if (!shouldDisplay) {
                    return null
                  }

                  return {
                    stickerNumber,
                    stickerKey,
                    currentDuplicate,
                    available,
                    isOwned,
                    isOrphan: !isOwned && currentDuplicate > 0,
                    locked,
                  }
                })
                .filter((entry): entry is NonNullable<typeof entry> => entry != null)

        const hasUnownedDuplicates =
          activeTab === 'album'
            ? false
            : duplicateEntries.some((entry) => entry.isOrphan === true)

        return (
          <article key={section.code} className="overflow-hidden rounded-2xl bg-zinc-900/85">
            <button
              type="button"
              className="flex h-14 w-full items-center justify-between border border-zinc-800 px-3"
              onClick={() => onToggleSection(section.code)}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{section.flag}</span>
                <span
                  className={`text-xl font-semibold tracking-wide ${
                    hasUnownedDuplicates ? 'text-red-400' : ''
                  }`}
                >
                  {section.code}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="font-semibold">
                  {activeTab === 'duplicates'
                    ? availableDuplicateCount
                    : `${ownedCount}/${section.stickerCount}${
                        futureOwned > ownedCount ? ` (+${futureOwned - ownedCount})` : ''
                      }`}
                </span>
                <span className="text-zinc-400">{isExpanded ? '⌃' : '⌄'}</span>
              </div>
            </button>

            {isExpanded ? (
              <div className="border-x border-b border-zinc-800 px-3 pb-3 pt-3">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div className="text-xs text-zinc-400">{section.name}</div>
                  {activeTab === 'album' ? (
                    <button
                      type="button"
                      className="rounded-full border border-zinc-700 px-3 py-1 text-[11px] text-zinc-200"
                      onClick={() => onToggleShowOwned(section.code)}
                    >
                      {showOwned ? 'Hide marked' : 'Show marked'}
                    </button>
                  ) : null}
                </div>

                {activeTab === 'album' ? (
                  visibleAlbumNumbers.length === 0 ? (
                    <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-4 text-center text-xs text-zinc-400">
                      No missing stickers in this section.
                    </div>
                  ) : (
                    <div className="grid grid-cols-6 gap-2 sm:grid-cols-7">
                      {visibleAlbumNumbers.map((stickerNumber) => {
                        const stickerKey = String(stickerNumber)
                        const isOwned = ownedSet[stickerKey] === true
                        const ownerMapKey = `${section.code}:${stickerKey}`
                        const ownersList = friendDuplicateOwners[ownerMapKey] ?? []
                        const hasOwners = ownersList.length > 0
                        const incomingQty = incomingPendingMap[section.code]?.[stickerKey] ?? 0
                        const isIncoming = !isOwned && incomingQty > 0
                        const ownersMeta: ActiveOwners | null = hasOwners
                          ? {
                              key: ownerMapKey,
                              label: `${section.code} ${formatStickerLabel(section.code, stickerNumber)}`,
                            }
                          : null

                        return (
                          <button
                            key={`${section.code}-${stickerNumber}`}
                            type="button"
                            className={`h-11 rounded-xl border text-[20px] font-semibold leading-none active:scale-[0.97] ${
                              isOwned
                                ? 'border-white bg-white text-zinc-900'
                                : isIncoming
                                  ? 'border-violet-400/80 bg-violet-500/20 text-violet-200'
                                  : hasOwners
                                    ? 'border-amber-400/80 bg-amber-500/10 text-amber-200'
                                    : 'border-zinc-500 bg-transparent text-zinc-100'
                            }`}
                            onMouseEnter={() => {
                              if (ownersMeta != null) {
                                onOwnerHoverStart(ownersMeta)
                              }
                            }}
                            onMouseLeave={() => onOwnerHoverEnd(ownerMapKey)}
                            onTouchStart={() => onOwnerTouchStart(ownersMeta)}
                            onTouchEnd={() => onOwnerTouchEnd(ownerMapKey)}
                            onTouchCancel={() => onOwnerTouchEnd(ownerMapKey)}
                            onClick={() => onStickerPress(section.code, stickerNumber)}
                          >
                            {formatStickerLabel(section.code, stickerNumber)}
                          </button>
                        )
                      })}
                    </div>
                  )
                ) : duplicateEntries.length === 0 ? (
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-4 text-center text-xs text-zinc-400">
                    No duplicates in this section.
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
                    {duplicateEntries.map((entry) => {
                      const { stickerNumber, available, isOrphan, locked } = entry
                      const incomingQty = incomingPendingMap[section.code]?.[String(stickerNumber)] ?? 0

                      return (
                        <div
                          key={`${section.code}-duplicate-${stickerNumber}`}
                          className={`rounded-2xl border p-2 ${
                            isOrphan ? 'border-rose-500/70 bg-rose-500/10' : 'border-zinc-500 bg-zinc-900'
                          }`}
                        >
                          <div
                            className={`mb-3 text-center text-[24px] font-semibold leading-none ${
                              isOrphan ? 'text-rose-200' : 'text-zinc-100'
                            }`}
                          >
                            {formatStickerLabel(section.code, stickerNumber)}
                          </div>
                          <div
                            className={`mb-2 text-center text-xs ${
                              isOrphan ? 'text-rose-200' : 'text-zinc-300'
                            }`}
                          >
                            {available}
                            {locked > 0 ? <span className="ml-1 text-[10px] text-purple-200">locked {locked}</span> : null}
                            {incomingQty > 0 ? (
                              <span className="ml-1 text-[10px] text-violet-200">+{incomingQty} incoming</span>
                            ) : null}
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              disabled={available <= 0}
                              className={`h-8 rounded-full text-lg ${
                                available <= 0
                                  ? 'bg-zinc-800 text-zinc-500'
                                  : 'bg-zinc-700 text-zinc-100 active:scale-[0.97]'
                              }`}
                              onClick={() => {
                                void onChangeDuplicate(section.code, stickerNumber, -1)
                              }}
                            >
                              −
                            </button>
                            <button
                              type="button"
                              className="h-8 rounded-full bg-zinc-600 text-lg text-zinc-100 active:scale-[0.97]"
                              onClick={() => {
                                void onChangeDuplicate(section.code, stickerNumber, 1)
                              }}
                            >
                              +
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            ) : null}
          </article>
        )
      })}
    </section>
  )
}
