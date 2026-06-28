import { NextResponse, type NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  try {
    const token = request.cookies.get("portal_token")?.value
    const { pathname } = request.nextUrl

    const publicPaths = ["/login", "/signup"]
    const isPublic = publicPaths.some(p => pathname.startsWith(p))

    if (!token && !isPublic) {
      const loginUrl = new URL("/login", request.url)
      return NextResponse.redirect(loginUrl)
    }

    if (token && isPublic) {
      const homeUrl = new URL("/", request.url)
      return NextResponse.redirect(homeUrl)
    }

    return NextResponse.next()
  } catch {
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api|.*\\.png$|.*\\.svg$|.*\\.jpg$).*)",
  ],
}