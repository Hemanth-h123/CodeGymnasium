import { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

async function handler(req: NextRequest, params: { path: string[] }) {
  const urlBase = process.env.CONTENT_SERVICE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
  const target = `${urlBase}/api/content/${(params.path || []).join('/')}`
  const init: RequestInit = {
    method: req.method,
    headers: { 'Content-Type': req.headers.get('content-type') || 'application/json' },
    body: req.method === 'GET' || req.method === 'HEAD' ? undefined : await req.text()
  }
  try {
    const res = await fetch(target, init)
    const text = await res.text()
    return new Response(text, { status: res.status, headers: { 'Content-Type': res.headers.get('content-type') || 'application/json' } })
  } catch {
    return new Response(JSON.stringify({ message: 'Upstream unavailable' }), { status: 502, headers: { 'Content-Type': 'application/json' } })
  }
}

export async function GET(req: NextRequest, { params }: { params: { path: string[] } }) { return handler(req, params) }
export async function POST(req: NextRequest, { params }: { params: { path: string[] } }) { return handler(req, params) }
export async function PUT(req: NextRequest, { params }: { params: { path: string[] } }) { return handler(req, params) }
export async function PATCH(req: NextRequest, { params }: { params: { path: string[] } }) { return handler(req, params) }
export async function DELETE(req: NextRequest, { params }: { params: { path: string[] } }) { return handler(req, params) }
export async function OPTIONS(req: NextRequest, { params }: { params: { path: string[] } }) { return handler(req, params) }
