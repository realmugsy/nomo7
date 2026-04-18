import { NextRequest, NextResponse } from 'next/server';

const getUtcDateString = () => {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function middleware(request: NextRequest) {
  const { nextUrl } = request;

  if (nextUrl.pathname === '/' && nextUrl.searchParams.get('mode') === 'daily') {
    const dateParam = nextUrl.searchParams.get('date');
    const date = dateParam && DATE_PATTERN.test(dateParam) ? dateParam : getUtcDateString();
    const url = nextUrl.clone();
    url.pathname = `/daily/${date}`;
    url.search = '';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/',
};
