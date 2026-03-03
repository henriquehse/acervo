import { NextRequest } from 'next/server';

export const runtime = 'edge';

// SSRF Protection - block private network access
const BLOCKED_HOSTS = /^(localhost|127\.\d+\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|192\.168\.\d+\.\d+|0\.0\.0\.0|\[::1\])/i;
function isUrlSafe(url: string): boolean {
    try {
        const parsed = new URL(url);
        if (!['http:', 'https:'].includes(parsed.protocol)) return false;
        if (BLOCKED_HOSTS.test(parsed.hostname)) return false;
        return true;
    } catch { return false; }
}

/**
 * Advanced IPTV Streaming Proxy - V2.3
 * Enhanced with SSRF protection and manual redirect handling for VOD
 */
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const targetUrl = searchParams.get('url')?.trim();

    if (!targetUrl || !targetUrl.startsWith('http') || !isUrlSafe(targetUrl)) {
        return new Response('Invalid or missing target URL', { status: 400 });
    }

    const range = request.headers.get('range');

    try {
        let currentUrl = targetUrl;
        let finalResponse: Response | null = null;
        let redirectCount = 0;
        const maxRedirects = 5;

        // Manual redirect handling to ensure headers like Range and User-Agent are preserved
        while (redirectCount < maxRedirects) {
            const parsedUrl = new URL(currentUrl);
            const headers: Record<string, string> = {
                'User-Agent': 'VLC/3.0.18 LibVLC/3.0.18',
                'Accept': '*/*',
                'Connection': 'keep-alive',
                'Referer': `${parsedUrl.protocol}//${parsedUrl.host}/`,
            };

            if (range) {
                headers['Range'] = range;
            }

            const response = await fetch(currentUrl, {
                headers,
                cache: 'no-store',
                redirect: 'manual' // We handle redirects manually
            });

            if (response.status >= 300 && response.status < 400) {
                const location = response.headers.get('location');
                if (!location) break;

                currentUrl = new URL(location, currentUrl).toString();
                redirectCount++;
                continue;
            }

            finalResponse = response;
            break;
        }

        if (!finalResponse) {
            return new Response('Failed to resolve URL chain', { status: 502 });
        }

        const contentType = finalResponse.headers.get('content-type') || '';
        const isM3U8 = contentType.includes('mpegurl') || contentType.includes('m3u8') || currentUrl.toLowerCase().split('?')[0].endsWith('.m3u8');

        // --- CASE 1: M3U8 Playlist (Recursive Proxying) ---
        if (isM3U8) {
            const text = await finalResponse.text();
            const baseUrl = finalResponse.url || currentUrl;

            const lines = text.split('\n');
            const newLines = lines.map(line => {
                const trimmed = line.trim();
                if (trimmed && !trimmed.startsWith('#')) {
                    try {
                        const absoluteUrl = new URL(trimmed, baseUrl).toString();
                        return `/api/iptv/stream?url=${encodeURIComponent(absoluteUrl)}`;
                    } catch {
                        return line;
                    }
                }
                return line;
            });

            return new Response(newLines.join('\n'), {
                headers: {
                    'Content-Type': 'application/vnd.apple.mpegurl',
                    'Access-Control-Allow-Origin': '*',
                    'Cache-Control': 'no-cache',
                },
            });
        }

        // --- CASE 2: VOD / Streaming Content ---
        const responseHeaders = new Headers();

        // Essential streaming headers to copy back to the client
        const headersToCopy = ['content-type', 'content-length', 'content-range', 'accept-ranges', 'cache-control', 'last-modified', 'etag'];
        headersToCopy.forEach(h => {
            const val = finalResponse?.headers.get(h);
            if (val) responseHeaders.set(h, val);
        });

        responseHeaders.set('Access-Control-Allow-Origin', '*');
        responseHeaders.set('Access-Control-Allow-Headers', '*');

        // Ensure seekability
        if (!responseHeaders.has('accept-ranges')) {
            responseHeaders.set('accept-ranges', 'bytes');
        }

        // Return the response body stream
        return new Response(finalResponse.body, {
            status: finalResponse.status,
            statusText: finalResponse.statusText,
            headers: responseHeaders,
        });

    } catch (error) {
        console.error('IPTV Stream Proxy Error:', error);
        return Response.redirect(targetUrl, 302);
    }
}
