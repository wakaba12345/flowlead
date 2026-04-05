export interface Question {
  id: string
  type: 'single_choice'
  question_text: string
  options: string[]
}

export interface LeadField {
  id: string
  label: string
  type: 'text' | 'email' | 'tel' | 'select' | 'radio'
  placeholder?: string
  options?: string[]
  required: boolean
}

export interface LeadCapture {
  title: string
  description: string
  note?: string
  fields: LeadField[]
  button_text: string
  // legacy
  input_placeholder?: string
}

export interface FormSchema {
  form_title: string
  hook_text?: string
  questions: Question[]
  lead_capture: LeadCapture
}

export interface Form {
  id: string
  tenant_id: string
  title: string
  schema: FormSchema
  lead_capture: LeadCapture
  theme: Record<string, string>
  webhook_url: string | null
  status: 'active' | 'inactive' | 'archived'
  ends_at: string | null
  created_at: string
  updated_at: string
}

export interface Response {
  id: string
  form_id: string
  tenant_id: string
  answers: Record<string, string>
  contact_email: string | null
  contact_phone: string | null
  lead_data: Record<string, string>
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  page_url: string | null
  ip_hash: string | null
  completed: boolean
  is_test: boolean
  created_at: string
}

export interface Tenant {
  id: string
  name: string
  slug: string
  settings: Record<string, unknown>
  plan: 'free' | 'pro' | 'enterprise'
  created_at: string
}

export interface Template {
  id: string
  tenant_id: string | null
  name: string
  industry: string | null
  schema: FormSchema
  lead_capture: LeadCapture
  created_at: string
}

export interface SystemPrompt {
  id: string
  tenant_id: string | null
  key: string
  prompt_text: string
  is_active: boolean
  updated_at: string
}

export interface AIGenerateInput {
  client_name: string
  industry: string
  product_features: string
  conversion_goal: string
  free_text?: string
}

// Preset lead fields available for selection
export const PRESET_LEAD_FIELDS: LeadField[] = [
  { id: 'email', label: 'Email', type: 'email', placeholder: 'your@email.com', required: true },
  { id: 'name', label: '姓名', type: 'text', placeholder: '請輸入姓名', required: false },
  { id: 'phone', label: '電話', type: 'tel', placeholder: '09xx-xxx-xxx', required: false },
  { id: 'gender', label: '性別', type: 'radio', options: ['男', '女', '其他'], required: false },
  { id: 'age', label: '年齡', type: 'text', placeholder: '例：28', required: false },
  { id: 'address', label: '地址', type: 'text', placeholder: '請輸入地址', required: false },
  { id: 'income', label: '年收入', type: 'select', options: ['30萬以下', '30-60萬', '60-100萬', '100萬以上'], required: false },
  { id: 'has_children', label: '有無子女', type: 'radio', options: ['有', '無'], required: false },
]
