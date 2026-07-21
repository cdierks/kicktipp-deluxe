import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware() {
    // Authorization is resolved from the database by protected pages/actions.
    // Middleware only verifies authentication because JWT role claims can lag
    // behind an administrator's role change.
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  },
)

export const config = {
  matcher: [
    // Public assets must remain reachable for login, favicons and PWA install.
    '/((?!login|registrieren|api/auth|api/sync|_next/static|_next/image|.*\\..*).*)',
  ],
}
