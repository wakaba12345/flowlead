import Link from 'next/link'

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 text-center">
      <div>
        <h1 className="text-5xl font-bold tracking-tight">
          Flow<span className="text-violet-400">Lead</span>
        </h1>
        <p className="mt-3 text-gray-400">內容嵌合式互動表單引擎</p>
      </div>
      <div className="flex gap-3">
        <Link
          href="/dashboard"
          className="rounded-xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-violet-500"
        >
          進入後台
        </Link>
      </div>
    </div>
  )
}
