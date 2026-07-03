import { NextRequest, NextResponse } from 'next/server';

/**
 * Server-side proxy for the Helium Health sandbox demo. Holds the sandbox
 * API key here (never sent to the browser) and forwards the request body
 * to the real /api/v1/optimize endpoint — mirroring how HeliumOS's own
 * backend would call us: their frontend never sees the key either.
 */

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'https://intellign.up.railway.app').replace(/\/$/, '');
const SANDBOX_KEY = process.env.HELIUM_SANDBOX_API_KEY || '';

export async function POST(req: NextRequest) {
    if (!SANDBOX_KEY) {
        return NextResponse.json({ detail: 'Sandbox key not configured on the server.' }, { status: 500 });
    }

    let body: unknown;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ detail: 'Invalid JSON body.' }, { status: 400 });
    }

    try {
        const upstream = await fetch(`${API_URL}/api/v1/optimize`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `ApiKey ${SANDBOX_KEY}`,
            },
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(60_000),
        });
        const data = await upstream.json();
        return NextResponse.json(data, { status: upstream.status });
    } catch (err) {
        return NextResponse.json(
            { detail: `Upstream call failed: ${err instanceof Error ? err.message : 'unknown error'}` },
            { status: 502 },
        );
    }
}
