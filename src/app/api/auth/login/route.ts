import { NextRequest, NextResponse } from 'next/server'

// Decode Google JWT payload without external library
function decodeGoogleJwt(credential: string) {
  const payload = credential.split('.')[1]
  const decoded = Buffer.from(payload, 'base64url').toString('utf-8')
  return JSON.parse(decoded) as {
    email: string
    name: string
    picture: string
    exp: number
    iat: number
  }
}

export async function POST(req: NextRequest) {
  const { credential } = await req.json()

  if (!credential) {
    return NextResponse.json({ error: '缺少登入憑證' }, { status: 400 })
  }

  let userInfo: ReturnType<typeof decodeGoogleJwt>
  try {
    userInfo = decodeGoogleJwt(credential)
  } catch {
    return NextResponse.json({ error: '無效的 Google 憑證' }, { status: 400 })
  }

  // Call external auth API
  const apiRes = await fetch('https://new-prod-admin.storm.mg/api/v1/loging', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: userInfo.email,
      name: userInfo.name,
      token: credential,
      refreshToken: '',
      expiresIn: userInfo.exp,
      avatar: userInfo.picture,
      tokenName: 'FlowLead',
    }),
  })

  if (!apiRes.ok) {
    return NextResponse.json({ error: '驗證失敗，請聯繫管理員' }, { status: 403 })
  }

  const apiData = await apiRes.json()
  const token = apiData?.data?.token

  if (!token) {
    return NextResponse.json({ error: '無法取得 token' }, { status: 403 })
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set('_xsid', token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    secure: process.env.NODE_ENV === 'production',
  })
  return res
}
