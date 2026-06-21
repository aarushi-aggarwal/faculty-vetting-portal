import { NextResponse, type NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const token = request.cookies.get("portal_token")?.value
  const { pathname } = request.nextUrl

  const publicPaths = ["/login", "/signup"]

  if (!token && !publicPaths.includes(pathname)) {
    const loginUrl = new URL("/login", request.url)
    return NextResponse.redirect(loginUrl)
  }

  if (token && publicPaths.includes(pathname)) {
    const homeUrl = new URL("/", request.url)
    return NextResponse.redirect(homeUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$|.*\\.jpg$).*)"],
}
