import type { TradeRequest } from '../types/stickers'

type PendingTradesDropdownProps = {
  activeUsername: string
  trades: TradeRequest[]
  formatTradeLine: (section: string, sticker: number, quantity: number) => string
  onAccept: (tradeId: string) => void
  onDecline: (tradeId: string) => void
  onEdit: (trade: TradeRequest) => void
}

export default function PendingTradesDropdown({
  activeUsername,
  trades,
  formatTradeLine,
  onAccept,
  onDecline,
  onEdit,
}: PendingTradesDropdownProps) {
  if (trades.length === 0) {
    return null
  }

  return (
    <details className="mt-3 overflow-hidden rounded-xl border border-zinc-700 bg-zinc-900/80">
      <summary className="cursor-pointer list-none px-3 py-2 text-sm font-semibold text-zinc-100">
        Pending trades ({trades.length})
      </summary>
      <div className="space-y-3 border-t border-zinc-800 px-3 py-3">
        {trades.map((trade) => {
          const isIncoming = trade.to === activeUsername
          const partner = isIncoming ? trade.from : trade.to
          const directionLabel = isIncoming ? `From ${partner}` : `To ${partner}`
          const totalOffered = trade.offered.reduce((sum, line) => sum + line.quantity, 0)
          const totalRequested = trade.requested.reduce((sum, line) => sum + line.quantity, 0)

          return (
            <article key={trade.id} className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xs font-semibold text-zinc-100">{directionLabel}</h3>
                <span className="rounded-full border border-zinc-700 px-2 py-0.5 text-[10px] text-zinc-300">
                  {trade.status}
                </span>
              </div>
              <div className="mt-1 text-[11px] text-zinc-400">
                {totalOffered} offered · {totalRequested} requested
              </div>
              <div className="mt-2 text-[11px] text-zinc-300">
                {trade.offered.length === 0 ? 'Gives nothing' : 'Gives'}
              </div>
              <ul className="mt-1 space-y-1 text-[11px] text-zinc-200">
                {trade.offered.map((line) => (
                  <li key={`${trade.id}-offered-${line.section}-${line.sticker}`}>
                    {formatTradeLine(line.section, line.sticker, line.quantity)}
                  </li>
                ))}
              </ul>
              <div className="mt-2 text-[11px] text-zinc-300">
                {trade.requested.length === 0 ? 'Asks nothing' : 'Asks'}
              </div>
              <ul className="mt-1 space-y-1 text-[11px] text-zinc-200">
                {trade.requested.map((line) => (
                  <li key={`${trade.id}-requested-${line.section}-${line.sticker}`}>
                    {formatTradeLine(line.section, line.sticker, line.quantity)}
                  </li>
                ))}
              </ul>
              {trade.status === 'pending' ? (
                <div
                  className={`mt-3 grid gap-2 ${isIncoming ? 'grid-cols-3' : 'grid-cols-1 sm:grid-cols-2'}`}
                >
                  <button
                    type="button"
                    className="h-9 rounded-lg border border-blue-400/60 bg-blue-500/20 text-xs font-semibold text-blue-100 active:scale-[0.98]"
                    onClick={() => onEdit(trade)}
                  >
                    Edit
                  </button>
                  {isIncoming ? (
                    <>
                      <button
                        type="button"
                        className="h-9 rounded-lg bg-emerald-600 text-xs font-semibold text-white active:scale-[0.98]"
                        onClick={() => onAccept(trade.id)}
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        className="h-9 rounded-lg bg-zinc-700 text-xs font-semibold text-zinc-100 active:scale-[0.98]"
                        onClick={() => onDecline(trade.id)}
                      >
                        Decline
                      </button>
                    </>
                  ) : null}
                </div>
              ) : null}
            </article>
          )
        })}
      </div>
    </details>
  )
}
