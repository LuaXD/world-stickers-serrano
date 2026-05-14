import type { TradeCard } from '../types/stickers'

type TradesTabProps = {
  activeTradePartner: string | null
  tradeCandidates: string[]
  filteredMyTradeCards: TradeCard[]
  filteredPartnerTradeCards: TradeCard[]
  partnerOwnedStickers: Record<string, Record<string, true>>
  meOwnedStickers: Record<string, Record<string, true>>
  offerNeededKeys: Record<string, true>
  requestNeededKeys: Record<string, true>
  selectedOfferCards: Record<string, number>
  selectedRequestCards: Record<string, number>
  selectedOfferCount: number
  selectedRequestCount: number
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
  offerNeededKeys,
  requestNeededKeys,
  selectedOfferCards,
  selectedRequestCards,
  selectedOfferCount,
  selectedRequestCount,
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
                const leftNeeds =
                  partnerOwnedStickers[left.sectionCode]?.[String(left.stickerNumber)] !== true &&
                  offerNeededKeys[left.key] === true
                const rightNeeds =
                  partnerOwnedStickers[right.sectionCode]?.[String(right.stickerNumber)] !== true &&
                  offerNeededKeys[right.key] === true
                if (leftNeeds !== rightNeeds) {
                  return leftNeeds ? -1 : 1
                }
                return right.count === left.count ? 0 : right.count - left.count
              })
              .map((card) => {
              const selectedQuantity = selectedOfferCards[card.key] ?? 0
              const isSelected = selectedQuantity > 0
              const partnerHas = partnerOwnedStickers[card.sectionCode]?.[String(card.stickerNumber)] === true
              const partnerNeeds = offerNeededKeys[card.key] === true
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
                          : 'border-zinc-700 bg-zinc-950 text-zinc-100'
                    }`}
                    onClick={() => onToggleOfferCard(card.key)}
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
                      {isSelected ? `${selectedQuantity}/${card.count}` : `x${card.count}`}
                    </span>
                  </button>
                  {isSelected ? (
                    <div className="mt-2 grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        className="h-8 rounded-lg bg-zinc-800 text-lg text-zinc-100 active:scale-[0.98]"
                        disabled={selectedQuantity <= 1}
                        onClick={() => onUpdateOfferQuantity(card.key, selectedQuantity - 1)}
                      >
                        −
                      </button>
                      <div className="grid h-8 place-items-center rounded-lg bg-zinc-900 text-xs text-zinc-200">
                        {selectedQuantity}
                      </div>
                      <button
                        type="button"
                        className="h-8 rounded-lg bg-zinc-800 text-lg text-zinc-100 active:scale-[0.98]"
                        disabled={selectedQuantity >= card.count}
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
                const leftNeed = meOwnedStickers[left.sectionCode]?.[String(left.stickerNumber)] !== true && requestNeededKeys[left.key] === true
                const rightNeed = meOwnedStickers[right.sectionCode]?.[String(right.stickerNumber)] !== true && requestNeededKeys[right.key] === true
                if (leftNeed !== rightNeed) {
                  return leftNeed ? -1 : 1
                }
                return right.count === left.count ? 0 : right.count - left.count
              })
              .map((card) => {
              const selectedQuantity = selectedRequestCards[card.key] ?? 0
              const isSelected = selectedQuantity > 0
              const iHave = meOwnedStickers[card.sectionCode]?.[String(card.stickerNumber)] === true
              const iNeed = requestNeededKeys[card.key] === true

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
                      {isSelected ? `${selectedQuantity}/${card.count}` : `x${card.count}`}
                    </span>
                  </button>
                  {isSelected ? (
                    <div className="mt-2 grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        className="h-8 rounded-lg bg-zinc-800 text-lg text-zinc-100 active:scale-[0.98]"
                        disabled={selectedQuantity <= 1}
                        onClick={() => onUpdateRequestQuantity(card.key, selectedQuantity - 1)}
                      >
                        −
                      </button>
                      <div className="grid h-8 place-items-center rounded-lg bg-zinc-900 text-xs text-zinc-200">
                        {selectedQuantity}
                      </div>
                      <button
                        type="button"
                        className="h-8 rounded-lg bg-zinc-800 text-lg text-zinc-100 active:scale-[0.98]"
                        disabled={selectedQuantity >= card.count}
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
