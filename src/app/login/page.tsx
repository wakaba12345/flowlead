'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const from = searchParams.get('from') || '/dashboard'
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleGoogleSuccess(credentialResponse: { credential?: string }) {
    if (!credentialResponse.credential) return
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: credentialResponse.credential }),
      })
      if (res.ok) {
        router.push(from)
        router.refresh()
      } else {
        const { error: msg } = await res.json()
        setError(msg || '登入失敗，請確認帳號權限')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-600">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">FlowLead</h1>
          <p className="mt-1 text-sm text-gray-500">使用公司 Google 帳號登入</p>
        </div>

        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
          {error && (
            <p className="mb-4 rounded-lg bg-red-500/10 px-3 py-2 text-xs font-medium text-red-400">
              {error}
            </p>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-3 text-sm text-gray-400">
              驗證中...
            </div>
          ) : (
            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError('Google 登入失敗，請再試一次')}
                theme="filled_black"
                shape="rectangular"
                size="large"
                text="signin_with"
                locale="zh-TW"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!}>
      <Suspense>
        <LoginForm />
      </Suspense>
    </GoogleOAuthProvider>
  )
}
