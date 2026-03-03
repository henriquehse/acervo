/**
 * Acervo Premium — Centralized Configuration
 * All API endpoints and external service URLs should be referenced from here.
 */

// Backend API base URL (Python server)
export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

// Google OAuth Client ID
export const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '351584138983-2o8qeper7rh96n64bgk2rr6lijv98ao1.apps.googleusercontent.com';

// Google OAuth Scopes
export const GOOGLE_SCOPES = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/youtube.readonly';

// IPTV Proxy — Allowed domain patterns (SSRF protection)
export const IPTV_ALLOWED_PATTERNS = [
    /^https?:\/\/.*\.(m3u8|ts|mp4|mkv)/i,
    /^https?:\/\//,
];

// App Version
export const APP_VERSION = '3.0';
