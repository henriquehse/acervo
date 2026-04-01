import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy for IPTV API calls (login, playlists, etc.)
 * Secured with URL validation to prevent SSRF attacks
 */

// Block internal/private network access
const BLOCKED_PATTERNS = [
    /^https?:\/\/(localhost|127\.\d+\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|192\.168\.\d+\.\d+)/i,
    /^https?:\/\/\[::1\]/i,
    /^https?:\/\/0\.0\.0\.0/i,
    /^file:/i,
    /^ftp:/i,
];

function isUrlSafe(url: string): boolean {
    try {
        const parsed = new URL(url);
        // Only allow http/https
        if (!['http:', 'https:'].includes(parsed.protocol)) return false;
        // Block private network ranges
        for (const pattern of BLOCKED_PATTERNS) {
            if (pattern.test(url)) return false;
        }
        return true;
    } catch {
        return false;
    }
}

// Use Node.js runtime for large file support and standard fetch behavior
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const targetUrl = searchParams.get('url');

    if (!targetUrl) {
        return NextResponse.json({ error: 'Missing target URL' }, { status: 400 });
    }

    if (!isUrlSafe(targetUrl)) {
        return NextResponse.json({ error: 'URL not allowed' }, { status: 403 });
    }

    try {
        const response = await fetch(targetUrl, {
            headers: {
                'User-Agent': 'IPTVSmartersPlayer',
                'Accept': '*/*',
                'Connection': 'keep-alive'
            },
            redirect: 'follow',
        });

        const contentType = response.headers.get('content-type') || '';
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        };

        if (contentType.includes('application/json') || contentType.includes('application/octet-stream')) {
            try {
                const data = await response.json();
                return NextResponse.json(data, { headers: corsHeaders });
            } catch {
                // If JSON parsing fails, fall back to text
                const text = await response.text();
                return new Response(text, {
                    status: 200,
                    headers: {
                        ...corsHeaders,
                        'Content-Type': contentType || 'text/plain',
                    },
                });
            }
        } else {
            const text = await response.text();
            return new Response(text, {
                status: 200,
                headers: {
                    ...corsHeaders,
                    'Content-Type': contentType || 'text/plain',
                },
            });
        }
    } catch (error) {
        console.error('IPTV Proxy Error:', error);
        return NextResponse.json({
            error: 'Failed to fetch from IPTV provider.',
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}
