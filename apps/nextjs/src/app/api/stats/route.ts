import { NextResponse } from 'next/server'

// Streaming 데모용 — 인위적 지연으로 Suspense fallback이 보이도록
const SIMULATED_LATENCY_MS = 1500

export const dynamic = 'force-dynamic'

export async function GET() {
  await new Promise((resolve) => setTimeout(resolve, SIMULATED_LATENCY_MS))
  return NextResponse.json({ uptime: 12345, requestsPerMin: 42 })
}
