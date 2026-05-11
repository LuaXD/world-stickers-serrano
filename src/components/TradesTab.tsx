import type { TradeCard } from '../types/stickers'

type TradesTabProps = {
  activeTradePartner: string | null
  tradeCandidates: string[]
  filteredMyTradeCards: TradeCard[]
  filteredPartnerTradeCards: TradeCard[]
  selectedOfferCards: Record<string, true>
  selectedRequestCards: Record<string, true>
  selectedOfferCount: number
  selectedRequestCount: number
  onPartnerChange: (partner: string | null) => void
  onToggleOfferCard: (cardKey: string) => void
  onToggleRequestCard: (cardKey: string) => void
  onSendTradeRequest: () => void
}

export default function TradesTab({
  activeTradePartner,
  tradeCandidates,
  filteredMyTradeCards,
  filteredPartnerTradeCards,
  selectedOfferCards,
  selectedRequestCards,
  selectedOfferCount,
  selectedRequestCount,
  onPartnerChange,
  onToggleOfferCard,
  onToggleRequestCard,
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
            {filteredMyTradeCards.map((card) => {
              const isSelected = selectedOfferCards[card.key] === true

              return (
                <li key={`offer-${card.key}`}>
                  <button
                    type="button"
                    className={`flex h-11 w-full items-center justify-between rounded-xl border px-3 text-left text-sm active:scale-[0.98] ${
                      isSelected
                        ? 'border-blue-400/70 bg-blue-500/15 text-blue-100'
                        : 'border-zinc-700 bg-zinc-950 text-zinc-100'
                    }`}
                    onClick={() => onToggleOfferCard(card.key)}
                  >
                    <span>{card.label}</span>
                    <span className="font-semibold text-zinc-200">x{card.count}</span>
                  </button>
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
            {filteredPartnerTradeCards.map((card) => {
              const isSelected = selectedRequestCards[card.key] === true

              return (
                <li key={`request-${card.key}`}>
                  <button
                    type="button"
                    className={`flex h-11 w-full items-center justify-between rounded-xl border px-3 text-left text-sm active:scale-[0.98] ${
                      isSelected
                        ? 'border-amber-400/70 bg-amber-500/15 text-amber-100'
                        : 'border-zinc-700 bg-zinc-950 text-zinc-100'
                    }`}
                    onClick={() => onToggleRequestCard(card.key)}
                  >
                    <span>{card.label}</span>
                    <span className="font-semibold text-zinc-200">x{card.count}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </article>

      <button
        type="button"
        className={`h-12 w-full rounded-xl text-sm font-semibold ${
          activeTradePartner != null && selectedOfferCount > 0 && selectedRequestCount > 0
            ? 'bg-emerald-600 text-white active:scale-[0.98]'
            : 'bg-zinc-800 text-zinc-500'
        }`}
        disabled={activeTradePartner == null || selectedOfferCount === 0 || selectedRequestCount === 0}
        onClick={onSendTradeRequest}
      >
        Send trade request
      </button>
    </section>
  )
}
