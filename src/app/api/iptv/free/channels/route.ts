import { NextResponse } from 'next/server';

// Mapeamento de Categorias (Inglês -> Português)
const CATEGORY_MAP: Record<string, string> = {
    "Animation": "Desenhos & Animação",
    "Kids": "Infantil",
    "News": "Notícias",
    "General": "Variedades",
    "Sports": "Esportes",
    "Movies": "Filmes",
    "Series": "Séries",
    "Entertainment": "Entretenimento",
    "Documentary": "Documentários",
    "Music": "Música",
    "Education": "Educação",
    "Lifestyle": "Estilo de Vida",
    "Classic": "Clássicos",
    "Comedy": "Comédia",
    "Family": "Família",
    "Religious": "Religioso",
    "Legislative": "Governo",
    "Science": "Ciência",
    "Shop": "Vendas",
    "Weather": "Clima",
    "Auto": "Automotivo",
    "Business": "Negócios"
};

// Logomarcas Premium para Canais Free
const KNOWN_LOGOS: Record<string, string> = {
    "GLOBO": "https://logodownload.org/wp-content/uploads/2014/07/rede-globo-logo.png",
    "BAND": "https://logodownload.org/wp-content/uploads/2014/05/band-logo.png",
    "RECORD": "https://logodownload.org/wp-content/uploads/2014/04/record-news-logo.png",
    "CNN BRASIL": "https://logodownload.org/wp-content/uploads/2020/03/cnn-brasil-logo.png",
    "JOVEM PAN": "https://logodownload.org/wp-content/uploads/2021/10/jovem-pan-news-logo.png",
    "SBT": "https://logodownload.org/wp-content/uploads/2014/04/sbt-logo.png",
    "CULTURA": "https://logodownload.org/wp-content/uploads/2014/04/tv-cultura-logo.png",
    "REDETV": "https://upload.wikimedia.org/wikipedia/commons/8/89/RedeTV%21_logo_2019.png",
    "TV BRASIL": "https://upload.wikimedia.org/wikipedia/commons/3/3c/TV_Brasil.png",
    "PLUTO": "https://images.pluto.tv/channels/5f120f41b7d403000783a6da/colorLogoPNG.png"
};

// Canais Manuais de Elite (São Paulo + Nacionais)
const PREMIUM_CHANNELS = [
    { name: "Globo SP HD", logo: KNOWN_LOGOS["GLOBO"], group: "TV Aberta SP", url: "https://video-auth6.globo.com/live/745e9973-2391-49b0-9004-897db7541f92/playlist.m3u8" },
    { name: "TV Cultura HD", logo: KNOWN_LOGOS["CULTURA"], group: "TV Aberta SP", url: "https://player-tvcultura.stream.uol.com.br/live/tvcultura.m3u8" },
    { name: "Band SP HD", logo: KNOWN_LOGOS["BAND"], group: "TV Aberta SP", url: "https://evpp.mm.uol.com.br/band/band/playlist.m3u8" },
    { name: "Record News HD", logo: KNOWN_LOGOS["RECORD"], group: "Notícias", url: "https://c76c125d085942ce8f46028a2a16d5ba.mediatailor.us-east-1.amazonaws.com/v1/master/04fd91392606557876b5dc112027581752df85d8/R7_RecordNews_Main/playlist.m3u8" },
    { name: "CNN Brasil HD", logo: KNOWN_LOGOS["CNN BRASIL"], group: "Notícias", url: "https://video-auth6.globo.com/auth/v2/591/play/channel/cnn-brasil" },
    { name: "Jovem Pan News HD", logo: KNOWN_LOGOS["JOVEM PAN"], group: "Notícias", url: "https://d6yfbj4xxtrod.cloudfront.net/out/v1/7836eb391ec24452a0f43c8bb6c2b1e3/index.m3u8" },
    { name: "RedeTV! SP", logo: KNOWN_LOGOS["REDETV"], group: "TV Aberta SP", url: "https://evpp.mm.uol.com.br/redetv/redetv/playlist.m3u8" },
    { name: "TV Brasil HD", logo: KNOWN_LOGOS["TV BRASIL"], group: "TV Aberta SP", url: "https://stream-03.nyc.dailymotion.com/sec(IP18EyeSZgq4bVuL0GGDhgpd3FjyMYKI3XGVV_WXaHg)/dm/3/x8a07iy/s/live-3.m3u8" },
];

// Fontes M3U Públicas (Brasil + Pluto TV + FAST)
const M3U_SOURCES = [
    { url: "https://iptv-org.github.io/iptv/countries/br.m3u", tag: "Brasil" },
    { url: "https://i.mjh.nz/PlutoTV/all.m3u8", tag: "Pluto TV" },
    { url: "https://raw.githubusercontent.com/Free-TV/IPTV/master/playlists/playlist_brazil.m3u8", tag: "Free-TV Brasil" },
];

// Blacklist
const BLACKLIST = ["Adesso TV", "Amazon Sat", "Red Bull TV"];

function cleanCategory(rawCat: string | null): string {
    if (!rawCat) return "Outros";
    const firstPart = rawCat.split(';')[0].trim();
    return CATEGORY_MAP[firstPart] || firstPart;
}

interface FreeChannel {
    name: string;
    stream_icon?: string;
    category_id: string;
    direct_url: string;
    stream_id: string;
}

function parseM3U(content: string, sourceTag: string = "General"): FreeChannel[] {
    const channels: FreeChannel[] = [];
    const lines = content.split('\n');
    let currentChannel: Partial<FreeChannel> = {};

    for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line) continue;

        if (line.startsWith("#EXTINF:")) {
            currentChannel = {};
            const logoMatch = line.match(/tvg-logo="([^"]+)"/);
            const groupMatch = line.match(/group-title="([^"]+)"/);
            const nameMatch = line.match(/,(.*)$/);

            const name = nameMatch ? nameMatch[1].trim() : "Unknown Channel";

            // Blacklist
            if (BLACKLIST.some(b => name.includes(b))) continue;

            currentChannel.name = name;

            // Logo
            let logo = logoMatch ? logoMatch[1] : "";
            const nameUp = name.toUpperCase();
            for (const [kname, klogo] of Object.entries(KNOWN_LOGOS)) {
                if (nameUp.includes(kname)) {
                    logo = klogo;
                    break;
                }
            }
            if (logo) currentChannel.stream_icon = logo;

            // Categoria
            if (sourceTag.toUpperCase().includes("PLUTO")) {
                currentChannel.category_id = "Pluto TV";
            } else if (groupMatch) {
                currentChannel.category_id = cleanCategory(groupMatch[1]);
            } else {
                currentChannel.category_id = sourceTag;
            }
        } else if (!line.startsWith("#")) {
            if (currentChannel.name) {
                currentChannel.direct_url = line;
                currentChannel.stream_id = line;
                channels.push(currentChannel as FreeChannel);
                currentChannel = {};
            }
        }
    }
    return channels;
}

async function fetchM3U(url: string, tag: string): Promise<FreeChannel[]> {
    try {
        const res = await fetch(url, { next: { revalidate: 3600 } });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const text = await res.text();
        return parseM3U(text, tag);
    } catch (e) {
        console.error(`Failed to fetch ${tag}:`, e);
        return [];
    }
}

export async function GET() {
    const allChannels: FreeChannel[] = [];

    // Inject premium channels FIRST (highest priority)
    for (const ch of PREMIUM_CHANNELS) {
        allChannels.push({
            name: ch.name,
            stream_icon: ch.logo,
            category_id: ch.group,
            direct_url: ch.url,
            stream_id: ch.url
        });
    }

    // Fetch M3U from multiple sources in parallel
    try {
        const results = await Promise.allSettled(
            M3U_SOURCES.map(source => fetchM3U(source.url, source.tag))
        );

        for (const result of results) {
            if (result.status === 'fulfilled' && Array.isArray(result.value)) {
                allChannels.push(...result.value);
            }
        }

        // Deduplicate by URL
        const seenUrls = new Set<string>();
        const uniqueChannels: FreeChannel[] = [];
        for (const ch of allChannels) {
            if (ch.direct_url && !seenUrls.has(ch.direct_url)) {
                seenUrls.add(ch.direct_url);
                uniqueChannels.push(ch);
            }
        }

        console.log(`✅ Total Free Channels: ${uniqueChannels.length}`);
        return NextResponse.json(uniqueChannels);

    } catch (e) {
        console.error(`❌ Critical Error:`, e);
        // Fallback - return only premium channels
        return NextResponse.json(allChannels.slice(0, PREMIUM_CHANNELS.length));
    }
}
