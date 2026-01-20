import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Exclude: api, _next, _vercel, __ (Firebase auth), and files with extensions
  matcher: ['/((?!api|_next|_vercel|__|.*\\..*).*)'
]
};
