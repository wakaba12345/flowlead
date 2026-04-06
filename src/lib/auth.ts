import { NextRequest } from 'next/server'

/** Returns true if the request carries a valid fl_auth cookie. */
export function isAuthenticated(req: NextRequest): boolean {
  const token = req.cookies.get('fl_auth')?.value
  const expected = process.env.APP_PASSWORD
  return !!(token && expected && token === expected)
}
