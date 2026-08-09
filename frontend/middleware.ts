// next-intl uses a cookie-based locale approach (no URL prefix needed)
// The middleware is a passthrough — locale is resolved in i18n.ts from cookie
export default function middleware() {
  // No-op: locale switching is handled via cookie in i18n.ts
}

export const config = {
  matcher: ['/((?!_next|.*\\..*).*)'],
};
