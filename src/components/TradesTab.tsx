import type { TradeCard } from '../types/stickers'

type TradesTabProps = {
  activeTradePartner: string | null
  tradeCandidates: string[]
  filteredMyTradeCards: TradeCard[]
  filteredPartnerTradeCards: TradeCard[]
  partnerIncoming: Record<string, Record<string, number>>
  myIncoming: Record<string, Record<string, number>>
  myLockedOutgoing: Record<string, Record<string, number>>
  partnerLockedOutgoing: Record<string, Record<string, number>>
  partnerOwnedStickers: Record<string, Record<string, true>>
  meOwnedStickers: Record<string, Record<string, true>>
  offerNeededKeys: Record<string, true>
  requestNeededKeys: Record<string, true>
  selectedOfferCards: Record<string, number>
  selectedRequestCards: Record<string, number>
  selectedOfferCount: number
  selectedRequestCount: number
  offerQuantityTotal: number
  requestQuantityTotal: number
  onPartnerChange: (partner: string | null) => void
  onToggleOfferCard: (cardKey: string) => void
  onToggleRequestCard: (cardKey: string) => void
  onUpdateOfferQuantity: (cardKey: string, quantity: number) => void
  onUpdateRequestQuantity: (cardKey: string, quantity: number) => void
  onSendTradeRequest: () => void
}

export default function TradesTab({
  activeTradePartner,
  tradeCandidates,
  filteredMyTradeCards,
  filteredPartnerTradeCards,
  partnerIncoming,
  myIncoming,
  myLockedOutgoing,
  partnerLockedOutgoing,
  offerNeededKeys,
  requestNeededKeys,
  selectedOfferCards,
  selectedRequestCards,
  selectedOfferCount,
  selectedRequestCount,
  offerQuantityTotal,
  requestQuantityTotal,
  partnerOwnedStickers,
  meOwnedStickers,
  onPartnerChange,
  onToggleOfferCard,
  onToggleRequestCard,
  onUpdateOfferQuantity,
  onUpdateRequestQuantity,
  onSendTradeRequest,
}: TradesTabProps) {
  return (
    <section className="mt-4 space-y-3">
      <article className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/85 p-3">
        <label htmlFor="trade-partner-select" className="text-xs text-zinc-400">
          Trade with
        </label>
        <select
          id="trade-partner-select"
          value={activeTradePartner ?? ''}
          className="mt-2 h-11 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-100 outline-none"
          onChange={(event) => {
            const nextSelection = event.target.value.trim()
            if (nextSelection.length === 0) {
              onPartnerChange(null)
              return
            }
            onPartnerChange(nextSelection)
          }}
        >
          {tradeCandidates.map((username) => (
            <option key={username} value={username}>
              {username}
            </option>
          ))}
        </select>
      </article>

      <article className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/85 p-3">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-100">Your duplicates</h2>
          <span className="text-[11px] text-zinc-400">Ordered by quantity</span>
        </div>
        {filteredMyTradeCards.length === 0 ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-4 text-center text-xs text-zinc-400">
            No duplicates available to offer.
          </div>
        ) : (
          <ul className="max-h-64 space-y-2 overflow-y-auto pr-1">
            {[...filteredMyTradeCards]
              .sort((left, right) => {
                const leftSelected = (selectedOfferCards[left.key] ?? 0) > 0
                const rightSelected = (selectedOfferCards[right.key] ?? 0) > 0
                if (leftSelected !== rightSelected) {
                  return leftSelected ? -1 : 1
                }
                const leftNeeds =
                  partnerOwnedStickers[left.sectionCode]?.[String(left.stickerNumber)] !== true &&
                  offerNeededKeys[left.key] === true &&
                  (partnerIncoming[left.sectionCode]?.[String(left.stickerNumber)] ?? 0) === 0
                const rightNeeds =
                  partnerOwnedStickers[right.sectionCode]?.[String(right.stickerNumber)] !== true &&
                  offerNeededKeys[right.key] === true &&
                  (partnerIncoming[right.sectionCode]?.[String(right.stickerNumber)] ?? 0) === 0
                if (leftNeeds !== rightNeeds) {
                  return leftNeeds ? -1 : 1
                }
                const leftFwc = left.sectionCode === 'FWC'
                const rightFwc = right.sectionCode === 'FWC'
                if (leftFwc !== rightFwc) {
                  return leftFwc ? -1 : 1
                }
                const leftFig1 = left.stickerNumber === 1
                const rightFig1 = right.stickerNumber === 1
                if (leftFig1 !== rightFig1) {
                  return leftFig1 ? -1 : 1
                }
                return (right.count ?? 0) - (left.count ?? 0)
              })
              .filter((card) => {
                const isSelected = (selectedOfferCards[card.key] ?? 0) > 0
                if (isSelected) {
                  return true
                }
                const locked = myLockedOutgoing[card.sectionCode]?.[String(card.stickerNumber)] ?? 0
                const available = Math.max(0, (card.count ?? 0) - locked)
                return available > 0
              })
              .map((card) => {
                const locked = myLockedOutgoing[card.sectionCode]?.[String(card.stickerNumber)] ?? 0
                const availableCount = Math.max(0, (card.count ?? 0) - locked)
                const selectedQuantity = selectedOfferCards[card.key] ?? 0
                const isSelected = selectedQuantity > 0
                const partnerHas = partnerOwnedStickers[card.sectionCode]?.[String(card.stickerNumber)] === true
                const partnerIncomingQty = partnerIncoming[card.sectionCode]?.[String(card.stickerNumber)] ?? 0
                const partnerNeeds = offerNeededKeys[card.key] === true && partnerIncomingQty === 0
                const needsBadge =
                  partnerHas || !partnerNeeds
                    ? null
                    : activeTradePartner === 'Botas'
                      ? 'It need'
                      : 'They need'

              return (
                <li key={`offer-${card.key}`}>
                  <button
                    type="button"
                    className={`flex h-11 w-full items-center justify-between rounded-xl border px-3 text-left text-sm active:scale-[0.98] ${
                      isSelected
                        ? 'border-blue-400/70 bg-blue-500/15 text-blue-100'
                        : partnerNeeds
                          ? 'border-emerald-400/70 bg-emerald-500/10 text-emerald-100'
                          : availableCount <= 0
                            ? 'border-purple-500/70 bg-purple-500/10 text-purple-100'
                            : 'border-zinc-700 bg-zinc-950 text-zinc-100'
                    }`}
                    disabled={availableCount <= 0 && !isSelected}
                    onClick={() => {
                      if (availableCount <= 0 && !isSelected) {
                        return
                      }
                      onToggleOfferCard(card.key)
                    }}
                  >
                    <span>
                      {card.label}
                      {needsBadge == null ? null : (
                        <span className="ml-2 rounded bg-emerald-600/30 px-2 py-[2px] text-[10px] text-emerald-50">
                          {needsBadge}
                        </span>
                      )}
                    </span>
                    <span className="font-semibold text-zinc-200">
                      {isSelected ? `${selectedQuantity}/${availableCount}` : `x${availableCount}`}
                      {locked > 0 ? (
                        <span className="ml-2 rounded bg-purple-600/40 px-2 py-[2px] text-[10px] text-purple-50">
                          locked {locked}
                        </span>
                      ) : null}
                    </span>
                  </button>
                  {isSelected ? (
                    <div className="mt-2 grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        className="h-8 rounded-lg bg-zinc-800 text-lg text-zinc-100 active:scale-[0.98]"
                        onClick={() => {
                          if (selectedQuantity <= 1) {
                            onToggleOfferCard(card.key)
                          } else {
                            onUpdateOfferQuantity(card.key, selectedQuantity - 1)
                          }
                        }}
                      >
                        −
                      </button>
                      <div className="grid h-8 place-items-center rounded-lg bg-zinc-900 text-xs text-zinc-200">
                        {selectedQuantity}
                      </div>
                      <button
                        type="button"
                        className="h-8 rounded-lg bg-zinc-800 text-lg text-zinc-100 active:scale-[0.98]"
                        disabled={selectedQuantity >= availableCount}
                        onClick={() => onUpdateOfferQuantity(card.key, selectedQuantity + 1)}
                      >
                        +
                      </button>
                    </div>
                  ) : null}
                </li>
              )
            })}
          </ul>
        )}
      </article>

      <article className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/85 p-3">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-100">
            {activeTradePartner != null ? `${activeTradePartner} duplicates` : 'Requested'}
          </h2>
          <span className="text-[11px] text-zinc-400">Pick what you need</span>
        </div>
        {activeTradePartner == null ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-4 text-center text-xs text-zinc-400">
            No partner selected.
          </div>
        ) : filteredPartnerTradeCards.length === 0 ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-4 text-center text-xs text-zinc-400">
            {activeTradePartner} has no duplicates right now.
          </div>
        ) : (
          <ul className="max-h-64 space-y-2 overflow-y-auto pr-1">
            {[...filteredPartnerTradeCards]
              .sort((left, right) => {
                const leftSelected = (selectedRequestCards[left.key] ?? 0) > 0
                const rightSelected = (selectedRequestCards[right.key] ?? 0) > 0
                if (leftSelected !== rightSelected) {
                  return leftSelected ? -1 : 1
                }
                const leftNeed =
                  meOwnedStickers[left.sectionCode]?.[String(left.stickerNumber)] !== true &&
                  requestNeededKeys[left.key] === true &&
                  (myIncoming[left.sectionCode]?.[String(left.stickerNumber)] ?? 0) === 0
                const rightNeed =
                  meOwnedStickers[right.sectionCode]?.[String(right.stickerNumber)] !== true &&
                  requestNeededKeys[right.key] === true &&
                  (myIncoming[right.sectionCode]?.[String(right.stickerNumber)] ?? 0) === 0
                if (leftNeed !== rightNeed) {
                  return leftNeed ? -1 : 1
                }
                const leftFwc = left.sectionCode === 'FWC'
                const rightFwc = right.sectionCode === 'FWC'
                if (leftFwc !== rightFwc) {
                  return leftFwc ? -1 : 1
                }
                const leftFig1 = left.stickerNumber === 1
                const rightFig1 = right.stickerNumber === 1
                if (leftFig1 !== rightFig1) {
                  return leftFig1 ? -1 : 1
                }
                return (right.count ?? 0) - (left.count ?? 0)
              })
              .filter((card) => {
                const isSelected = (selectedRequestCards[card.key] ?? 0) > 0
                if (isSelected) {
                  return true
                }
                const locked = partnerLockedOutgoing[card.sectionCode]?.[String(card.stickerNumber)] ?? 0
                const available = Math.max(0, (card.count ?? 0) - locked)
                return available > 0
              })
              .map((card) => {
              const partnerLocked = partnerLockedOutgoing[card.sectionCode]?.[String(card.stickerNumber)] ?? 0
              const availableCount = Math.max(0, (card.count ?? 0) - partnerLocked)
              const selectedQuantity = selectedRequestCards[card.key] ?? 0
              const isSelected = selectedQuantity > 0
              const iHave = meOwnedStickers[card.sectionCode]?.[String(card.stickerNumber)] === true
              const incomingMine = myIncoming[card.sectionCode]?.[String(card.stickerNumber)] ?? 0
              const iNeed = requestNeededKeys[card.key] === true && incomingMine === 0

              return (
                <li key={`request-${card.key}`}>
                  <button
                    type="button"
                    className={`flex h-11 w-full items-center justify-between rounded-xl border px-3 text-left text-sm active:scale-[0.98] ${
                      isSelected
                        ? 'border-amber-400/70 bg-amber-500/15 text-amber-100'
                        : iNeed
                          ? 'border-violet-400/70 bg-violet-500/10 text-violet-100'
                          : 'border-zinc-700 bg-zinc-950 text-zinc-100'
                    }`}
                    onClick={() => onToggleRequestCard(card.key)}
                  >
                    <span>
                      {card.label}
                      {iHave ? null : <span className="ml-2 rounded bg-violet-600/30 px-2 py-[2px] text-[10px] text-violet-50">You need</span>}
                    </span>
                    <span className="font-semibold text-zinc-200">
                      {isSelected ? `${selectedQuantity}/${availableCount}` : `x${availableCount}`}
                    </span>
                  </button>
                  {isSelected ? (
                    <div className="mt-2 grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        className="h-8 rounded-lg bg-zinc-800 text-lg text-zinc-100 active:scale-[0.98]"
                        onClick={() => {
                          if (selectedQuantity <= 1) {
                            onToggleRequestCard(card.key)
                          } else {
                            onUpdateRequestQuantity(card.key, selectedQuantity - 1)
                          }
                        }}
                      >
                        −
                      </button>
                      <div className="grid h-8 place-items-center rounded-lg bg-zinc-900 text-xs text-zinc-200">
                        {selectedQuantity}
                      </div>
                      <button
                        type="button"
                        className="h-8 rounded-lg bg-zinc-800 text-lg text-zinc-100 active:scale-[0.98]"
                        disabled={selectedQuantity >= availableCount}
                        onClick={() => onUpdateRequestQuantity(card.key, selectedQuantity + 1)}
                      >
                        +
                      </button>
                    </div>
                  ) : null}
                </li>
              )
            })}
          </ul>
        )}
      </article>

      <div className="flex items-center justify-between text-xs text-zinc-400">
        <span>Offer qty: {offerQuantityTotal}</span>
        <span>Request qty: {requestQuantityTotal}</span>
      </div>

      <button
        type="button"
        className={`h-12 w-full rounded-xl text-sm font-semibold ${
          activeTradePartner != null && (selectedOfferCount > 0 || selectedRequestCount > 0)
            ? 'bg-emerald-600 text-white active:scale-[0.98]'
            : 'bg-zinc-800 text-zinc-500'
        }`}
        disabled={activeTradePartner == null || (selectedOfferCount === 0 && selectedRequestCount === 0)}
        onClick={onSendTradeRequest}
      >
        Send trade request
      </button>
    </section>
  )
}
