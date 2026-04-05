'use client'
import type { FormSchema } from '@/types'
import LuxuryDarkLayout from './layouts/LuxuryDarkLayout'
import LuxuryLightLayout from './layouts/LuxuryLightLayout'
import MarketingLayout from './layouts/MarketingLayout'
import MinimalLayout from './layouts/MinimalLayout'
import DefaultLayout from './layouts/DefaultLayout'
import StormLayout from './layouts/StormLayout'

interface FlowLeadWidgetProps {
  formId: string
  schema: FormSchema
  theme?: Record<string, string>
  isTest?: boolean
  onComplete?: (data: { answers: Record<string, string>; leadData: Record<string, string> }) => void
}

export default function FlowLeadWidget({ formId, schema, theme = {}, isTest = false, onComplete }: FlowLeadWidgetProps) {
  const layout = theme.layout || 'default'
  const props = { formId, schema, theme, isTest, onComplete }

  switch (layout) {
    case 'luxury-dark': return <LuxuryDarkLayout {...props} />
    case 'luxury-light': return <LuxuryLightLayout {...props} />
    case 'marketing': return <MarketingLayout {...props} />
    case 'minimal': return <MinimalLayout {...props} />
    case 'storm': return <StormLayout {...props} />
    default: return <DefaultLayout {...props} />
  }
}
