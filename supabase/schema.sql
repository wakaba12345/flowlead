-- FlowLead Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ── TENANTS ──────────────────────────────────────────────────
create table if not exists tenants (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text unique not null,
  settings jsonb default '{}',
  plan text default 'free' check (plan in ('free', 'pro', 'enterprise')),
  created_at timestamptz default now()
);

insert into tenants (name, slug, plan) values ('Storm Media', 'storm_media', 'pro')
  on conflict (slug) do nothing;

-- ── FORMS ────────────────────────────────────────────────────
create table if not exists forms (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references tenants(id) on delete cascade,
  title text not null,
  schema jsonb not null default '{"form_title":"","questions":[],"lead_capture":{}}',
  lead_capture jsonb default '{}',
  theme jsonb default '{}',
  webhook_url text,
  status text default 'draft' check (status in ('draft', 'active', 'archived')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ── RESPONSES ────────────────────────────────────────────────
create table if not exists responses (
  id uuid primary key default uuid_generate_v4(),
  form_id uuid references forms(id) on delete cascade,
  tenant_id uuid references tenants(id) on delete cascade,
  answers jsonb default '{}',
  contact_email text,
  contact_phone text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  page_url text,
  ip_hash text,
  completed boolean default false,
  created_at timestamptz default now()
);

-- ── SYSTEM PROMPTS ───────────────────────────────────────────
create table if not exists system_prompts (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references tenants(id) on delete cascade,
  key text not null,
  prompt_text text not null,
  is_active boolean default true,
  updated_at timestamptz default now()
);

insert into system_prompts (tenant_id, key, prompt_text)
select
  (select id from tenants where slug = 'storm_media'),
  'default_form_gen',
  '你是一個頂尖的行銷轉換率優化專家與文案大師。
你的任務是根據使用者提供的產品資訊，設計出一個「高轉換率、低摩擦力」的微型互動問卷。

【設計原則】
1. 第一題必須是「誘餌 (Hook)」— 直接給出吸引人的選項
2. 題目限制 3-4 題
3. 選項文字簡短、直擊痛點或渴望（可加 emoji）
4. 最後收網強調「填寫可獲得的具體好處」

【輸入】
- 客戶名稱：{{client_name}}
- 產業屬性：{{industry}}
- 產品特色：{{product_features}}
- 轉換目標：{{conversion_goal}}
- 補充說明：{{free_text}}

【輸出】嚴格 JSON 格式如下，不含其他文字：
{
  "form_title": "...",
  "questions": [
    {
      "id": "q1",
      "type": "single_choice",
      "question_text": "...",
      "options": ["...", "...", "..."]
    }
  ],
  "lead_capture": {
    "title": "...",
    "description": "...",
    "input_placeholder": "your@email.com",
    "button_text": "..."
  }
}'
where not exists (
  select 1 from system_prompts where key = 'default_form_gen'
);

-- ── TEMPLATES ────────────────────────────────────────────────
create table if not exists templates (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references tenants(id) on delete cascade,
  name text not null,
  industry text,
  schema jsonb not null,
  lead_capture jsonb default '{}',
  created_at timestamptz default now()
);

insert into templates (name, industry, schema, lead_capture)
select '財富健檢型', 'ETF/投信',
  '{"form_title":"你的投資風格是哪一型？","questions":[{"id":"q1","type":"single_choice","question_text":"如果有 100 萬，你最想怎麼用？","options":["每月穩穩領息 💰","押注科技股衝一波 🚀","放定存就好 😌"]},{"id":"q2","type":"single_choice","question_text":"你目前的投資經驗是？","options":["完全新手，還在觀望","有買過基金或股票","資深老手，研究技術面"]},{"id":"q3","type":"single_choice","question_text":"如果股價突然跌 20%，你會？","options":["加碼買進 📈","按兵不動觀察 👀","趕快停損 🏃"]}]}'::jsonb,
  '{"title":"分析完成！你的專屬 ETF 配對已生成","description":"輸入 Email 立即查看最適合你的 3 檔高股息 ETF","input_placeholder":"your@email.com","button_text":"立即查看結果"}'::jsonb
where not exists (select 1 from templates where name = '財富健檢型');

insert into templates (name, industry, schema, lead_capture)
select '症狀自評型', '生技/保健',
  '{"form_title":"你最近身體狀況如何？","questions":[{"id":"q1","type":"single_choice","question_text":"最困擾你的身體問題是？","options":["睡不好、常疲倦 😴","腸胃不適、脹氣 🫃","免疫力差、常感冒 🤧"]},{"id":"q2","type":"single_choice","question_text":"你的生活型態是？","options":["久坐辦公室","經常外食","運動規律但壓力大"]},{"id":"q3","type":"single_choice","question_text":"困擾持續多久了？","options":["剛開始注意到","1-3 個月","超過半年了"]}]}'::jsonb,
  '{"title":"你的健康評估完成！","description":"輸入 Email 領取專屬保健建議 + 試用組","input_placeholder":"your@email.com","button_text":"領取我的試用組"}'::jsonb
where not exists (select 1 from templates where name = '症狀自評型');

insert into templates (name, industry, schema, lead_capture)
select '夢想描繪型', '房地產/建商',
  '{"form_title":"找到你夢想中的家","questions":[{"id":"q1","type":"single_choice","question_text":"你的購屋預算大概是？","options":["1000 萬以下","1000-2000 萬","2000 萬以上"]},{"id":"q2","type":"single_choice","question_text":"偏好哪個區域？","options":["台北市區","新北/桃園","其他北部地區"]},{"id":"q3","type":"single_choice","question_text":"最看重的條件是？","options":["學區好 🏫","交通方便 🚇","空間夠大 🏠"]}]}'::jsonb,
  '{"title":"為你配對到 3 個符合條件的建案","description":"留下聯絡方式，我們的顧問將為你安排專屬鑑賞","input_placeholder":"your@email.com","button_text":"預約鑑賞"}'::jsonb
where not exists (select 1 from templates where name = '夢想描繪型');

-- ── UPDATED_AT TRIGGER ───────────────────────────────────────
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists forms_updated_at on forms;
create trigger forms_updated_at
  before update on forms
  for each row execute function update_updated_at();

drop trigger if exists system_prompts_updated_at on system_prompts;
create trigger system_prompts_updated_at
  before update on system_prompts
  for each row execute function update_updated_at();

-- ── RLS (Phase 1: service_role bypasses RLS) ─────────────────
alter table tenants enable row level security;
alter table forms enable row level security;
alter table responses enable row level security;
alter table system_prompts enable row level security;
alter table templates enable row level security;
