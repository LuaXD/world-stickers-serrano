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
  duplicateCounts: Record<string, number>
  showOwnedBySection: Record<string, boolean>
  selectedUserDuplicates: UserDuplicates
  friendDuplicateOwners: Record<string, string[]>
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
  duplicateCounts,
  showOwnedBySection,
  selectedUserDuplicates,
  friendDuplicateOwners,
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
        const duplicateCount = duplicateCounts[section.code] ?? 0
        const stickerNumbers = getStickerNumbers(section.code, section.stickerCount)
        const showOwned = showOwnedBySection[section.code] === true
        const visibleAlbumNumbers = showOwned
          ? stickerNumbers
          : stickerNumbers.filter((number) => ownedSet[String(number)] !== true)

        return (
          <article key={section.code} className="overflow-hidden rounded-2xl bg-zinc-900/85">
            <button
              type="button"
              className="flex h-14 w-full items-center justify-between border border-zinc-800 px-3"
              onClick={() => onToggleSection(section.code)}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{section.flag}</span>
                <span className="text-xl font-semibold tracking-wide">{section.code}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="font-semibold">
                  {activeTab === 'duplicates' ? duplicateCount : `${ownedCount}/${section.stickerCount}`}
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
                ) : (
                  <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
                    {stickerNumbers.map((stickerNumber) => {
                      const stickerKey = String(stickerNumber)
                      const currentDuplicate = selectedUserDuplicates[section.code]?.[stickerKey] ?? 0

                      return (
                        <div
                          key={`${section.code}-duplicate-${stickerNumber}`}
                          className="rounded-2xl border border-zinc-500 bg-zinc-900 p-2"
                        >
                          <div className="mb-3 text-center text-[24px] font-semibold leading-none text-zinc-100">
                            {formatStickerLabel(section.code, stickerNumber)}
                          </div>
                          <div className="mb-2 text-center text-xs text-zinc-300">
                            {currentDuplicate}
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              disabled={currentDuplicate <= 0}
                              className={`h-8 rounded-full text-lg ${
                                currentDuplicate <= 0
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
