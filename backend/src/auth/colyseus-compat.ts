// Compatibility layer for Lucia Auth with Node.js HTTP Request/Response
import { IncomingMessage, ServerResponse } from 'http'

// Create Express-compatible request object for Lucia
export function createExpressRequest(request: IncomingMessage): any {
  const cookieHeader = request.headers.cookie || ''
  const cookies = parseCookieHeader(cookieHeader)
  
  return {
    headers: {
      cookie: cookieHeader
    },
    cookies
  }
}

// Create Express-compatible response object for Lucia
export function createExpressResponse(): any {
  const headers: Record<string, string> = {}
  
  return {
    setHeader: (name: string, value: string) => {
      headers[name] = value
    },
    getHeaders: () => headers,
    headers
  }
}

// Parse cookie header into object
function parseCookieHeader(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {}
  
  if (!cookieHeader) return cookies
  
  cookieHeader.split(';').forEach(cookie => {
    const [name, ...rest] = cookie.trim().split('=')
    if (name && rest.length > 0) {
      cookies[name] = rest.join('=')
    }
  })
  
  return cookies
}

// Apply response headers to Node.js ServerResponse
export function applyResponseHeaders(expressRes: any, nodeResponse: ServerResponse): void {
  const headers = expressRes.getHeaders()
  
  Object.entries(headers).forEach(([name, value]) => {
    nodeResponse.setHeader(name, value as string)
  })
}