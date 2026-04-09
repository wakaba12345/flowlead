import Link from 'next/link'
import { BookOpen, ClipboardList, Upload, BarChart2, Sparkles, Gift, Settings } from 'lucide-react'

const sections = [
  { id: 'forms',   icon: ClipboardList, label: '建立問卷表單' },
  { id: 'import',  icon: Upload,        label: '匯入外部資料' },
  { id: 'leads',   icon: BarChart2,     label: '查看名單與篩選' },
  { id: 'report',  icon: Sparkles,      label: 'AI 分析報告' },
  { id: 'lottery', icon: Gift,          label: '抽獎' },
  { id: 'settings',icon: Settings,      label: '設定' },
]

export default function GuidePage() {
  return (
    <div className="max-w-2xl">
      <div className="mb-8 flex items-center gap-3">
        <BookOpen size={24} className="text-violet-400" />
        <div>
          <h1 className="text-2xl font-bold">使用手冊</h1>
          <p className="mt-0.5 text-sm text-gray-400">快速上手 FlowLead 的各項功能</p>
        </div>
      </div>

      {/* Quick Nav */}
      <div className="mb-8 flex flex-wrap gap-2">
        {sections.map(({ id, icon: Icon, label }) => (
          <a key={id} href={`#${id}`}
            className="flex items-center gap-1.5 rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-xs text-gray-300 hover:border-violet-500 hover:text-violet-300 transition">
            <Icon size={12} />{label}
          </a>
        ))}
      </div>

      <div className="space-y-10">

        {/* 1. 建立問卷 */}
        <section id="forms">
          <SectionTitle icon={ClipboardList} label="一、建立問卷表單" />
          <Steps steps={[
            <>前往 <NavLink href="/dashboard/forms">表單管理</NavLink> → <strong>新增表單</strong></>,
            <>填寫題目、選項、收集欄位（姓名、Email 等）</>,
            <>設定結束時間（可不填，代表永久開放）</>,
            <>切換狀態為 <Tag color="green">上線中</Tag>，複製嵌入連結或 QR Code 分享給受訪者</>,
          ]} />
        </section>

        {/* 2. 匯入外部資料 */}
        <section id="import">
          <SectionTitle icon={Upload} label="二、匯入外部資料（Google 表單 / Excel）" />
          <Steps steps={[
            <>前往 <NavLink href="/dashboard/leads">名單</NavLink> → <strong>匯入外部資料分析</strong></>,
            <>上傳 CSV 檔案（支援 UTF-8 / Big5，自動偵測編碼）</>,
            <>AI 自動分析欄位類型，確認後按匯入</>,
          ]} />
          <div className="mt-4 overflow-hidden rounded-xl border border-gray-700">
            <table className="w-full text-sm">
              <thead className="bg-gray-800 text-xs text-gray-400">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold">欄位類型</th>
                  <th className="px-4 py-2 text-left font-semibold">說明</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {[
                  ['統計欄位', '單選題，產生長條圖'],
                  ['複選統計', '同格逗號分隔的多選（Google 表單預設）'],
                  ['核取選項', '每個選項獨立一欄（v / 空白格式），系統自動合併成一題'],
                  ['開放式', '自由填寫文字，AI 會摘要分析'],
                  ['個人資料', '姓名、電話、Email 等，顯示在名單列表'],
                  ['略過', '不匯入（時間戳記等）'],
                ].map(([type, desc]) => (
                  <tr key={type} className="bg-gray-900 text-gray-300">
                    <td className="px-4 py-2 font-medium text-gray-100 whitespace-nowrap">{type}</td>
                    <td className="px-4 py-2 text-gray-400">{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 3. 查看名單 */}
        <section id="leads">
          <SectionTitle icon={BarChart2} label="三、查看名單與篩選" />
          <Steps steps={[
            <>前往 <NavLink href="/dashboard/leads">名單</NavLink> → 點入任一表單</>,
            <>點選圖表中的任一選項 → 交叉篩選，可疊加多個條件</>,
            <>點選已選條件再次點擊可取消；點「清除全部」還原</>,
            <><strong>匯出 CSV</strong> 下載篩選後名單</>,
          ]} />
        </section>

        {/* 4. AI 報告 */}
        <section id="report">
          <SectionTitle icon={Sparkles} label="四、AI 分析報告" />
          <Steps steps={[
            <>進入名單詳情頁 → 點擊 <strong>生成 AI 報告</strong></>,
            <>生成期間可自由切換頁面，完成後右下角會出現提示</>,
            <>報告自動開新分頁，可直接列印成 PDF（Ctrl+P）</>,
            <>報告底部可複製分享連結給同事</>,
            <>歷史報告可在 <strong>報告歷史</strong> 區塊查看、複製連結或刪除</>,
          ]} />
        </section>

        {/* 5. 抽獎 */}
        <section id="lottery">
          <SectionTitle icon={Gift} label="五、抽獎" />
          <Steps steps={[
            <>前往 <NavLink href="/dashboard/lottery">抽獎</NavLink> → 選擇表單</>,
            <>設定獎項名稱與人數（可新增多個獎項）</>,
            <>點擊 <strong>開始抽獎</strong> → 逐獎項抽出得獎者</>,
            <>點擊 <strong>匯出結果 CSV</strong> 下載得獎名單</>,
          ]} />
        </section>

        {/* 6. 設定 */}
        <section id="settings">
          <SectionTitle icon={Settings} label="六、設定" />
          <Steps steps={[
            <>前往 <NavLink href="/dashboard/settings">設定</NavLink></>,
            <><strong>系統提示詞</strong>：調整 AI 報告的分析風格與重點</>,
          ]} />
        </section>

      </div>
    </div>
  )
}

function SectionTitle({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="mb-4 flex items-center gap-2 border-b border-gray-800 pb-3">
      <Icon size={16} className="text-violet-400" />
      <h2 className="font-bold text-gray-100">{label}</h2>
    </div>
  )
}

function Steps({ steps }: { steps: React.ReactNode[] }) {
  return (
    <ol className="space-y-2">
      {steps.map((step, i) => (
        <li key={i} className="flex gap-3 text-sm text-gray-300">
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-600/30 text-xs font-bold text-violet-300">
            {i + 1}
          </span>
          <span className="leading-relaxed">{step}</span>
        </li>
      ))}
    </ol>
  )
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="font-medium text-violet-400 underline underline-offset-2 hover:text-violet-300 transition">
      {children}
    </Link>
  )
}

function Tag({ color, children }: { color: 'green'; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-green-400/10 px-2 py-0.5 text-xs font-semibold text-green-400">
      {children}
    </span>
  )
}
