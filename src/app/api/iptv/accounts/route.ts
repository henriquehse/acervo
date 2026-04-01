import { NextResponse } from 'next/server';

/**
 * IPTV Account Vault API
 * Self-contained account pool with auto-failover support.
 * Ported from Bunker's vault system.
 */

interface IPTVAccount {
    host: string;
    user: string;
    pass: string;
    status: string;
    exp: string;
    exp_ts: number;
    tier: string;
    source: string;
}

// --- EMBEDDED VAULT (from Bunker's iptv_vault.json + iptv_top.json) ---
// These are the verified, high-priority accounts
const PREMIUM_ACCOUNTS = [
    { h: "http://vellaris.top", u: "281318341", p: "378355648", exp: "1818298799" },
    { h: "http://7tvgols.link:80", u: "234567654", p: "2345643", exp: "1801688760" },
    { h: "http://7tvgols.link:80", u: "9882848144", p: "988284Bagtts", exp: "1782529199" },
    { h: "http://7tvgols.link:80", u: "34545yu", p: "5656756", exp: "1781203020" },
    { h: "http://7tvgols.link:80", u: "556293614871", p: "766789067", exp: "1778881680" },
];

const VAULT_ACCOUNTS = [
    { host: "http://vellaris.top", user: "281318341", pass: "378355648", exp: "1818298799" },
    { host: "http://cazuza.cc", user: "Aquiles2", pass: "Aq96788998", exp: "1777345199" },
    { host: "http://rede.tvno.site", user: "heitorteste2", pass: "Ht9910621212", exp: "1774569599" },
    { host: "http://7tvgols.link:80", user: "234567654", pass: "2345643", exp: "1801688760" },
    { host: "http://dnscine.top:80", user: "229752473", pass: "816597864", exp: "1789181999" },
    { host: "http://bigcrytop.com:80", user: "RuiBatistaFN12", pass: "KJitpcsMp7", exp: "1780422558" },
    { host: "http://gsatvclb.com:80", user: "mwgeG5PuG", pass: "tuU61S", exp: "1780714799" },
];

function formatExpiry(expTs: number): string {
    if (!expTs || expTs <= 0) return "N/A";
    try {
        const d = new Date(expTs * 1000);
        return d.toLocaleDateString('pt-BR');
    } catch {
        return "N/A";
    }
}

export async function GET() {
    const accounts: IPTVAccount[] = [];
    const seen = new Set<string>();

    // Process Premium
    for (const item of PREMIUM_ACCOUNTS) {
        const key = `${item.h}|${item.u}`;
        if (seen.has(key)) continue;
        seen.add(key);

        const expTs = parseInt(item.exp) || 0;
        accounts.push({
            host: item.h,
            user: item.u,
            pass: item.p,
            status: "Active",
            exp: formatExpiry(expTs),
            exp_ts: expTs,
            tier: "Premium Top",
            source: "Premium"
        });
    }

    // Process Vault
    for (const item of VAULT_ACCOUNTS) {
        const key = `${item.host}|${item.user}`;
        if (seen.has(key)) continue;
        seen.add(key);

        const expTs = parseInt(item.exp) || 0;
        const isPremium = expTs > 1773014400; // Expiring late 2026+
        accounts.push({
            host: item.host,
            user: item.user,
            pass: item.pass,
            status: "Active",
            exp: formatExpiry(expTs),
            exp_ts: expTs,
            tier: isPremium ? "Premium Top" : "Sobrevivência",
            source: "Vault"
        });
    }

    // Sort by Expiry Timestamp (descending) - longest expiry first
    accounts.sort((a, b) => b.exp_ts - a.exp_ts);

    return NextResponse.json(accounts);
}
