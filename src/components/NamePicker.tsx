type NamePickerProps = {
  availableUsers: string[]
  onSelectUser: (username: string) => void
}

export default function NamePicker({ availableUsers, onSelectUser }: NamePickerProps) {
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
              onClick={() => onSelectUser(username)}
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
