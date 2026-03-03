"use client";

import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { BookOpen, Folder, Disc, FileText, ChevronRight, ChevronLeft, ChevronUp, ChevronDown, X, Loader2, Play, Pause, SkipBack, SkipForward, Search, Tv, Library, Settings, Volume2, VolumeX, Moon, Sun, Clock, Bookmark, ListMusic, Trash2, RefreshCw, Headphones } from "lucide-react";
import { PremiumHub } from "@/components/layout/PremiumHub";
import { GOOGLE_CLIENT_ID, GOOGLE_SCOPES, APP_VERSION } from "@/lib/config";



import { motion, AnimatePresence } from "framer-motion";


type User = { name: string; picture: string };
type FileItem = { id: string; name: string; mimeType: string; thumbnailLink?: string; webViewLink?: string };
type Breadcrumb = { id: string; name: string };
type VideoItem = { id: string; title: string; thumbnail: string; channel: string; publishedAt: string };
type BookmarkItem = { id: string; audioId: string; audioName: string; position: number; label: string; createdAt: string };
type RecentPlay = { id: string; name: string; thumbnailLink?: string; position: number; duration: number; lastPlayed: string };

const CLIENT_ID = GOOGLE_CLIENT_ID;
const SCOPES = GOOGLE_SCOPES;

// Topics that use the independent ambient sound layer
const AMBIENT_TOPICS = ['ambiente', 'cura'];
declare global { interface Window { google: any } }

const PLAYLISTS = [
  { key: "liked", label: "Curtidos", icon: "❤️", queries: [] as string[] },
  { key: "estoicismo", label: "Estoicismo", icon: "🏛️", queries: ["estoicismo filosofia", "marco aurelio meditações", "estoico motivação", "ryan holiday estoicismo pt", "seneca cartas"] },
  { key: "disciplina", label: "Disciplina", icon: "⚔️", queries: ["disciplina militar", "motivação guerreiro", "david goggins legendado", "mentalidade de ferro", "forjar o caráter"] },
  { key: "foco", label: "Foco", icon: "🎯", queries: ["deep work", "como ter foco", "produtividade extrema", "eliminar distrações", "neurociência do foco", "huberman lab foco legendado"] },
  { key: "redpill", label: "RedPill", icon: "💊", queries: ["desenvolvimento masculino", "masculinidade alfa", "homem de alto valor", "comportamento masculino", "Dr Lair Ribeiro"] },
  { key: "pnl", label: "PNL", icon: "🧬", queries: ["programação neurolinguística", "persuasão e influência", "tony robbins legendado", "gatilhos mentais", "linguagem corporal"] },
  { key: "exercicios", label: "Exercícios", icon: "🏋️", queries: ["treino calistenia", "hipertrofia", "treino militar em casa", "chris bumstead legendado", "fisiologia do exercício"] },
  { key: "educacao", label: "Educação", icon: "📚", queries: ["inteligência artificial educação", "automação chatgpt", "futuro do trabalho", "ferramentas de IA", "como aprender mais rápido"] },
  {
    key: "ingles", label: "Inglês", icon: "🇺🇸", queries: [
      "speak english with tiffani", "englishclass101", "rachel's english",
      "speak english with vanessa", "learn english with bob the canadian",
      "native english podcast", "luke's english podcast", "all ears english podcast"
    ]
  },
  { key: "dieta", label: "Dieta da Selva", icon: "🥩", queries: ["dieta carnívora", "alimentação ancestral", "paul saladino legendado", "jejum intermitente", "saúde metabólica"] },
  { key: "mindset", label: "Mindset", icon: "🧠", queries: ["mindset de crescimento", "mente milionária", "reprogramação mental", "frequência positiva", "poder do subconsciente"] },
  { key: "maquiavel", label: "Maquiavel", icon: "♟️", queries: ["nicolau maquiavel livro", "48 leis do poder", "arte da guerra sun tzu", "estratégia maquiavélica", "robert greene pt"] },
  { key: "cura", label: "Cura Mental", icon: "✨", queries: ["frequência 528hz", "meditação guiada cura", "limpeza energética", "solfeggio frequencies", "binaural beats focus"] },
  {
    key: "ambiente", label: "Música Ambiente", icon: "🌧️", queries: [
      "lofi hip hop radio relax", "jazz relaxing background music", "blues background focus",
      "cafe bossa nova jazz", "binaural beats reading focus", "chuva e lareira reading",
      "classic music for reading", "dark academia classical"
    ]
  },
  { key: "podcasts", label: "Podcasts", icon: "🎙️", queries: ["podcast huberman lab legendado | lex fridman legendado", "joe rogan legendado | podcast flow", "inteligencia ltda | podcast desenvolvimento pessoal"] },
  { key: "ai", label: "IA Recomenda", icon: "🤖", queries: [] as string[] },
];

const gradients = [
  "linear-gradient(135deg, #2D1B00 0%, #5C3D1E 50%, #1A0F00 100%)",
  "linear-gradient(135deg, #1A1A2E 0%, #16213E 50%, #0F3460 100%)",
  "linear-gradient(135deg, #0D0D0D 0%, #1A1A1A 50%, #2D2D2D 100%)",
  "linear-gradient(135deg, #1B0A2E 0%, #2D1854 50%, #0D0520 100%)",
  "linear-gradient(135deg, #0A1628 0%, #1B2D45 50%, #0A1628 100%)",
  "linear-gradient(135deg, #1C1C1C 0%, #383838 50%, #1C1C1C 100%)",
];
const getGradient = (name: string) => { let s = 0; for (let i = 0; i < name.length; i++) s += name.charCodeAt(i); return gradients[s % gradients.length]; };
const isAudioFile = (item: FileItem) => item.mimeType.includes("audio") || /\.(mp3|m4a|ogg|wav|flac)$/i.test(item.name);
const isImageFile = (f: any) => f.mimeType?.includes("image");
const fmt = (s: number) => { if (isNaN(s)) return "0:00"; const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = Math.floor(s % 60); return h > 0 ? `${h}:${m < 10 ? "0" : ""}${m}:${sec < 10 ? "0" : ""}${sec}` : `${m}:${sec < 10 ? "0" : ""}${sec}`; };
const fmtTimer = (min: number) => min >= 60 ? `${Math.floor(min / 60)}h ${min % 60 > 0 ? `${min % 60}min` : ""}` : `${min}min`;
const timeAgo = (d: string) => { const diff = (Date.now() - new Date(d).getTime()) / 1000; if (diff < 3600) return `${Math.floor(diff / 60)}min`; if (diff < 86400) return `${Math.floor(diff / 3600)}h`; if (diff < 2592000) return `${Math.floor(diff / 86400)}d`; return `${Math.floor(diff / 2592000)}m`; };

export default function Home() {
  // Auth

  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  // Theme
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  // Tabs
  const [activeTab, setActiveTab] = useState<"library" | "videos">("library");
  // Library
  const [loading, setLoading] = useState(false);
  const [crumbs, setCrumbs] = useState<Breadcrumb[]>([{ id: "root_home", name: "Acervo" }]);
  const [allItems, setAllItems] = useState<FileItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [previewItem, setPreviewItem] = useState<FileItem | null>(null);
  // Audio Player
  const [audioItem, setAudioItem] = useState<FileItem | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [prog, setProg] = useState(0);
  const [dur, setDur] = useState(0);
  const [rate, setRate] = useState(1);
  const [audioLoading, setAudioLoading] = useState(false);
  const [playerOpen, setPlayerOpen] = useState(false);
  const [volume, setVolumeState] = useState(1);
  const [showVol, setShowVol] = useState(false);
  const [skipSec, setSkipSec] = useState(15);
  // Sleep Timer
  const [sleepEnd, setSleepEnd] = useState<number | null>(null);
  const [sleepLeft, setSleepLeft] = useState(0);
  const [showSleep, setShowSleep] = useState(false);
  // Queue
  const [audioQueue, setAudioQueue] = useState<FileItem[]>([]);
  const [showQueue, setShowQueue] = useState(false);
  // Bookmarks
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [recentPlays, setRecentPlays] = useState<RecentPlay[]>([]);
  // YouTube
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [videosLoading, setVideosLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeTopic, setActiveTopic] = useState("liked");
  const [videoSearch, setVideoSearch] = useState("");

  // Settings
  const [showSettings, setShowSettings] = useState(false);
  const [settingsPinOpen, setSettingsPinOpen] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [savedPin, setSavedPin] = useState("0000");
  const [newPin, setNewPin] = useState("");
  const [isAuthenticatedSettings, setIsAuthenticatedSettings] = useState(false);
  const [apiKeys, setApiKeys] = useState({ groq: "", cerebras: "", mistral: "", google: "", yt2: "", yt3: "" });
  const [aiLoading, setAiLoading] = useState(false);
  const [playingVideo, setPlayingVideo] = useState<VideoItem | null>(null);
  const [playingVideoIsPlaying, setPlayingVideoIsPlaying] = useState(true);
  const playingVideoRef = useRef<HTMLIFrameElement>(null);
  useEffect(() => {
    if (playingVideoRef.current?.contentWindow) {
      playingVideoRef.current.contentWindow.postMessage(JSON.stringify({ event: 'command', func: playingVideoIsPlaying ? 'playVideo' : 'pauseVideo', args: [] }), '*');
    }
  }, [playingVideoIsPlaying]);

  const [videoPlayerOpen, setVideoPlayerOpen] = useState(false);
  const [videoError, setVideoError] = useState("");
  const [syncingCloud, setSyncingCloud] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [showToTop, setShowToTop] = useState(false);

  // Rotation System for Secondary YouTube Keys (Persistent)
  const secondaryKeyIndexRef = useRef(0);
  const secondaryKeysRef = useRef([apiKeys.yt2, apiKeys.yt3]);
  useEffect(() => {
    secondaryKeysRef.current = [apiKeys.yt2, apiKeys.yt3];
  }, [apiKeys.yt2, apiKeys.yt3]);

  // Sync Timer for Auto-Save
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const triggerCloudSync = useCallback(() => {
    if (!token) return;
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = setTimeout(() => syncWithCloud(token, true), 5000);
  }, [token]);

  // Ambient Player State
  const [ambientVideo, setAmbientVideo] = useState<VideoItem | null>(null);
  const [ambientPlaying, setAmbientPlaying] = useState(true);
  const [ambientVol, setAmbientVol] = useState(50);
  const ambientPlayerRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (ambientPlayerRef.current?.contentWindow) {
      ambientPlayerRef.current.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'setVolume', args: [ambientVol] }), '*');
    }
  }, [ambientVol, ambientVideo]);

  useEffect(() => {
    if (ambientPlayerRef.current?.contentWindow) {
      ambientPlayerRef.current.contentWindow.postMessage(JSON.stringify({ event: 'command', func: ambientPlaying ? 'playVideo' : 'pauseVideo', args: [] }), '*');
    }
  }, [ambientPlaying]);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const tcRef = useRef<any>(null);
  const ytCacheRef = useRef<Record<string, VideoItem[]>>({});
  const ytPageTokenRef = useRef<Record<string, string>>({});
  const ytQueryIndexRef = useRef<Record<string, number>>({});
  const loaderRef = useRef<HTMLDivElement>(null);

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return allItems;
    const q = searchQuery.toLowerCase();
    return allItems.filter(item => item.name.toLowerCase().includes(q));
  }, [allItems, searchQuery]);

  const filteredVideos = useMemo(() => {
    if (!videoSearch.trim()) return videos;
    const q = videoSearch.toLowerCase();
    return videos.filter(v => v.title.toLowerCase().includes(q) || v.channel.toLowerCase().includes(q));
  }, [videos, videoSearch]);

  const currentBookmarks = useMemo(() => audioItem ? bookmarks.filter(b => b.audioId === audioItem.id).sort((a, b) => a.position - b.position) : [], [bookmarks, audioItem]);

  // ═══ Init ═══
  useEffect(() => {
    const t = localStorage.getItem("acervo_theme") as "dark" | "light" | null;
    if (t) setTheme(t);
    const bm = localStorage.getItem("acervo_bookmarks");
    if (bm) try { setBookmarks(JSON.parse(bm)); } catch { }
    const rc = localStorage.getItem("acervo_recents");
    if (rc) try { setRecentPlays(JSON.parse(rc)); } catch { }
    const sk = localStorage.getItem("acervo_skip");
    if (sk) setSkipSec(parseInt(sk) || 15);
    const ak = localStorage.getItem("acervo_apikeys");
    if (ak) try { setApiKeys(JSON.parse(ak)); } catch { }
    // Migrate old aiKey if exists
    const oldAk = localStorage.getItem("acervo_aikey");
    if (oldAk && !ak) { setApiKeys(prev => ({ ...prev, groq: oldAk })); }
    const p = localStorage.getItem("acervo_pin");
    if (p) setSavedPin(p);
  }, []);

  useEffect(() => { document.documentElement.setAttribute("data-theme", theme); localStorage.setItem("acervo_theme", theme); }, [theme]);
  useEffect(() => { localStorage.setItem("acervo_apikeys", JSON.stringify(apiKeys)); triggerCloudSync(); }, [apiKeys, triggerCloudSync]);

  // ═══ Auth ═══
  const saveSession = (tk: string, u: User) => {
    try { localStorage.setItem("acervo_token", tk); localStorage.setItem("acervo_user", JSON.stringify(u)); localStorage.setItem("acervo_ts", Date.now().toString()); } catch { }
  };

  useEffect(() => {
    try {
      const t = localStorage.getItem("acervo_token"), u = localStorage.getItem("acervo_user"), ts = localStorage.getItem("acervo_ts");
      if (t && u && ts && Date.now() - parseInt(ts) < 50 * 60 * 1000) { setToken(t); setUser(JSON.parse(u)); }
    } catch { }
    const iv = setInterval(() => {
      if (window?.google) {
        clearInterval(iv);
        tcRef.current = window.google.accounts.oauth2.initTokenClient({
          client_id: CLIENT_ID, scope: SCOPES,
          callback: (r: any) => {
            if (r.error) { setAuthLoading(false); return; }
            setToken(r.access_token);
            syncWithCloud(r.access_token);
            fetch("https://www.googleapis.com/oauth2/v3/userinfo", { headers: { Authorization: `Bearer ${r.access_token}` } })
              .then(res => res.json()).then(d => { const u = { name: d.name || "Leitor", picture: d.picture || "" }; setUser(u); saveSession(r.access_token, u); });
          },
        });
        const ts = localStorage.getItem("acervo_ts");
        if (localStorage.getItem("acervo_token") && ts && Date.now() - parseInt(ts) >= 50 * 60 * 1000) {
          try { tcRef.current.requestAccessToken({ prompt: "" }); } catch { }
        }
      }
    }, 400);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => { if (token) fetchFolder(crumbs[crumbs.length - 1].id, token); }, [token, crumbs]);
  const login = () => { if (!tcRef.current) return; setAuthLoading(true); tcRef.current.requestAccessToken({ prompt: "consent" }); };

  // ═══ Save Progress ═══
  useEffect(() => {
    if (!audioItem || !audioRef.current) return;
    const interval = setInterval(() => {
      if (audioRef.current && audioItem && audioRef.current.currentTime > 0) {
        const rp: RecentPlay = { id: audioItem.id, name: audioItem.name, thumbnailLink: audioItem.thumbnailLink, position: audioRef.current.currentTime, duration: audioRef.current.duration || 0, lastPlayed: new Date().toISOString() };
        setRecentPlays(prev => { const f = prev.filter(r => r.id !== audioItem.id); const n = [rp, ...f].slice(0, 20); localStorage.setItem("acervo_recents", JSON.stringify(n)); return n; });
        localStorage.setItem(`acervo_pos_${audioItem.id}`, audioRef.current.currentTime.toString());
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [audioItem]);

  // ═══ Sleep Timer ═══
  useEffect(() => {
    if (!sleepEnd) return;
    const iv = setInterval(() => {
      const rem = Math.max(0, sleepEnd - Date.now());
      setSleepLeft(Math.ceil(rem / 60000));
      if (rem <= 0) { audioRef.current?.pause(); setPlaying(false); setSleepEnd(null); setSleepLeft(0); }
    }, 1000);
    return () => clearInterval(iv);
  }, [sleepEnd]);

  // ═══ Media Session API ═══
  useEffect(() => {
    if (!("mediaSession" in navigator) || !audioItem) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: audioItem.name.replace(/\.(mp3|m4a|ogg|wav|flac)$/i, ""),
      artist: "Acervo Premium",
      album: "Audiobook",
      artwork: audioItem.thumbnailLink ? [{ src: audioItem.thumbnailLink, sizes: "512x512", type: "image/jpeg" }] : [],
    });
  }, [audioItem]);

  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    navigator.mediaSession.setActionHandler("play", () => { audioRef.current?.play(); setPlaying(true); });
    navigator.mediaSession.setActionHandler("pause", () => { audioRef.current?.pause(); setPlaying(false); });
    navigator.mediaSession.setActionHandler("seekbackward", () => skip(-skipSec));
    navigator.mediaSession.setActionHandler("seekforward", () => skip(skipSec));
    navigator.mediaSession.setActionHandler("nexttrack", () => playNext());
    navigator.mediaSession.setActionHandler("previoustrack", () => skip(-30));
  }, [playing, skipSec]);

  // ═══ Scroll To Top Focus ═══
  useEffect(() => {
    const handleScroll = () => setShowToTop(window.scrollY > 400);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ═══ Cloud Sync logic ═══
  const syncWithCloud = async (tk: string, forceUpload = false) => {
    if (!tk || syncingCloud) return;
    setSyncingCloud(true);
    const h = { Authorization: `Bearer ${tk}`, "Content-Type": "application/json" };
    try {
      // 1. Find the file
      const searchRes = await (await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent("name='acervo-db.json' and trashed=false")}&spaces=drive`, { headers: h })).json();
      const fileId = searchRes.files?.[0]?.id;
      let cloudData: any = null;

      if (fileId) {
        // 2. Download cloud data
        cloudData = await (await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, { headers: h })).json();
      }

      // 3. Prepare local state
      const localData = {
        bookmarks: JSON.parse(localStorage.getItem("acervo_bookmarks") || "[]"),
        recents: JSON.parse(localStorage.getItem("acervo_recents") || "[]"),
        apiKeys: JSON.parse(localStorage.getItem("acervo_apikeys") || '{"groq":"","cerebras":"","mistral":"","google":"","yt2":"","yt3":""}'),
        settings: {
          skipSec: parseInt(localStorage.getItem("acervo_skip") || "30"),
          theme: localStorage.getItem("acervo_theme") || "dark"
        },
        updatedAt: new Date().toISOString()
      };

      let merged = localData;
      if (cloudData && !forceUpload) {
        // Basic merge: prioritize newer data based on updatedAt (simplified)
        const cloudTs = new Date(cloudData.updatedAt || 0).getTime();
        const localTs = new Date(localData.updatedAt || 0).getTime();

        if (cloudTs > localTs) {
          merged = cloudData;
          // Apply cloud to local
          localStorage.setItem("acervo_bookmarks", JSON.stringify(merged.bookmarks));
          localStorage.setItem("acervo_recents", JSON.stringify(merged.recents));
          localStorage.setItem("acervo_apikeys", JSON.stringify(merged.apiKeys));
          localStorage.setItem("acervo_skip", merged.settings.skipSec.toString());
          localStorage.setItem("acervo_theme", merged.settings.theme);

          setBookmarks(merged.bookmarks);
          setRecentPlays(merged.recents);
          setApiKeys(merged.apiKeys);
          setSkipSec(merged.settings.skipSec);
          if (merged.settings.theme === "dark" || merged.settings.theme === "light") {
            setTheme(merged.settings.theme);
          }
        }
      }

      // 4. Upload/Create back to cloud
      const metadata = { name: "acervo-db.json", mimeType: "application/json" };
      const formData = new FormData();
      formData.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
      formData.append("file", new Blob([JSON.stringify(merged)], { type: "application/json" }));

      if (fileId) {
        await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`, { method: "PATCH", headers: { Authorization: `Bearer ${tk}` }, body: formData });
      } else {
        await fetch(`https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart`, { method: "POST", headers: { Authorization: `Bearer ${tk}` }, body: formData });
      }
      setLastSync(new Date().toLocaleTimeString());
    } catch (err) {
      console.error("Cloud Sync Error:", err);
    } finally {
      setSyncingCloud(false);
    }
  };

  // ═══ Drive Fetch ═══
  const fetchFolder = async (folderId: string, tk: string) => {
    setLoading(true); setAllItems([]); setSearchQuery("");
    try {
      const h = { Authorization: `Bearer ${tk}` };
      const fields = "nextPageToken,files(id,name,mimeType,thumbnailLink,webViewLink)";
      const fetchAll = async (q: string) => {
        const all: any[] = [];
        let pt = "";
        do {
          const u = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=${encodeURIComponent(fields)}&pageSize=1000&supportsAllDrives=true&includeItemsFromAllDrives=true${pt ? `&pageToken=${pt}` : ""}`;
          const d = await (await fetch(u, { headers: h })).json();
          if (d.error) break; if (d.files) all.push(...d.files); pt = d.nextPageToken || "";
        } while (pt);
        return all;
      };
      let raw: any[] = [];
      if (folderId === "root_home") {
        const names = ["[04]", "[07]", "2024", "Seus 50 Livros explicados e resumidos", "CONTROLE FINANCEIRO", "Canal Enriquecendo a Mente", "AudioBook"];
        const cond = names.map(n => `name='${n}'`).join(" or ");
        const [p, s] = await Promise.all([
          fetchAll(`(${cond}) and mimeType='application/vnd.google-apps.folder' and trashed=false`),
          fetchAll(`(${cond}) and sharedWithMe=true and mimeType='application/vnd.google-apps.folder' and trashed=false`),
        ]);
        const m = new Map();[...s, ...p].forEach(f => m.set(f.id, f)); raw = Array.from(m.values());
      } else { raw = await fetchAll(`'${folderId}' in parents and trashed=false`); }
      const images = raw.filter(isImageFile), rest = raw.filter(f => !isImageFile(f));
      const ambi = images[0]?.thumbnailLink?.replace("=s220", "=s600");
      const ready = rest.map(item => { let t = item.thumbnailLink?.replace("=s220", "=s600"); if (!t && ambi && item.mimeType !== "application/vnd.google-apps.folder") t = ambi; return { ...item, thumbnailLink: t }; });
      ready.sort((a: any, b: any) => { const af = a.mimeType === "application/vnd.google-apps.folder" ? 0 : 1, bf = b.mimeType === "application/vnd.google-apps.folder" ? 0 : 1; return af !== bf ? af - bf : a.name.localeCompare(b.name); });
      setAllItems(ready); setLoading(false);
      const fids = rest.filter((f: any) => f.mimeType === "application/vnd.google-apps.folder").map((f: any) => f.id);
      if (fids.length) {
        const covers: Record<string, string> = {};
        const chs: string[][] = []; for (let i = 0; i < fids.length; i += 15) chs.push(fids.slice(i, i + 15));
        for (const ch of chs.slice(0, 5)) {
          const pq = ch.map((id: string) => `'${id}' in parents`).join(" or ");
          try { const d = await (await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(`(${pq}) and mimeType contains 'image' and trashed=false`)}&fields=files(parents,thumbnailLink)&pageSize=100&supportsAllDrives=true&includeItemsFromAllDrives=true`, { headers: h })).json(); d.files?.forEach((img: any) => { const pid = img.parents?.[0]; if (pid && !covers[pid]) covers[pid] = img.thumbnailLink?.replace("=s220", "=s600"); }); } catch { }
        }
        if (Object.keys(covers).length) setAllItems(prev => prev.map(i => i.mimeType === "application/vnd.google-apps.folder" && covers[i.id] ? { ...i, thumbnailLink: covers[i.id] } : i));
      }
    } catch (err) { console.error(err); } finally { setLoading(false); setAuthLoading(false); }
  };

  // ═══ YouTube ═══
  const fetchAIVideos = async (isLoadMore = false) => {
    if (!apiKeys.groq) { setSettingsPinOpen(true); return; }
    if (!isLoadMore && ytCacheRef.current["ai"]) { setVideos(ytCacheRef.current["ai"]); return; }

    if (isLoadMore) setLoadingMore(true);
    else { setVideosLoading(true); setVideos([]); setAiLoading(true); }

    try {
      const allVids = Object.values(ytCacheRef.current).flat();
      const randomSlice = allVids.sort(() => 0.5 - Math.random()).slice(0, 15);
      const titles = randomSlice.map(v => v.title).join("\n") || "estoicismo, disciplina, foco, exercícios, redpill";

      const resp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST", headers: { Authorization: `Bearer ${apiKeys.groq}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile", temperature: 0.7, max_tokens: 200,
          messages: [
            { role: "system", content: "Você é um curador especializado em desenvolvimento pessoal masculino, estoicismo, disciplina, saúde física/mental, PNL, exercícios e educação. Sugira termos de busca YouTube para conteúdo de altíssima qualidade que ajude na cura mental, mente positiva, forja de caráter, e crescimento. Responda APENAS 5 termos de busca, um por linha, sem numeração." },
            { role: "user", content: `Baseado nestes vídeos:\n${titles}\n\nSugira 5 buscas YouTube ${isLoadMore ? "NOVAS " : ""}relacionadas e diferentes:` },
          ],
        }),
      });
      const data = await resp.json();
      const queries = data.choices?.[0]?.message?.content?.split("\n").filter((l: string) => l.trim()) || [];
      const h = { Authorization: `Bearer ${token}` };
      const items: VideoItem[] = [];
      for (const q of queries.slice(0, 3)) {
        try {
          const d = await (await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(q.trim())}&type=video&maxResults=10&relevanceLanguage=pt&order=relevance`, { headers: h })).json();
          if (d.items) items.push(...d.items.map((v: any) => ({ id: v.id.videoId, title: v.snippet.title, thumbnail: v.snippet.thumbnails?.high?.url || "", channel: v.snippet.channelTitle, publishedAt: v.snippet.publishedAt })));
        } catch { }
      }
      const uniqueItems = items.filter((v, i, a) => a.findIndex(x => x.id === v.id) === i);
      const finalItems = isLoadMore ? [...(ytCacheRef.current["ai"] || []), ...uniqueItems].filter((v, i, a) => a.findIndex(x => x.id === v.id) === i) : uniqueItems;
      ytCacheRef.current["ai"] = finalItems; setVideos(finalItems);
    } catch (err) { console.error(err); } finally {
      if (isLoadMore) setLoadingMore(false);
      else { setVideosLoading(false); setAiLoading(false); }
    }
  };

  const fetchVideos = useCallback(async (topic: string, isLoadMore = false) => {
    if (!token) return;
    if (topic === "ai") { fetchAIVideos(isLoadMore); return; }

    if (!isLoadMore) {
      const persistedCache = localStorage.getItem(`acervo_yt_${topic}`);
      if (persistedCache && !ytCacheRef.current[topic]) {
        try {
          const { data, ts } = JSON.parse(persistedCache);
          if (Date.now() - ts < 12 * 60 * 60 * 1000) {
            ytCacheRef.current[topic] = data;
          }
        } catch { }
      }
      if (ytCacheRef.current[topic]) { setVideos(ytCacheRef.current[topic]); return; }
    }

    if (isLoadMore) {
      if (topic === "liked" && !ytPageTokenRef.current[topic] && ytCacheRef.current[topic]) return; // reached end of liked
      setLoadingMore(true);
    } else {
      setVideosLoading(true); setVideos([]); setVideoError("");
    }

    const h = { Authorization: `Bearer ${token}` };
    try {
      let newItems: VideoItem[] = [];
      let nextToken = "";

      if (topic === "liked") {
        const pt = isLoadMore ? ytPageTokenRef.current[topic] : "";
        const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet&myRating=like&maxResults=50${pt ? "&pageToken=" + pt : ""}`;
        const d = await (await fetch(url, { headers: h })).json();
        if (!d.error && d.items) {
          newItems = d.items.map((v: any) => ({ id: v.id, title: v.snippet.title, thumbnail: v.snippet.thumbnails?.high?.url || v.snippet.thumbnails?.medium?.url || "", channel: v.snippet.channelTitle, publishedAt: v.snippet.publishedAt }));
          nextToken = d.nextPageToken || "";
        }
      } else {
        const pl = PLAYLISTS.find(p => p.key === topic);
        const queries = pl?.queries || [topic];

        let qIdx = ytQueryIndexRef.current[topic] ?? 0;
        const pt = isLoadMore ? ytPageTokenRef.current[topic] : "";
        const lang = topic === 'ingles' ? 'en' : 'pt';

        if (!isLoadMore && queries.length > 1) {
          // Parallel fetch for initial load to ensure diverse channels
          ytQueryIndexRef.current[topic] = 0;
          const limit = Math.min(3, queries.length);
          const proms = [];
          for (let i = 0; i < limit; i++) {
            const currentKey = secondaryKeyIndexRef.current > 0 ? secondaryKeysRef.current[secondaryKeyIndexRef.current - 1] : null;
            const headers = currentKey ? { "Content-Type": "application/json" } : h;
            const baseUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(queries[i])}&type=video&maxResults=25&relevanceLanguage=${lang}&order=relevance`;
            const finalUrl = currentKey ? `${baseUrl}&key=${currentKey}` : baseUrl;

            proms.push(fetch(finalUrl, { headers }).then(r => r.json()));
          }
          let gotQuotaError = false;

          const results = await Promise.all(proms);
          results.forEach(d => {
            if (d.error) {
              console.error("YT API Error:", d.error);
              if (d.error.code === 403) gotQuotaError = true;
            }
            if (d.items) {
              newItems.push(...d.items.map((v: any) => ({ id: v.id.videoId, title: v.snippet.title, thumbnail: v.snippet.thumbnails?.high?.url || v.snippet.thumbnails?.medium?.url || "", channel: v.snippet.channelTitle, publishedAt: v.snippet.publishedAt })));
            }
          });

          if (gotQuotaError) {
            const nextIdx = secondaryKeyIndexRef.current;
            if (nextIdx < secondaryKeysRef.current.length && secondaryKeysRef.current[nextIdx]?.length > 10) {
              secondaryKeyIndexRef.current += 1;
              setTimeout(() => fetchVideos(topic, isLoadMore), 100);
              return;
            }
            setVideoError("Cota diária da API do YouTube esgotada. Insira chaves Premium nas configurações.");
          }

          ytQueryIndexRef.current[topic] = limit % queries.length;
        } else {
          if (isLoadMore && !pt) {
            qIdx = (qIdx + 1) % queries.length;
            ytQueryIndexRef.current[topic] = qIdx;
          }
          const q = queries[qIdx];
          const currentKey = secondaryKeyIndexRef.current > 0 ? secondaryKeysRef.current[secondaryKeyIndexRef.current - 1] : null;
          const headers = currentKey ? { "Content-Type": "application/json" } : h;
          const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(q)}&type=video&maxResults=50&relevanceLanguage=${lang}&order=relevance${pt ? "&pageToken=" + pt : ""}`;
          const finalUrl = currentKey ? `${searchUrl}&key=${currentKey}` : searchUrl;

          const d = await (await fetch(finalUrl, { headers })).json();
          if (d.error) {
            if (d.error.code === 403) {
              const nextIdx = secondaryKeyIndexRef.current;
              if (nextIdx < secondaryKeysRef.current.length && secondaryKeysRef.current[nextIdx]?.length > 10) {
                secondaryKeyIndexRef.current += 1;
                setTimeout(() => fetchVideos(topic, isLoadMore), 100);
                return;
              }
              setVideoError("Cota diária do YouTube esgotada. Adicione as chaves de backup nos ajustes.");
            } else {
              setVideoError("Erro carregando vídeos do YouTube.");
            }
          }
          if (d.items) {
            newItems = d.items.map((v: any) => ({ id: v.id.videoId, title: v.snippet.title, thumbnail: v.snippet.thumbnails?.high?.url || v.snippet.thumbnails?.medium?.url || "", channel: v.snippet.channelTitle, publishedAt: v.snippet.publishedAt }));
            nextToken = d.nextPageToken || "";
          }
        }
      }

      ytPageTokenRef.current[topic] = nextToken;
      const finalItems = isLoadMore ? [...(ytCacheRef.current[topic] || []), ...newItems] : newItems;
      const uniqueItems = finalItems.filter((v, i, a) => a.findIndex(x => x.id === v.id) === i);

      if (uniqueItems.length > 0) {
        ytCacheRef.current[topic] = uniqueItems;
        setVideos(uniqueItems);
        localStorage.setItem(`acervo_yt_${topic}`, JSON.stringify({ data: uniqueItems, ts: Date.now() }));
      }
    } catch (err) { console.error(err); } finally {
      if (isLoadMore) setLoadingMore(false); else setVideosLoading(false);
    }
  }, [token]);

  useEffect(() => { if (token && activeTab === "videos") fetchVideos(activeTopic); }, [token, activeTab, activeTopic, fetchVideos]);

  // ═══ Infinite Scroll Observer ═══
  useEffect(() => {
    if (!loaderRef.current) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && activeTab === "videos" && !videosLoading && !loadingMore && !videoSearch) {
        fetchVideos(activeTopic, true);
      }
    }, { threshold: 0.1 });
    const current = loaderRef.current;
    observer.observe(current);
    return () => observer.unobserve(current);
  }, [videosLoading, loadingMore, activeTab, activeTopic, videoSearch, fetchVideos]);

  // ═══ Navigation ═══
  const navigate = (item: FileItem) => {
    if (item.mimeType === "application/vnd.google-apps.folder") setCrumbs([...crumbs, { id: item.id, name: item.name }]);
    else if (isAudioFile(item)) playAudio(item);
    else setPreviewItem(item);
  };

  // ═══ Audio Player ═══
  const playAudio = async (item: FileItem) => {
    if (!token) return;
    setAudioItem(item); setAudioUrl(null); setPlaying(false); setProg(0); setDur(0); setAudioLoading(true); setPlayerOpen(true);
    const queue = allItems.filter(isAudioFile).filter(f => f.id !== item.id);
    setAudioQueue(queue);
    try {
      const r = await fetch(`https://www.googleapis.com/drive/v3/files/${item.id}?alt=media&supportsAllDrives=true`, { headers: { Authorization: `Bearer ${token}` } });
      if (!r.ok) throw new Error();
      setAudioUrl(URL.createObjectURL(await r.blob()));
      setPlaying(true);
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.playbackRate = rate;
          audioRef.current.volume = volume;
          const saved = localStorage.getItem(`acervo_pos_${item.id}`);
          if (saved) audioRef.current.currentTime = parseFloat(saved);
          audioRef.current.play();
        }
      }, 80);
    } catch { setAudioLoading(false); }
  };

  const resumeRecent = async (rp: RecentPlay) => {
    if (!token) return;
    const item: FileItem = { id: rp.id, name: rp.name, mimeType: "audio/mpeg", thumbnailLink: rp.thumbnailLink };
    localStorage.setItem(`acervo_pos_${rp.id}`, rp.position.toString());
    playAudio(item);
  };

  const toggle = () => { if (!audioRef.current) return; playing ? audioRef.current.pause() : audioRef.current.play(); setPlaying(!playing); };
  const skip = (s: number) => { if (audioRef.current) audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime + s); };
  const cycleRate = () => { const r2 = [0.75, 1, 1.25, 1.5, 1.75, 2]; const n = r2[(r2.indexOf(rate) + 1) % r2.length]; setRate(n); if (audioRef.current) audioRef.current.playbackRate = n; };
  const changeVol = (v: number) => { setVolumeState(v); if (audioRef.current) audioRef.current.volume = v; };
  const playNext = () => { if (audioQueue.length === 0) return; const next = audioQueue[0]; setAudioQueue(prev => prev.slice(1)); playAudio(next); };
  const handleEnded = () => { setPlaying(false); if (audioQueue.length > 0) playNext(); };

  // ═══ Bookmarks ═══
  const saveBookmarks = (newB: BookmarkItem[]) => { setBookmarks(newB); localStorage.setItem("acervo_bookmarks", JSON.stringify(newB)); triggerCloudSync(); };
  const addBookmark = () => {
    if (!audioItem || !audioRef.current) return;
    const bm: BookmarkItem = { id: Date.now().toString(), audioId: audioItem.id, audioName: audioItem.name, position: audioRef.current.currentTime, label: `Marcador ${fmt(audioRef.current.currentTime)}`, createdAt: new Date().toISOString() };
    saveBookmarks([...bookmarks, bm]);
  };
  const deleteBookmark = (id: string) => { const n = bookmarks.filter(b => b.id !== id); saveBookmarks(n); };
  const goToBookmark = (pos: number) => { if (audioRef.current) { audioRef.current.currentTime = pos; setProg(pos); } };

  // ═══ Settings ═══
  const saveSettings = () => {
    localStorage.setItem("acervo_skip", skipSec.toString());
    localStorage.setItem("acervo_apikeys", JSON.stringify(apiKeys));
    if (newPin.trim().length >= 4) {
      localStorage.setItem("acervo_pin", newPin.trim());
      setSavedPin(newPin.trim());
    }
    setShowSettings(false);
    setIsAuthenticatedSettings(false);
    setPinInput("");
    setNewPin("");
  };

  const getItemType = (item: FileItem): "folder" | "audio" | "doc" => { if (item.mimeType === "application/vnd.google-apps.folder") return "folder"; if (isAudioFile(item)) return "audio"; return "doc"; };
  const getTypeLabel = (t: string) => t === "folder" ? "Coleção" : t === "audio" ? "Áudio" : "Documento";
  const pct = dur > 0 ? (prog / dur) * 100 : 0;
  const remaining = dur > 0 ? dur - prog : 0;

  // ═══════════════════════
  //  LOGIN
  // ═══════════════════════
  if (!token) {
    return (
      <>
        <div className="bg-ambient" />
        <main className="login-screen">
          <motion.div className="login-logo-glow" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 1.2 }}>
            <BookOpen size={48} color="var(--gold)" />
          </motion.div>
          <motion.h1 className="login-title" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>Acervo Premium</motion.h1>
          <motion.p className="login-subtitle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>Sua biblioteca exclusiva</motion.p>
          <motion.button className="btn-gold" onClick={login} disabled={authLoading} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}>
            {authLoading ? <Loader2 size={20} className="animate-spin" /> : <BookOpen size={20} />}
            {authLoading ? "Conectando..." : "Acessar Acervo"}
          </motion.button>
        </main>
      </>
    );
  }

  // ═══════════════════════
  //  FULLSCREEN AUDIO PLAYER
  // ═══════════════════════
  if (playerOpen && audioItem) {
    return (
      <>
        <div className="bg-ambient" />
        <main className="player-fullscreen">
          <div className="pf-topbar">
            <button className="pf-minimize" onClick={() => setPlayerOpen(false)}><ChevronDown size={28} /></button>
            <span className="pf-topbar-label">Tocando Agora</span>
            <button className="pf-close" onClick={() => { setAudioItem(null); audioRef.current?.pause(); setPlaying(false); setPlayerOpen(false); }}><X size={22} /></button>
          </div>

          <div className="pf-main-content">
            <div className="pf-cover-wrapper">
              <div className={`pf-cover ${playing ? 'spinning' : ''}`} style={{ background: audioItem.thumbnailLink ? "#000" : getGradient(audioItem.name) }}>
                {audioItem.thumbnailLink ? <img src={audioItem.thumbnailLink} alt="" /> : <Disc size={80} color="rgba(255,255,255,0.7)" className="pf-disc-icon" />}
                <div className="pf-cover-hole" />
              </div>
            </div>

            <div className="pf-info">
              <h2 className="pf-title">{audioItem.name.replace(/\.(mp3|m4a|ogg|wav|flac)$/i, "")}</h2>
              <p className="pf-subtitle">{audioLoading ? "Buffering..." : playing ? "Reproduzindo" : "Pausado"}{sleepEnd ? ` • Sleep ${fmtTimer(sleepLeft)}` : ""}</p>
            </div>

            <div className="pf-progress">
              <div className="pf-track">
                <input type="range" className="pf-slider" min="0" max={dur || 0} step="0.1" value={prog} onChange={(e) => { const v = parseFloat(e.target.value); if (audioRef.current) { audioRef.current.currentTime = v; setProg(v); } }} />
                <div className="pf-fill" style={{ width: `${pct}%` }} />
                {currentBookmarks.map(bm => <div key={bm.id} className="pf-bookmark-dot" style={{ left: `${(bm.position / (dur || 1)) * 100}%` }} title={bm.label} />)}
                <div className="pf-thumb" style={{ left: `${pct}%` }} />
              </div>
              <div className="pf-times"><span>{fmt(prog)}</span><span>-{fmt(remaining)}</span></div>
            </div>

            <div className="pf-controls">
              <button className={`pf-action-btn ${sleepEnd ? "active" : ""}`} onClick={() => setShowSleep(!showSleep)}><Clock size={20} /></button>
              <button className="pf-skip" onClick={() => skip(-skipSec)}><SkipBack size={28} /><span className="skip-label">{skipSec}</span></button>
              <button className="pf-play" onClick={toggle} disabled={audioLoading}>
                {audioLoading ? <Loader2 size={36} className="animate-spin" color="var(--gold)" /> : playing ? <Pause size={36} fill="#111" stroke="#111" /> : <Play size={36} fill="#111" stroke="#111" />}
              </button>
              <button className="pf-skip" onClick={() => skip(skipSec)}><SkipForward size={28} /><span className="skip-label">{skipSec}</span></button>
              <button className="pf-action-btn" onClick={() => setShowVol(!showVol)}>{volume > 0 ? <Volume2 size={20} /> : <VolumeX size={20} />}</button>
            </div>

          </div>

          {showVol && (
            <div className="pf-volume-row">
              <VolumeX size={16} color="var(--text-muted)" />
              <input type="range" min="0" max="1" step="0.05" value={volume} onChange={e => changeVol(parseFloat(e.target.value))} className="vol-slider" />
              <Volume2 size={16} color="var(--text-muted)" />
            </div>
          )}

          {showSleep && (
            <div className="pf-sleep-menu">
              {sleepEnd ? <button className="sleep-opt active" onClick={() => { setSleepEnd(null); setSleepLeft(0); setShowSleep(false); }}>Cancelar Timer</button> : null}
              {[15, 30, 45, 60, 90].map(m => <button key={m} className="sleep-opt" onClick={() => { setSleepEnd(Date.now() + m * 60000); setSleepLeft(m); setShowSleep(false); }}>{fmtTimer(m)}</button>)}
            </div>
          )}

          <div className="pf-actions-row">
            <button className="pf-speed" onClick={cycleRate}>{rate}x</button>
            <button className="pf-action-btn" onClick={addBookmark}><Bookmark size={20} /><span>Marcador</span></button>
            <button className="pf-action-btn" onClick={() => setShowBookmarks(!showBookmarks)}><ListMusic size={20} /><span>Marcadores</span></button>
            {audioQueue.length > 0 && <button className="pf-action-btn" onClick={() => setShowQueue(!showQueue)}><ListMusic size={20} /><span>Fila ({audioQueue.length})</span></button>}
          </div>

          {showBookmarks && currentBookmarks.length > 0 && (
            <div className="pf-bookmarks-list">
              {currentBookmarks.map(bm => (
                <div key={bm.id} className="bm-item" onClick={() => goToBookmark(bm.position)}>
                  <Bookmark size={14} color="var(--gold)" />
                  <span className="bm-time">{fmt(bm.position)}</span>
                  <span className="bm-label">{bm.label}</span>
                  <button className="bm-del" onClick={e => { e.stopPropagation(); deleteBookmark(bm.id); }}><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
          )}
          {showBookmarks && currentBookmarks.length === 0 && <p className="pf-empty-bm">Nenhum marcador. Toque em &quot;Marcador&quot; para adicionar.</p>}

          {showQueue && (
            <div className="pf-queue-list">
              <h4>Próximos</h4>
              {audioQueue.map((q, i) => (
                <div key={q.id} className="queue-item" onClick={() => { setAudioQueue(prev => prev.filter((_, idx) => idx !== i)); playAudio(q); }}>
                  <span className="queue-num">{i + 1}</span>
                  <span className="queue-name">{q.name.replace(/\.(mp3|m4a)$/i, "")}</span>
                  <Play size={14} color="var(--gold)" />
                </div>
              ))}
            </div>
          )}

          {audioUrl && <audio ref={audioRef} src={audioUrl} onTimeUpdate={() => setProg(audioRef.current?.currentTime || 0)} onLoadedMetadata={() => { setDur(audioRef.current?.duration || 0); setAudioLoading(false); }} onEnded={handleEnded} onError={() => setAudioLoading(false)} />}
        </main>
      </>
    );
  }

  // ═══════════════════════
  //  FULLSCREEN VIDEO (MOVED TO BOTTOM GLOBAL OVERLAY)
  // ═══════════════════════

  // ═══════════════════════
  //  MAIN APP
  // ═══════════════════════
  return (
    <>
      <div className="bg-ambient" />
      <main className="app-container">
        <header className="app-header">
          <div className="app-logo">
            <div className="logo-icon"><img src="/logo.png" alt="Acervo Premium" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 8 }} /></div>
            <div>
              <div className="logo-title">Acervo Premium</div>
              <div className="logo-sub">v{APP_VERSION} • Conectado</div>
            </div>
          </div>
          <div className="header-actions">
            <button className="settings-btn" onClick={() => setSettingsPinOpen(true)}><Settings size={20} /></button>
            <div className="user-pill">
              {token && (
                <button
                  className={`sync-btn ${syncingCloud ? 'syncing' : ''}`}
                  onClick={() => syncWithCloud(token, true)}
                  title={lastSync ? `Sincronizado às ${lastSync}` : "Sincronizar dados com o Google Drive"}
                  style={{ background: 'rgba(201,169,110,0.1)', border: '1px solid rgba(201,169,110,0.3)', borderRadius: 20, padding: '4px 12px', cursor: 'pointer', color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', fontWeight: 600, transition: 'all 0.3s' }}
                >
                  <RefreshCw size={14} className={syncingCloud ? 'animate-spin' : ''} />
                  <span className="sync-text" style={{ whiteSpace: 'nowrap' }}>{syncingCloud ? 'Sincronizando' : 'Nuvem OK'}</span>
                </button>
              )}
              <span className="user-name">{user?.name}</span>
              {user?.picture ? <img src={user.picture} alt="" className="user-avatar" /> : <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--gold)" }} />}
            </div>
          </div>
        </header>

        <div className="tab-nav">
          <button className={`tab-btn ${activeTab === "library" ? "active" : ""}`} onClick={() => setActiveTab("library")}><Library size={18} /> Biblioteca</button>
          <button className={`tab-btn ${activeTab === "videos" ? "active" : ""}`} onClick={() => setActiveTab("videos")}><Tv size={18} /> Vídeos</button>
        </div>

        <PremiumHub />


        {/* ════ LIBRARY TAB ════ */}
        {activeTab === "library" && (
          <>
            {recentPlays.length > 0 && (
              <div className="recents-section">
                <h3 className="section-title">📖 Ouvindo Recentemente</h3>
                <div className="recents-scroll">
                  {recentPlays.slice(0, 10).map(rp => (
                    <div key={rp.id} className="recent-card" onClick={() => resumeRecent(rp)}>
                      <div className="recent-cover" style={{ background: rp.thumbnailLink ? "#111" : getGradient(rp.name) }}>
                        {rp.thumbnailLink ? <img src={rp.thumbnailLink} alt="" /> : <Disc size={24} color="rgba(201,169,110,0.5)" />}
                        <div className="recent-play-icon"><Play size={16} fill="white" /></div>
                      </div>
                      <div className="recent-info">
                        <span className="recent-name">{rp.name.replace(/\.(mp3|m4a)$/i, "")}</span>
                        <div className="recent-progress-bar"><div className="recent-progress-fill" style={{ width: `${rp.duration > 0 ? (rp.position / rp.duration) * 100 : 0}%` }} /></div>
                        <span className="recent-pct">{rp.duration > 0 ? Math.round((rp.position / rp.duration) * 100) : 0}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {bookmarks.length > 0 && (
              <div className="bookmarks-section">
                <h3 className="section-title">🔖 Seus Marcadores</h3>
                <div className="bookmarks-grid">
                  {bookmarks.slice(0, 6).map(bm => (
                    <div key={bm.id} className="bookmark-card" onClick={() => { const item: FileItem = { id: bm.audioId, name: bm.audioName, mimeType: "audio/mpeg" }; localStorage.setItem(`acervo_pos_${bm.audioId}`, bm.position.toString()); playAudio(item); }}>
                      <Bookmark size={16} color="var(--gold)" />
                      <div className="bookmark-card-info">
                        <span className="bookmark-card-name">{bm.audioName.replace(/\.(mp3|m4a)$/i, "")}</span>
                        <span className="bookmark-card-time">{fmt(bm.position)} • {bm.label}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <nav className="breadcrumbs">
              {crumbs.map((c, i) => (
                <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <button className={i === crumbs.length - 1 ? "active" : ""} onClick={() => setCrumbs(crumbs.slice(0, i + 1))}>{c.name}</button>
                  {i < crumbs.length - 1 && <ChevronRight size={14} />}
                </div>
              ))}
            </nav>

            {!loading && allItems.length > 0 && (
              <div className="search-bar">
                <Search size={18} color="var(--text-muted)" />
                <input placeholder="Pesquisar..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                {searchQuery && <button className="search-clear" onClick={() => setSearchQuery("")}><X size={16} /></button>}
              </div>
            )}

            {loading && <div className="loading-state"><div className="spinner" /><p>Sincronizando...</p></div>}

            {!loading && filteredItems.length > 0 && (
              <div className="file-grid">
                {filteredItems.map(item => {
                  const type = getItemType(item);
                  return (
                    <div key={item.id} className="file-card" onClick={() => navigate(item)}>
                      <div className="file-card-cover" style={{ background: item.thumbnailLink ? "#111" : getGradient(item.name) }}>
                        {item.thumbnailLink ? <img src={item.thumbnailLink} alt={item.name} loading="lazy" /> : (
                          <div className="file-card-icon">{type === "folder" ? <Folder size={40} color="rgba(201,169,110,0.6)" /> : type === "audio" ? <Disc size={40} color="rgba(201,169,110,0.6)" /> : <FileText size={40} color="rgba(201,169,110,0.6)" />}</div>
                        )}
                        {type !== "folder" && <div className="file-card-overlay"><div className="file-card-play">{type === "audio" ? <Play size={16} fill="black" /> : <BookOpen size={16} />}</div></div>}
                      </div>
                      <div className="file-card-info">
                        <div className="file-card-name">{item.name.replace(/\.(mp3|m4a|pdf|epub|doc|docx)$/i, "")}</div>
                        <span className={`file-card-badge ${type}`}>{getTypeLabel(type)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {!loading && filteredItems.length === 0 && allItems.length > 0 && <div className="empty-state"><h3>Nenhum resultado</h3></div>}
            {!loading && allItems.length === 0 && token && <div className="empty-state"><h3>Pasta Vazia</h3></div>}
          </>
        )}

        {/* ════ VIDEOS TAB ════ */}
        {activeTab === "videos" && (
          <>
            <div className="topic-chips">
              {PLAYLISTS.map(t => (
                <button key={t.key} className={`topic-chip ${activeTopic === t.key ? "active" : ""} ${t.key === "ai" ? "ai-chip" : ""}`} onClick={() => { setActiveTopic(t.key); setVideoSearch(""); }}>
                  <span>{t.icon}</span> {t.label}
                </button>
              ))}
            </div>
            {!videosLoading && videos.length > 0 && (
              <div className="search-bar">
                <Search size={18} color="var(--text-muted)" />
                <input placeholder="Filtrar vídeos..." value={videoSearch} onChange={e => setVideoSearch(e.target.value)} />
                {videoSearch && <button className="search-clear" onClick={() => setVideoSearch("")}><X size={16} /></button>}
              </div>
            )}
            {videosLoading && <div className="loading-state"><div className="spinner" /><p>{aiLoading ? "IA analisando..." : "Carregando vídeos..."}</p></div>}

            {!videosLoading && videoError && (
              <div className="loading-state" style={{ padding: 40, border: '1px solid var(--border)', borderRadius: 12, marginTop: 24, textAlign: 'center' }}>
                <span style={{ fontSize: '3rem', marginBottom: 16, display: 'block' }}>🛑</span>
                <h3 style={{ color: 'var(--text)', marginBottom: 8 }}>Limite Alcançado (403)</h3>
                <p style={{ color: 'var(--text-muted)' }}>{videoError}</p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 12 }}>A API do YouTube concede apenas 10.000 pontos diários para desenvolvedores por projeto conectado. A cota da sua conexão atual resetará à meia-noite.</p>
              </div>
            )}

            {!videosLoading && !videoError && filteredVideos.length === 0 && (
              <div className="loading-state"><p>Nenhum vídeo encontrado.</p></div>
            )}

            {!videosLoading && !videoError && filteredVideos.length > 0 && (
              <>
                <div className="video-rows">
                  {Object.entries(
                    filteredVideos.reduce((acc, v) => {
                      if (!acc[v.channel]) acc[v.channel] = [];
                      acc[v.channel].push(v);
                      return acc;
                    }, {} as Record<string, VideoItem[]>)
                  ).sort((a, b) => b[1].length - a[1].length).map(([channel, vids]) => (
                    <div key={channel} className="video-row">
                      <h4 className="video-row-title">{channel}</h4>
                      <div className="video-row-container" style={{ position: "relative" }}>
                        <button className="row-arrow left" onClick={(e) => { const c = e.currentTarget.nextElementSibling as HTMLElement; c.scrollBy({ left: -600, behavior: "smooth" }); }}><ChevronLeft size={28} /></button>
                        <div className={`video-row-scroll ${vids.length > 5 ? 'dense' : ''}`}>
                          {vids.map(v => (
                            <div key={v.id} className="video-card row-card" onClick={() => {
                              if (AMBIENT_TOPICS.includes(activeTopic)) { setAmbientVideo(v); setAmbientPlaying(true); }
                              else { setPlayingVideo(v); setVideoPlayerOpen(true); }
                            }}>
                              <div className="video-thumb"><img src={v.thumbnail} alt={v.title} loading="lazy" /><div className="video-play-icon">{AMBIENT_TOPICS.includes(activeTopic) ? <span style={{ fontSize: '1.5rem' }}>{activeTopic === 'cura' ? '✨' : '🌧️'}</span> : <Play size={24} fill="white" />}</div></div>
                              <div className="video-info"><div className="video-title">{v.title}</div><div className="video-meta">{v.channel} • {timeAgo(v.publishedAt)}</div></div>
                            </div>
                          ))}
                        </div>
                        <button className="row-arrow right" onClick={(e) => { const c = e.currentTarget.previousElementSibling as HTMLElement; c.scrollBy({ left: 600, behavior: "smooth" }); }}><ChevronRight size={28} /></button>
                      </div>
                    </div>
                  ))}
                </div>
                {!videoSearch && (
                  <div ref={loaderRef} style={{ height: 40, marginTop: 24, paddingBottom: 20, display: "flex", justifyContent: "center", alignItems: "center" }}>
                    {loadingMore ? <Loader2 size={24} className="animate-spin" color="var(--text-muted)" /> : <div style={{ height: 1 }} />}
                  </div>
                )}
              </>
            )}
            {!videosLoading && !videoError && filteredVideos.length === 0 && videos.length > 0 && <div className="empty-state"><h3>Nenhum vídeo encontrado</h3></div>}
            {!videosLoading && !videoError && videos.length === 0 && <div className="empty-state"><h3>Nenhum vídeo</h3><p>Selecione um tema acima</p></div>}
          </>
        )}

        {/* Mini Player */}
        <AnimatePresence>
          {audioItem && !playerOpen && (
            <motion.div className="mini-player" initial={{ y: 80 }} animate={{ y: 0 }} exit={{ y: 80 }} onClick={() => setPlayerOpen(true)}>
              <div className="mini-progress-bar" style={{ width: `${pct}%` }} />
              <div className="mini-cover" style={{ background: audioItem.thumbnailLink ? "#000" : getGradient(audioItem.name) }}>
                {audioItem.thumbnailLink ? <img src={audioItem.thumbnailLink} alt="" /> : <Disc size={20} color="rgba(201,169,110,0.5)" />}
              </div>
              <div className="mini-info">
                <span className="mini-title">{audioItem.name.replace(/\.(mp3|m4a)$/i, "")}</span>
                <span className="mini-status">{playing ? "Tocando" : "Pausado"}{sleepEnd ? ` • Sleep ${fmtTimer(sleepLeft)}` : ""}</span>
              </div>
              <button className="mini-play" onClick={e => { e.stopPropagation(); toggle(); }}>
                {playing ? <Pause size={20} fill="white" /> : <Play size={20} fill="white" />}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Settings PIN Modal */}
        <AnimatePresence>
          {settingsPinOpen && !isAuthenticatedSettings && (
            <motion.div className="settings-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setSettingsPinOpen(false); setPinInput(""); }}>
              <motion.div className="settings-panel" style={{ maxWidth: 320 }} initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} onClick={e => e.stopPropagation()}>
                <div className="settings-header"><h3>🔐 Acesso Restrito</h3><button onClick={() => { setSettingsPinOpen(false); setPinInput(""); }}><X size={20} /></button></div>
                <div className="settings-body">
                  <div className="settings-group">
                    <label>Digite o PIN de Segurança</label>
                    <input autoFocus className="settings-input" type="password" placeholder={savedPin === "0000" ? "Dica: 0000" : "Digite seu PIN"} value={pinInput} onChange={e => {
                      const val = e.target.value;
                      setPinInput(val);
                      if (val === savedPin) {
                        setIsAuthenticatedSettings(true);
                        setSettingsPinOpen(false);
                        setShowSettings(true);
                        setPinInput("");
                      }
                    }} />
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Settings Modal */}
        <AnimatePresence>
          {showSettings && isAuthenticatedSettings && (
            <motion.div className="settings-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => saveSettings()}>
              <motion.div className="settings-panel settings-panel-large" initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} onClick={e => e.stopPropagation()}>
                <div className="settings-header"><h3>⚙️ Configurações</h3><button onClick={saveSettings}><X size={20} /></button></div>
                <div className="settings-body settings-body-scroll">
                  <div className="settings-group">
                    <label>Tema</label>
                    <div className="theme-toggle">
                      <button className={theme === "light" ? "active" : ""} onClick={() => setTheme("light")}><Sun size={16} /> Claro</button>
                      <button className={theme === "dark" ? "active" : ""} onClick={() => setTheme("dark")}><Moon size={16} /> Escuro</button>
                    </div>
                  </div>
                  <div className="settings-group">
                    <label>Pulo do Áudio</label>
                    <div className="skip-options">
                      {[10, 15, 30].map(s => <button key={s} className={skipSec === s ? "active" : ""} onClick={() => { setSkipSec(s); localStorage.setItem("acervo_skip", s.toString()); }}>{s}s</button>)}
                    </div>
                  </div>
                  <div className="settings-group">
                    <label>Mudar PIN (Acesso Restrito)</label>
                    <input className="settings-input" placeholder="Novo PIN (Mínimo 4 dígitos)" value={newPin} onChange={e => setNewPin(e.target.value)} type="password" />
                  </div>

                  <div className="settings-group">
                    <label>Volume do Áudio Ambiente Acervo</label>
                    <input type="range" min="0" max="100" value={ambientVol} onChange={(e) => setAmbientVol(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--gold)' }} />
                  </div>

                  <h4 style={{ marginTop: 12, marginBottom: -4, fontSize: '0.9rem', color: 'var(--text)' }}>Provedores de Inteligência Artificial</h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 8, lineHeight: 1.4 }}>Adicione suas chaves API (todas gratuitas) para expandir as buscas inteligentes do Acervo.</p>

                  <div className="settings-group">
                    <label style={{ display: 'flex', justifyContent: 'space-between' }}><span>Groq API</span> <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--gold)' }}>Obter Chave ↗</a></label>
                    <input className="settings-input" placeholder="gsk_..." value={apiKeys.groq} onChange={e => setApiKeys(p => ({ ...p, groq: e.target.value }))} type="password" />
                  </div>
                  <div className="settings-group">
                    <label style={{ display: 'flex', justifyContent: 'space-between' }}><span>Cerebras API</span> <a href="https://cloud.cerebras.ai" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--gold)' }}>Obter Chave ↗</a></label>
                    <input className="settings-input" placeholder="Chave Cerebras" value={apiKeys.cerebras} onChange={e => setApiKeys(p => ({ ...p, cerebras: e.target.value }))} type="password" />
                  </div>
                  <div className="settings-group">
                    <label style={{ display: 'flex', justifyContent: 'space-between' }}><span>Mistral API</span> <a href="https://console.mistral.ai/api-keys" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--gold)' }}>Obter Chave ↗</a></label>
                    <input className="settings-input" placeholder="Chave Mistral" value={apiKeys.mistral} onChange={e => setApiKeys(p => ({ ...p, mistral: e.target.value }))} type="password" />
                  </div>
                  <div className="settings-group">
                    <label style={{ display: 'flex', justifyContent: 'space-between' }}><span>Google Gemini API</span> <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--gold)' }}>Obter Chave ↗</a></label>
                    <input className="settings-input" placeholder="AIzaSy..." value={apiKeys.google} onChange={e => setApiKeys(p => ({ ...p, google: e.target.value }))} type="password" />
                  </div>

                  <h4 style={{ marginTop: 12, marginBottom: -4, fontSize: '0.9rem', color: 'var(--gold)' }}>🔄 Rotação de Cotas YouTube (Recurso Premium)</h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 8, lineHeight: 1.4 }}>Adicione as chaves de API dos seus outros e-mails para que o Acervo nunca pare de carregar vídeos.</p>

                  <div className="settings-group">
                    <label>YouTube Backup 1 (acessoriosamigos@...)</label>
                    <input className="settings-input" placeholder="Chave do 2º e-mail" value={apiKeys.yt2} onChange={e => setApiKeys(p => ({ ...p, yt2: e.target.value }))} type="password" />
                  </div>
                  <div className="settings-group">
                    <label>YouTube Backup 2 (grupowonder...) </label>
                    <input className="settings-input" placeholder="Chave do 3º e-mail" value={apiKeys.yt3} onChange={e => setApiKeys(p => ({ ...p, yt3: e.target.value }))} type="password" />
                  </div>
                </div>
                <div className="settings-footer"><span>Acervo Premium v2.0 • Acesso Seguro</span></div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Document Viewer */}
        <AnimatePresence>
          {previewItem && (
            <motion.div className="viewer-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="viewer-panel">
                <div className="viewer-header">
                  <h3>{previewItem.name}</h3>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <a className="viewer-open-btn" href={`https://drive.google.com/file/d/${previewItem.id}/view`} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>Abrir no Drive ↗</a>
                    <button className="viewer-close" onClick={() => setPreviewItem(null)}><X size={20} /></button>
                  </div>
                </div>
                <div className="viewer-body">
                  <iframe src={`https://drive.google.com/file/d/${previewItem.id}/preview`} width="100%" height="100%" style={{ border: "none", borderRadius: "12px" }} allow="autoplay" sandbox="allow-same-origin allow-scripts allow-popups allow-forms" />
                  <div className="viewer-hint">
                    💡 Dica: No leitor de PDF (acima), use o menu da &quot;Lupa&quot; ou os botões de &quot;+&quot; e &quot;-&quot; para ajustar livremente o zoom, tamanho do texto e navegação pelas páginas de modo responsivo!
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Global Mini/Fullscreen Video Player */}
        <AnimatePresence>
          {playingVideo && (
            <motion.div
              className={`global-video-player ${videoPlayerOpen ? "fullscreen" : "minimized"}`}
              initial={videoPlayerOpen ? { y: '100%' } : { y: 50, opacity: 0 }}
              animate={videoPlayerOpen ? { y: 0 } : { y: 0, opacity: 1 }}
              exit={videoPlayerOpen ? { y: '100%' } : { y: 50, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              onClick={() => !videoPlayerOpen && setVideoPlayerOpen(true)}
            >
              {videoPlayerOpen && (
                <div className="vf-topbar">
                  <button className="pf-minimize" onClick={(e) => { e.stopPropagation(); setVideoPlayerOpen(false); }}><ChevronDown size={28} /></button>
                  <span className="pf-topbar-label">Assistindo</span>
                  <button className="pf-close" onClick={(e) => { e.stopPropagation(); setPlayingVideo(null); setVideoPlayerOpen(false); }}><X size={22} /></button>
                </div>
              )}

              <div className="vf-player-container">
                <iframe
                  ref={playingVideoRef}
                  src={`https://www.youtube.com/embed/${playingVideo.id}?autoplay=1&enablejsapi=1&rel=0`}
                  allow="autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                />
              </div>

              {videoPlayerOpen ? (
                <div className="vf-info">
                  <h3 className="vf-title">{playingVideo.title}</h3>
                  <p className="vf-channel">{playingVideo.channel} • {timeAgo(playingVideo.publishedAt)}</p>
                </div>
              ) : (
                <div className="mini-video-overlay">
                  <div className="mini-video-info">
                    <span className="mini-title">{playingVideo.title}</span>
                    <span className="mini-status">Em segundo plano</span>
                  </div>
                  <div className="mini-video-actions">
                    <button className="mini-action-btn" onClick={e => { e.stopPropagation(); setPlayingVideoIsPlaying(!playingVideoIsPlaying); }}>
                      {playingVideoIsPlaying ? <Pause size={18} color="var(--text)" fill="var(--text)" /> : <Play size={18} color="var(--text)" fill="var(--text)" />}
                    </button>
                    <button className="mini-close" onClick={e => { e.stopPropagation(); setPlayingVideo(null); }}><X size={20} color="var(--text)" /></button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ═══ AMBIENT SOUND ENGINE — Independent Layer ═══ */}
        <AnimatePresence>
          {ambientVideo && (
            <motion.div
              className="ambient-engine"
              style={{
                position: 'fixed',
                bottom: audioItem && !playerOpen ? 78 : 16,
                left: 12,
                right: 12,
                zIndex: 110,
                borderRadius: 16,
                background: 'linear-gradient(135deg, rgba(10,10,15,0.95), rgba(20,15,30,0.95))',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(201,169,110,0.3)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 20px rgba(201,169,110,0.08)',
                overflow: 'hidden',
              }}
              initial={{ y: 60, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 60, opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            >
              {/* Hidden iframe — plays independently of audiobook */}
              <div style={{ display: 'none' }}>
                <iframe
                  ref={ambientPlayerRef}
                  src={`https://www.youtube.com/embed/${ambientVideo.id}?autoplay=${ambientPlaying ? 1 : 0}&enablejsapi=1&rel=0&loop=1`}
                  allow="autoplay; encrypted-media"
                />
              </div>

              {/* Ambient gradient pulse animation */}
              <div style={{
                position: 'absolute', inset: 0, opacity: ambientPlaying ? 0.15 : 0,
                background: 'linear-gradient(90deg, rgba(201,169,110,0.2), rgba(139,92,246,0.15), rgba(201,169,110,0.2))',
                backgroundSize: '200% 100%',
                animation: ambientPlaying ? 'ambientPulse 4s ease-in-out infinite' : 'none',
                pointerEvents: 'none', transition: 'opacity 0.5s',
              }} />

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', position: 'relative', zIndex: 1 }}>
                {/* Icon */}
                <div style={{
                  width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                  background: 'linear-gradient(135deg, rgba(201,169,110,0.2), rgba(139,92,246,0.15))',
                  border: '1px solid rgba(201,169,110,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Headphones size={20} color="var(--gold)" />
                </div>

                {/* Info + Volume */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>🎧 Som Ambiente</span>
                    {ambientPlaying && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', animation: 'pulse 2s infinite', flexShrink: 0 }} />}
                  </div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {ambientVideo.title}
                  </div>
                  {/* Volume slider */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                    <VolumeX size={12} color="var(--text-muted)" />
                    <input
                      type="range" min="0" max="100" value={ambientVol}
                      onChange={(e) => setAmbientVol(Number(e.target.value))}
                      onClick={e => e.stopPropagation()}
                      style={{ flex: 1, height: 3, accentColor: 'var(--gold)', cursor: 'pointer' }}
                    />
                    <Volume2 size={12} color="var(--text-muted)" />
                    <span style={{ fontSize: '0.65rem', color: 'var(--gold)', fontWeight: 700, minWidth: 28, textAlign: 'right' }}>{ambientVol}%</span>
                  </div>
                </div>

                {/* Controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                  <button
                    onClick={() => setAmbientPlaying(!ambientPlaying)}
                    style={{
                      width: 36, height: 36, borderRadius: '50%', border: 'none', cursor: 'pointer',
                      background: ambientPlaying ? 'linear-gradient(135deg, var(--gold), #B8944F)' : 'rgba(255,255,255,0.08)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: ambientPlaying ? '#000' : 'var(--text)', transition: 'all 0.3s',
                    }}
                  >
                    {ambientPlaying ? <Pause size={16} fill="#000" /> : <Play size={16} fill="var(--text)" />}
                  </button>
                  <button
                    onClick={() => setAmbientVideo(null)}
                    style={{
                      width: 32, height: 32, borderRadius: '50%', border: 'none', cursor: 'pointer',
                      background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'var(--text-muted)', transition: 'all 0.2s',
                    }}
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <style jsx>{`
          @keyframes ambientPulse {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.4; transform: scale(0.8); }
          }
        `}</style>

        {/* Scroll To Top Button */}
        <AnimatePresence>
          {showToTop && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              style={{ position: "fixed", bottom: (playingVideo && !videoPlayerOpen) || ambientVideo ? 100 : 30, right: 24, zIndex: 100, width: 44, height: 44, borderRadius: "50%", background: "var(--gold)", color: "#111", border: "none", display: "flex", justifyContent: "center", alignItems: "center", boxShadow: "0 4px 12px rgba(0,0,0,0.3)", cursor: "pointer" }}
            >
              <ChevronUp size={24} />
            </motion.button>
          )}
        </AnimatePresence>

      </main>

      {/* Hidden audio for background playback */}
      {audioUrl && !playerOpen && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onTimeUpdate={() => setProg(audioRef.current?.currentTime || 0)}
          onLoadedMetadata={() => { setDur(audioRef.current?.duration || 0); setAudioLoading(false); }}
          onEnded={handleEnded}
          onError={() => setAudioLoading(false)}
        />
      )}
    </>
  );
}
