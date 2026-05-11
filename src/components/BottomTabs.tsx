import type { AppTab } from '../types/stickers'

type BottomTabsProps = {
  activeTab: AppTab
  onChangeTab: (tab: AppTab) => void
}

export default function BottomTabs({ activeTab, onChangeTab }: BottomTabsProps) {
  return (
    <nav className="fixed bottom-0 left-1/2 z-20 w-full max-w-[430px] -translate-x-1/2 border-t border-zinc-800 bg-[#101115] pb-[max(env(safe-area-inset-bottom),10px)] pt-2">
      <ul className="grid grid-cols-3 text-center text-xs">
        <li>
          <button
            type="button"
            className={activeTab === 'album' ? 'w-full text-white' : 'w-full text-zinc-500'}
            onClick={() => onChangeTab('album')}
          >
            <div className="text-lg">🏆</div>
            <div>Album</div>
          </button>
        </li>
        <li>
          <button
            type="button"
            className={activeTab === 'duplicates' ? 'w-full text-white' : 'w-full text-zinc-500'}
            onClick={() => onChangeTab('duplicates')}
          >
            <div className="text-lg">🗂️</div>
            <div>Duplicates</div>
          </button>
        </li>
        <li>
          <button
            type="button"
            className={activeTab === 'trades' ? 'w-full text-white' : 'w-full text-zinc-500'}
            onClick={() => onChangeTab('trades')}
          >
            <div className="text-lg">🤝</div>
            <div>Trades</div>
          </button>
        </li>
      </ul>
    </nav>
  )
}
