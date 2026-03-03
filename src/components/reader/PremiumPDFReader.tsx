'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BookOpen, Brain, GraduationCap, Mic, Zap, Podcast,
    ClipboardList, Send, X, Sparkles, ChevronLeft, ChevronRight, ChevronUp,
    Play, Pause, SkipBack, SkipForward, Volume2, Maximize2, Minimize2,
    Eye, EyeOff, Languages, ExternalLink, PenTool, Layout, Copy, Check, Lock, Unlock,
    Save, RotateCcw
} from 'lucide-react';

import DraggableTranslator from './DraggableTranslator';
import AnnotationLayer from './AnnotationLayer';
import { getMagicPrompt } from '@/lib/utils/magicPrompts';
import { LessonRenderer } from '@/components/study/LessonComponents';
import { useLesson } from '@/hooks/useLesson';

// Interfaces
interface Lesson {
    name: string;
    num: string;
    audio: { path: string; name: string };
    pdf?: { path: string; name: string };
}

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

interface Props {
    onBack: () => void;
    megaStructure?: any;
    megaLoading?: boolean;
}

// AI Actions (Premium)
const AI_ACTIONS = [
    {
        id: 'overview',
        label: 'Story Mode',
        sublabel: 'Aprenda com Histórias',
        icon: BookOpen,
        gradient: 'from-blue-500 to-cyan-400',
        prompt: `Crie uma micro-história envolvente usando o vocabulário desta lição.
Contexto: Situação do dia a dia.
Estrutura: Parágrafo em português com termos em inglês em destaque (ex: *teacher*).
Objetivo: Memorização por associação.`
    },
    {
        id: 'grammar',
        label: 'Kumon Style',
        sublabel: 'Regras Visuais e Repetitivas',
        icon: GraduationCap,
        gradient: 'from-emerald-500 to-teal-400',
        prompt: `Extraia a gramática no estilo Kumon (Visual & Repetitivo).
1. Padrão: [Exemplo visual]
2. Regra: [Explicação curta]
3. 3 Exemplos Práticos.`
    },
    {
        id: 'realuse',
        label: 'Real Talk',
        sublabel: 'Inglês da Rua',
        icon: Mic,
        gradient: 'from-purple-500 to-pink-400',
        prompt: `Como isso é falado na vida real?
Diferencie o "Book English" do "Spoken English".
Dê exemplos de gírias ou contrações comuns relacionadas a este tema.`
    },
    {
        id: 'flashcards',
        label: 'Flashcards',
        sublabel: 'Revisão Rápida',
        icon: Zap,
        gradient: 'from-amber-500 to-orange-400',
        prompt: `Gere Flashcards:
[Frente]: Palavra em Inglês
[Verso]: Tradução + Frase de Exemplo + Dica de Pronúncia (aportuguesada)`
    },
    {
        id: 'podcast',
        label: 'Podcast Script',
        sublabel: 'Roteiro NotebookLM',
        icon: Podcast,
        gradient: 'from-rose-500 to-red-400',
        prompt: `Gere um Roteiro de Podcast (Estilo NotebookLM Deep Dive).
Hosts: 1 Curioso, 1 Especialista.
Tom: Conversa natural, "mind-blown moments".
Conteúdo: Analise as nuances desta lição.`
    },
    {
        id: 'quiz',
        label: 'Quick Quiz',
        sublabel: 'Teste de 1 Minuto',
        icon: ClipboardList,
        gradient: 'from-indigo-500 to-blue-600',
        prompt: `Mini Quiz de 3 Perguntas (Múltipla Escolha).
Ao final, mostre as respostas corretas com explicações.`
    }
];

const PDF_NAMES: { [key: number]: string } = {
    1: 'ls01.pdf', 2: 'ls02.PDF', 3: 'LS03.pdf', 4: 'LS04.pdf', 5: 'LS05.pdf',
    6: 'LS06.pdf', 7: 'LS07.pdf', 8: 'LS08.pdf', 9: 'LS09.pdf', 10: 'LS10.pdf',
    11: 'LS11.pdf', 12: 'LS12.pdf', 13: 'LS13.pdf', 14: 'LS14.pdf', 15: 'LS15.pdf',
    16: 'LS16.pdf', 17: 'LS17.pdf', 18: 'LS18.pdf', 19: 'LS19.pdf', 20: 'LS20.pdf',
    21: 'LS21.pdf', 22: 'LS22.pdf', 23: 'LS23.pdf', 24: 'LS24.pdf',
    25: 'LS25-28.PDF', 26: 'LS25-28.PDF', 27: 'LS25-28.PDF', 28: 'LS25-28.PDF',
    29: 'LS29-31.PDF', 30: 'LS29-31.PDF', 31: 'LS29-31.PDF',
    32: 'LS32-34.PDF', 33: 'LS32-34.PDF', 34: 'LS32-34.PDF'
};

export default function PremiumPDFReader({ onBack }: Props) {
    // State
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [idx, setIdx] = useState(0);
    const lesson = lessons[idx];

    // Player
    const audioRef = useRef<HTMLAudioElement>(null);
    const [playing, setPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [currTime, setCurrTime] = useState(0);
    const [dur, setDur] = useState(0);
    // Removed speed control as requested (handled by extension)
    const [showLessonSelector, setShowLessonSelector] = useState(false);

    // UX
    const [darkMode, setDarkMode] = useState(false);
    const [copilotOpen, setCopilotOpen] = useState(true);
    const [translatorOpen, setTranslatorOpen] = useState(false);

    // Clean View - Fetch structured lesson data (ÚNICO modo)
    const lessonPath = lesson?.pdf?.path || '';
    const { data: lessonData, loading: lessonLoading, error: lessonError } = useLesson(lessonPath);

    // Chat
    const [msgs, setMsgs] = useState<Message[]>([
        { role: 'assistant', content: '👋 Olá! Bem-vindo. Escolha uma ação para começar.' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);

    // View & Magic Modes
    const [viewMode, setViewMode] = useState<'pdf' | 'clean' | 'magic'>('pdf');
    const [annotationMode, setAnnotationMode] = useState(false);
    const [generatingMagic, setGeneratingMagic] = useState(false);
    const [magicContent, setMagicContent] = useState<string | null>(null);

    const chatRef = useRef<HTMLDivElement>(null);
    const pdfContainerRef = useRef<HTMLDivElement>(null);

    // Init
    useEffect(() => {
        const _lessons: Lesson[] = [];
        for (let i = 1; i <= 34; i++) {
            const num = i.toString().padStart(2, '0');
            _lessons.push({
                name: `Lição ${num}`,
                num,
                audio: { path: `mega:Henrique/licao${num}.mp3`, name: `licao${num}.mp3` },
                pdf: PDF_NAMES[i] ? { path: `mega:Henrique/${PDF_NAMES[i]}`, name: PDF_NAMES[i] } : undefined
            });
        }
        setLessons(_lessons);
    }, []);

    // Scroll Chat
    useEffect(() => {
        if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }, [msgs]);

    // Audio Logic
    const togglePlay = () => {
        if (!audioRef.current) return;
        playing ? audioRef.current.pause() : audioRef.current.play();
        setPlaying(!playing);
    };
    const onTimeUpdate = () => {
        if (!audioRef.current) return;
        const c = audioRef.current.currentTime;
        const d = audioRef.current.duration;
        setCurrTime(c); setDur(d);
        if (d) setProgress((c / d) * 100);
    };
    const seek = (v: number) => {
        if (!audioRef.current) return;
        audioRef.current.currentTime = (v / 100) * audioRef.current.duration;
        setProgress(v);
    };
    const fmtTime = (s: number) => {
        const m = Math.floor(s / 60), sec = Math.floor(s % 60);
        return `${m}:${sec < 10 ? '0' : ''}${sec}`;
    };

    // Generate Magic Content HTML (FULL SCREEN & POLLINATIONS AI FLUX IMAGES)
    const generateMagicView = async () => {
        setGeneratingMagic(true);
        try {
            const res = await fetch('/api/pdf-ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    path: lesson?.pdf?.path,
                    message: getMagicPrompt(lesson?.name || 'Class', String(lesson?.num || '00')),
                    history: []
                })
            });

            // STREAM READER LOGIC (Prevents Timeouts)
            const reader = res.body?.getReader();
            if (!reader) throw new Error("Stream not supported");

            let html = "";
            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                html += decoder.decode(value, { stream: true });
                // We could update state here for 'typing' effect, but for HTML structure it's risky.
                // Keeping connection alive is the main goal.
            }
            // Sanitizer logic...
            const sanitize = (s: string) => {
                return s.replace(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi, (m, src) => {
                    let prompt = "Visual";
                    if (src.includes('/prompt/')) try { prompt = decodeURIComponent(src.split('/prompt/')[1].split('?')[0]) } catch { }
                    return `<div class="magic-placeholder my-12 w-full aspect-video rounded-2xl bg-[#0a0a0f] border border-white/10 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500/50 hover:bg-[#12121a] transition-all group shadow-2xl relative overflow-hidden" data-prompt="${prompt}"><div class="transform group-hover:scale-110 transition-transform duration-500 text-5xl grayscale group-hover:grayscale-0 mb-6">📸</div><div class="z-10 text-center"><p class="text-xs text-indigo-400 font-black uppercase tracking-[0.3em] mb-2">Visual Oculto</p><div class="px-6 py-2 rounded-full border border-white/10 bg-white/5 text-[10px] font-bold text-gray-400 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-transparent transition-colors flex items-center gap-2 mx-auto w-fit"><span class="uppercase tracking-wider">Clique para Gerar (Flux)</span></div></div></div>`;
                });
            };
            html = sanitize(html.replace(/```html\s*/g, '').replace(/```/g, ''));

            // Injetar wrapper de anotações no HTML gerado
            const wrappedHtml = `
                <div id="remastered-content" class="relative min-h-screen p-8 bg-[#0a0a0f] text-gray-200">
                    <div id="annotations-layer" class="absolute inset-0 pointer-events-none z-10"></div>
                    <div id="html-content" class="relative z-0">
                        ${html}
                    </div>
                </div>
            `;

            setMagicContent(wrappedHtml);
        } catch (e) {
            console.error(e);
        } finally {
            setGeneratingMagic(false);
        }
    };

    // Load Cache
    // Load Cache & Auto-Purge Legacy (V3 FINAL FLUSH)
    useEffect(() => {
        if (!lesson) return;
        const key = `magic_view_v3_${lesson.num}`;
        const cached = localStorage.getItem(key);

        if (cached) {
            // DETECT LEGACY CONTENT
            if (cached.includes('pollinations.ai') || cached.includes('we have moved')) {
                localStorage.removeItem(key);
                setMagicContent(null);
            } else {
                setMagicContent(cached);
            }
        } else {
            setMagicContent(null);
        }
    }, [lesson]);

    // EXORCIST: Ghost Hunter for Pollinations Images
    useEffect(() => {
        const interval = setInterval(() => {
            // Option 1: CSS Kill Switch (Inject style if not present)
            if (!document.getElementById('anti-ghost-style')) {
                const style = document.createElement('style');
                style.id = 'anti-ghost-style';
                style.innerHTML = `img[src*="pollinations"] { display: none !important; opacity: 0 !important; height: 0 !important; }`;
                document.head.appendChild(style);
            }

            // Option 2: DOM Removal
            const ghosts = document.querySelectorAll('img[src*="pollinations"]');
            if (ghosts.length > 0) {
                console.log(`👻 Exorcising ${ghosts.length} ghosts...`);
                ghosts.forEach(img => {
                    // Tentar substituir por botão de texto simples antes de remover
                    const div = document.createElement('div');
                    div.className = "p-4 border border-red-500/20 bg-red-500/10 rounded-lg text-red-500 text-xs font-mono text-center";
                    div.innerText = "[Visual Removido - Use o Botão Flux]";
                    img.replaceWith(div);
                });
            }
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    // PERSISTENCE & ANNOTATION LOGIC
    useEffect(() => {
        const container = document.getElementById('remastered-content');
        if (!container) return;

        const handleClick = async (e: MouseEvent) => {
            const target = e.target as HTMLElement;

            // 1. ANNOTATION: Mode Active or Alt + Click
            if (annotationMode || e.altKey) {
                const layer = document.getElementById('annotations-layer');
                if (!layer) return;

                const text = prompt('Anotação:');
                if (text) {
                    const note = document.createElement('div');
                    note.className = 'absolute pointer-events-auto bg-yellow-500/20 text-yellow-200 border border-yellow-500/50 p-2 rounded text-xs shadow-lg backdrop-blur-sm cursor-move';
                    note.style.left = `${e.offsetX}px`;
                    note.style.top = `${e.offsetY}px`;
                    note.innerHTML = `
                        <div class="flex items-center gap-2">
                            <span>📌 ${text}</span>
                            <button class="text-[8px] opacity-50 hover:opacity-100" onclick="this.parentElement.parentElement.remove()">✕</button>
                        </div>
                    `;
                    layer.appendChild(note);
                }
                return;
            }

            // 2. REVEAL IMAGE (Placeholder Click)
            const placeholder = target.closest('.magic-placeholder') as HTMLElement;
            if (placeholder && placeholder.dataset.prompt) {
                const promptVal = placeholder.dataset.prompt;

                placeholder.innerHTML = `
                    <div class="flex flex-col items-center gap-2 animate-pulse p-8 border border-white/5 rounded-xl bg-black/40">
                        <div class="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                        <span class="text-xs text-orange-400 font-bold uppercase tracking-widest">Gerando Visual (FLUX)...</span>
                    </div>
                `;

                try {
                    const res = await fetch('/api/generate-image', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            prompt: promptVal,
                            width: 1024,
                            height: 720, // Aspect 16:9ish
                            steps: 4
                        })
                    });
                    const data = await res.json();

                    if (data.success && data.image_path) {
                        const imageUrl = data.image_path;

                        // We construct wrapper manually to replace placeholder
                        const wrapper = document.createElement('div');
                        wrapper.className = "relative group cursor-pointer overflow-hidden rounded-xl";
                        wrapper.innerHTML = `
                            <img src="${imageUrl}" class="w-full h-full object-cover shadow-2xl transition-transform duration-700 hover:scale-105 magic-image z-0" data-prompt="${promptVal}" />
                            
                            <!-- Overlay Controls -->
                            <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 p-6 flex items-end justify-between z-10">
                                <span class="text-[10px] font-mono text-white/50 uppercase tracking-widest">FLUX GENERATED</span>
                                
                                <button data-action="reroll" class="bg-white/10 hover:bg-orange-500 text-white hover:text-white border border-white/20 hover:border-orange-500 rounded-lg px-4 py-2 flex items-center gap-2 backdrop-blur-md transition-all shadow-lg active:scale-95 group/btn">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="group-hover/btn:rotate-180 transition-transform duration-500"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"></path><path d="M16 16h5v5"></path></svg>
                                    <span class="text-xs font-bold uppercase tracking-wide">Recriar</span>
                                </button>
                            </div>
                        `;
                        placeholder.replaceWith(wrapper);
                    } else {
                        // Error fallback
                        placeholder.innerHTML = `<div class="text-red-500 text-xs">Erro: ${data.error || 'Falha na geração'}</div>`;
                    }
                } catch (err) {
                    placeholder.innerHTML = `<div class="text-red-500 text-xs">Erro de conexão</div>`;
                }
                return;
            }

            // 3. INFINITE RE-ROLL (Click on Button or Image)
            const rerollBtn = target.closest('[data-action="reroll"]');
            if (rerollBtn || target.classList.contains('magic-image')) {
                // Determine image element
                let img: HTMLImageElement | null = null;
                if (target.classList.contains('magic-image')) {
                    img = target as HTMLImageElement;
                } else if (rerollBtn) {
                    // Find sibling image in the same wrapper
                    const wrapper = rerollBtn.closest('.group');
                    img = wrapper?.querySelector('.magic-image') as HTMLImageElement;
                }

                if (!img) return;

                const p = img.dataset.prompt;
                if (!p) return;

                // Visual Feedback
                const originalSrc = img.src;
                img.style.opacity = '0.3';
                img.style.filter = 'blur(4px)';

                // Show loading spinner overlay
                const loadingOverlay = document.createElement('div');
                loadingOverlay.className = "absolute inset-0 flex items-center justify-center pointer-events-none z-20";
                loadingOverlay.innerHTML = `<div class="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>`;
                img.parentElement?.appendChild(loadingOverlay);

                try {
                    const res = await fetch('/api/generate-image', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            prompt: p,
                            width: 1024,
                            height: 720,
                            steps: 4
                        })
                    });
                    const data = await res.json();
                    if (data.success && data.image_path) {
                        // Anti-cache trick
                        img.src = `${data.image_path}?t=${Date.now()}`;
                    }
                } catch (e) {
                    console.error("Re-roll failed", e);
                    alert("Falha ao gerar nova imagem.");
                } finally {
                    img.style.opacity = '1';
                    img.style.filter = 'none';
                    loadingOverlay.remove();
                }
            }
        };

        container.addEventListener('click', handleClick);
        return () => container.removeEventListener('click', handleClick);
    }, [magicContent]);

    const saveMagicProgress = () => {
        const container = document.getElementById('remastered-content');
        if (!container || !lesson) return;

        // Capturar o HTML atual do container (incluindo inputs preenchidos e anotações)
        // Nota: Para inputs, precisamos serializar o valor manualmente ou usar uma técnica de clonagem
        const inputs = container.querySelectorAll('input, textarea');
        inputs.forEach((input: any) => {
            input.setAttribute('value', input.value);
            if (input.tagName === 'TEXTAREA') input.innerHTML = input.value;
        });

        const key = `magic_view_v3_${lesson.num}`;
        localStorage.setItem(key, container.innerHTML);
        alert('Lição Remasterizada Salva! Seu progresso está seguro.');
    };

    const isLocked = lesson && typeof window !== 'undefined' && !!localStorage.getItem(`magic_view_v3_${lesson.num}`);


    // Chat Logic
    const send = async (txt: string) => {
        if (!txt.trim()) return;
        setMsgs(p => [...p, { role: 'user', content: txt }]);
        setInput('');
        setLoading(true);
        try {
            const res = await fetch('/api/pdf-ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ path: lesson?.pdf?.path, message: txt, history: msgs.slice(-4) })
            });
            const d = await res.json();
            const clean = (d.reply || 'Error.').replace(/\*\*/g, '').replace(/`/g, '');
            setMsgs(p => [...p, { role: 'assistant', content: clean }]);
        } catch {
            setMsgs(p => [...p, { role: 'assistant', content: 'Connection error.' }]);
        } finally {
            setLoading(false);
        }
    };

    const pdfUrl = lesson?.pdf ? `/api/gdrive/stream?path=${encodeURIComponent(lesson.pdf.path)}` : null;
    const audioUrl = lesson?.audio ? `/api/gdrive/stream?path=${encodeURIComponent(lesson.audio.path)}` : null;

    return (
        <div className="h-screen flex flex-col bg-[#050507] text-gray-100 overflow-hidden font-sans">

            {/* === HEADER (Ultra Premium) === */}
            <header className="h-14 bg-[#0a0a0f]/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-6 z-40 shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/50 hover:text-white">
                        <ChevronLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-sm font-bold tracking-wide text-white">FUNDAMENTALS</h1>
                        <div className="flex items-center gap-2 text-[10px] text-white/40 font-mono uppercase">
                            <span>English B1</span>
                            <span className="w-1 h-1 bg-white/20 rounded-full" />
                            <span>{
                                viewMode === 'pdf' ? 'PDF View' :
                                    viewMode === 'clean' ? 'Clean View 🎯' :
                                        'Magic View ✨'
                            }</span>
                        </div>
                    </div>
                </div>

                {/* View Mode Toggle */}
                <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1 bg-[#12121a] p-1 rounded-full border border-white/5 shadow-2xl">
                    <button
                        onClick={() => setViewMode('pdf')}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 ${viewMode === 'pdf' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                        📄 PDF Original
                    </button>
                    <button
                        onClick={() => setViewMode('clean')}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 ${viewMode === 'clean' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'text-gray-400 hover:text-white'}`}
                    >
                        🎯 Clean View
                    </button>
                    <button
                        onClick={() => {
                            setViewMode('magic');
                            if (!magicContent) generateMagicView();
                        }}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 ${viewMode === 'magic' ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-purple-500/20' : 'text-gray-400 hover:text-white'}`}
                    >
                        <Sparkles size={12} />
                        Magic View
                    </button>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => window.open('https://notebooklm.google.com/', '_blank')}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-400 hover:text-white hover:bg-white/5 flex items-center gap-2 transition-all mr-2"
                        title="Open NotebookLM"
                    >
                        <ExternalLink size={14} />
                        <span className="hidden lg:inline">Notebook</span>
                    </button>

                    <button
                        onClick={() => setTranslatorOpen(!translatorOpen)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-2 ${translatorOpen ? 'bg-blue-500/20 text-blue-400' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                        title="Translator (Ctrl+Shift+T)"
                    >
                        <Languages size={14} />
                        <span className="hidden lg:inline">Tradutor</span>
                    </button>

                    {/* PDF-Only Controls */}
                    {viewMode === 'pdf' && (
                        <>
                            <div className="flex bg-[#12121a] rounded-lg p-1 border border-white/5">
                                <button onClick={() => setDarkMode(false)} className={`p-1.5 rounded-md transition-all ${!darkMode ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-white'}`}>
                                    <Eye size={14} />
                                </button>
                                <button onClick={() => setDarkMode(true)} className={`p-1.5 rounded-md transition-all ${darkMode ? 'bg-[#2a2a35] text-white shadow-sm' : 'text-gray-500 hover:text-white'}`}>
                                    <EyeOff size={14} />
                                </button>
                            </div>
                            <div className="w-px h-4 bg-white/10" />
                            <button
                                onClick={() => setAnnotationMode(!annotationMode)}
                                className={`p-2 rounded-lg transition-all ${annotationMode ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/20' : 'text-gray-400 hover:bg-white/5'}`}
                                title="Annotation Mode"
                            >
                                <PenTool size={18} />
                            </button>
                        </>
                    )}

                    <button
                        onClick={() => setCopilotOpen(!copilotOpen)}
                        className={`p-2 rounded-lg transition-all ${copilotOpen ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5'}`}
                    >
                        <Layout size={18} />
                    </button>
                </div>
            </header>

            {/* === MAIN WORKSPACE === */}
            <div className="flex-1 flex overflow-hidden relative">

                {/* Content Area */}
                <div ref={pdfContainerRef} className={`flex-1 relative flex items-center justify-center overflow-hidden ${viewMode === 'pdf' ? 'bg-[#2a2a30] p-4' : 'bg-[#050507]'}`}>
                    {/* Floating Translator */}
                    <AnimatePresence>
                        {translatorOpen && <DraggableTranslator isOpen={translatorOpen} onClose={() => setTranslatorOpen(false)} />}
                    </AnimatePresence>

                    {viewMode === 'pdf' ? (
                        pdfUrl ? (
                            <div className={`relative w-full h-full max-w-5xl shadow-2xl transition-all duration-500 ${darkMode ? 'brightness-75 contrast-125' : ''}`}>
                                {/* Annotation Overlay */}
                                <div className="absolute inset-0 z-30 pointer-events-none">
                                    <AnnotationLayer
                                        width={pdfContainerRef.current?.clientWidth || 0}
                                        height={pdfContainerRef.current?.clientHeight || 0}
                                        active={annotationMode}
                                    />
                                </div>

                                <iframe
                                    src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                                    className={`w-full h-full bg-white transition-all duration-300 ${darkMode ? 'invert hue-rotate-180' : ''}`}
                                    style={{ borderRadius: '8px' }}
                                />
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-4 opacity-30">
                                <div className="w-16 h-16 border-4 border-t-white border-white/20 rounded-full animate-spin" />
                                <p className="font-mono text-sm tracking-widest">LOADING PDF...</p>
                            </div>
                        )
                    ) : viewMode === 'clean' ? (
                        // CLEAN VIEW - Structured Deterministic Rendering
                        <div className="w-full h-full overflow-y-auto custom-scrollbar">
                            {lessonLoading ? (
                                <div className="h-full flex flex-col items-center justify-center gap-6 p-12">
                                    <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-indigo-500/20 to-blue-600/20 flex items-center justify-center border border-white/5 animate-pulse relative">
                                        <Layout size={40} className="text-indigo-500" />
                                        <div className="absolute inset-x-[-20%] inset-y-[-20%] border border-indigo-500/20 rounded-[40px] animate-[ping_3s_infinite]" />
                                    </div>
                                    <div className="text-center space-y-2">
                                        <h3 className="text-2xl font-black text-white tracking-widest uppercase">Extracting Structure...</h3>
                                        <p className="text-gray-500 text-sm max-w-xs mx-auto">Analyzing PDF layout and content...</p>
                                    </div>
                                </div>
                            ) : lessonError ? (
                                <div className="h-full flex flex-col items-center justify-center gap-4 p-12 text-center">
                                    <div className="w-20 h-20 rounded-2xl bg-red-500/10 flex items-center justify-center border border-red-500/20">
                                        <X size={32} className="text-red-500" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-red-400 mb-2">Extraction Failed</h3>
                                        <p className="text-gray-500 text-sm max-w-md">{lessonError}</p>
                                    </div>
                                </div>
                            ) : lessonData ? (
                                <LessonRenderer data={lessonData} />
                            ) : (
                                <div className="h-full flex items-center justify-center text-gray-500">
                                    No lesson data available
                                </div>
                            )}
                        </div>
                    ) : (
                        // MAGIC VIEW RENDERER (INTERACTIVE WORKBOOK)
                        <div className="w-full h-full relative overflow-hidden bg-[#050507] flex flex-col">
                            {/* Modern Toolbar (Persistent Overlay) */}
                            {viewMode === 'magic' && magicContent && (
                                <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-top-4 duration-500">
                                    <div className="bg-[#0a0a0f]/80 backdrop-blur-xl border border-white/10 rounded-2xl px-6 py-3 flex items-center gap-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                                        <div className="flex items-center gap-3 pr-6 border-r border-white/10">
                                            <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
                                                <Sparkles size={16} />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black text-white uppercase tracking-tighter">Active Workbook</span>
                                                <span className="text-[9px] text-gray-500 font-medium">Auto-Sync Ativo</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <button
                                                onClick={() => setAnnotationMode(!annotationMode)}
                                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all text-xs font-bold ${annotationMode
                                                    ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.2)]'
                                                    : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                                                    }`}
                                            >
                                                <PenTool size={12} />
                                                {annotationMode ? 'MODO CANETA' : 'ANOTAR'}
                                            </button>

                                            <button
                                                onClick={saveMagicProgress}
                                                className="group flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white rounded-xl text-xs font-black transition-all shadow-lg shadow-orange-500/20 active:scale-95"
                                            >
                                                <Save size={14} className="group-hover:rotate-12 transition-transform" />
                                                SALVAR ESTUDO
                                            </button>

                                            <button
                                                onClick={() => {
                                                    if (confirm('Deseja resetar esta lição? Todos os dados preenchidos e anotações serão perdidos.')) {
                                                        localStorage.removeItem(`magic_view_v3_${lesson?.num}`);
                                                        setMagicContent(null);
                                                    }
                                                }}
                                                className="p-2 hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-all rounded-lg"
                                                title="Resetar Workbook"
                                            >
                                                <RotateCcw size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="flex-1 overflow-y-auto custom-scrollbar">
                                {generatingMagic ? (
                                    <div className="h-full flex flex-col items-center justify-center gap-6 p-12">
                                        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-orange-500/20 to-purple-600/20 flex items-center justify-center border border-white/5 animate-pulse relative">
                                            <Sparkles size={40} className="text-orange-500" />
                                            <div className="absolute inset-x-[-20%] inset-y-[-20%] border border-orange-500/20 rounded-[40px] animate-[ping_3s_infinite]" />
                                        </div>
                                        <div className="text-center space-y-2">
                                            <h3 className="text-2xl font-black text-white tracking-widest uppercase italic">Remasterizando...</h3>
                                            <p className="text-gray-500 text-sm max-w-xs mx-auto">Convertendo PDF estático em um ambiente interativo de alta fidelidade.</p>
                                        </div>
                                    </div>
                                ) : magicContent ? (
                                    <div
                                        id="magic-container"
                                        className={`w-full max-w-5xl mx-auto pt-24 pb-32 animate-in fade-in slide-in-from-bottom-8 duration-1000 ${annotationMode ? 'cursor-crosshair' : ''}`}
                                        dangerouslySetInnerHTML={{ __html: magicContent }}
                                    />
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center p-12 text-center">
                                        <div className="w-24 h-24 mb-6 rounded-[32px] bg-gradient-to-br from-orange-500/10 to-purple-600/10 flex items-center justify-center border border-white/5">
                                            <Sparkles size={40} className="text-orange-500" />
                                        </div>
                                        <div className="max-w-md space-y-4 mb-10">
                                            <h3 className="text-3xl font-black text-white tracking-tight uppercase">Active Learning Hub</h3>
                                            <p className="text-gray-400 text-sm leading-relaxed">
                                                Transforme seu PDF em um material interativo. Preencha campos, rabisque anotações e revele visuais cinematográficos sob demanda.
                                            </p>
                                        </div>
                                        <button
                                            onClick={generateMagicView}
                                            className="group relative px-10 py-5 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white font-black rounded-2xl shadow-[0_20px_50px_rgba(249,115,22,0.3)] transition-all hover:-translate-y-1 active:scale-95 flex items-center gap-4 uppercase tracking-[0.2em] text-[10px]"
                                        >
                                            <Sparkles size={18} className="group-hover:rotate-45 transition-transform duration-500" />
                                            Iniciar Remasterização
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Copilot Sidebar (Megazord) */}
                <AnimatePresence>
                    {copilotOpen && (
                        <motion.aside
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: 420, opacity: 1 }}
                            exit={{ width: 0, opacity: 0 }}
                            className="bg-[#050507] border-l border-white/5 flex flex-col shrink-0 z-40 shadow-2xl"
                        >
                            {/* Header Gradient Area */}
                            <div className="relative p-6 pb-8 overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-b from-indigo-900/20 to-transparent pointer-events-none" />
                                <div className="relative z-10 flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-[1px] shadow-[0_0_20px_rgba(168,85,247,0.3)]">
                                            <div className="w-full h-full bg-[#0a0a0f] rounded-2xl flex items-center justify-center">
                                                <Brain size={20} className="text-white" />
                                            </div>
                                        </div>
                                        <div>
                                            <h2 className="font-bold text-lg text-white tracking-tight">Learning Copilot</h2>
                                            <div className="flex items-center gap-1.5">
                                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Gemini 2.0 Flash</p>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setCopilotOpen(false)}
                                        className="p-2 hover:bg-white/10 rounded-lg text-gray-400 transition-colors"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>

                                {/* Premium Action Grid */}
                                <div className="grid grid-cols-2 gap-2.5 relative z-10">
                                    {AI_ACTIONS.map(act => (
                                        <button
                                            key={act.id}
                                            onClick={() => send(act.prompt)}
                                            className="group relative h-20 px-3 py-2.5 rounded-xl border border-white/5 bg-[#12121a] hover:bg-[#181820] transition-all text-left overflow-hidden hover:border-white/10 hover:shadow-lg hover:-translate-y-0.5"
                                        >
                                            <div className={`absolute top-0 right-0 w-16 h-16 bg-gradient-to-br ${act.gradient} opacity-[0.08] blur-xl rounded-full group-hover:opacity-20 transition-opacity`} />
                                            <div className="relative z-10 flex flex-col justify-between h-full">
                                                <div className={`text-gray-400 group-hover:text-white transition-colors`}>
                                                    <act.icon size={18} />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-xs text-gray-200 group-hover:text-white">{act.label}</div>
                                                    <div className="text-[9px] text-gray-500 font-medium truncate group-hover:text-gray-400">{act.sublabel}</div>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Chat Area */}
                            <div className="flex-1 overflow-y-auto px-4 space-y-5 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                                {msgs.map((m, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`flex flex-col gap-1 ${m.role === 'user' ? 'items-end' : 'items-start'}`}
                                    >
                                        <div className={`max-w-[90%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm relative group ${m.role === 'user'
                                            ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-br-none'
                                            : 'bg-[#12121a] border border-white/5 text-gray-300 rounded-bl-none'
                                            }`}>
                                            <div className="whitespace-pre-wrap">{m.content}</div>
                                            {m.role === 'assistant' && (
                                                <button
                                                    onClick={() => navigator.clipboard.writeText(m.content)}
                                                    className="absolute -bottom-6 left-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[10px] text-gray-500 hover:text-white px-2 py-1"
                                                >
                                                    <Copy size={10} /> Copiar para NotebookLM
                                                </button>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                                {loading && (
                                    <div className="flex items-center gap-2 p-4 opacity-50">
                                        <Sparkles size={14} className="animate-spin text-purple-500" />
                                        <span className="text-xs text-gray-500">Thinking...</span>
                                    </div>
                                )}
                                <div ref={chatRef} className="h-4" />
                            </div>

                            {/* Input Area */}
                            <div className="p-5 border-t border-white/5 bg-[#050507]">
                                <div className="relative bg-[#12121a] rounded-xl border border-white/5 focus-within:border-white/20 focus-within:ring-1 focus-within:ring-white/10 transition-all shadow-inner">
                                    <input
                                        type="text"
                                        value={input}
                                        onChange={e => setInput(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && send(input)}
                                        placeholder="Pergunte sobre a lição..."
                                        disabled={loading}
                                        className="w-full bg-transparent p-4 pr-12 text-sm text-white placeholder-gray-600 focus:outline-none"
                                    />
                                    <button
                                        onClick={() => send(input)}
                                        disabled={!input.trim() || loading}
                                        className="absolute right-2 top-2 p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white disabled:opacity-30 transition-all"
                                    >
                                        <Send size={16} />
                                    </button>
                                </div>
                                <div className="mt-2 text-center">
                                    <p className="text-[10px] text-gray-600">
                                        Use <kbd className="font-mono text-gray-500">Ctrl+Shift+T</kbd> para abrir o tradutor a qualquer momento.
                                    </p>
                                </div>
                            </div>
                        </motion.aside>
                    )}
                </AnimatePresence>
            </div>

            {/* === PLAYER FOOTER (Modern) === */}
            <div className="h-24 bg-[#08080c] border-t border-white/5 flex items-center justify-between px-8 z-50">
                {/* Lesson Selector (NEW DROPDOWN) */}
                <div className="relative w-64">
                    <div className="flex items-center gap-2 bg-[#12121a] p-1.5 rounded-xl border border-white/5">
                        <button onClick={() => idx > 0 && setIdx(idx - 1)} disabled={idx === 0} className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white disabled:opacity-30">
                            <ChevronLeft size={18} />
                        </button>

                        <button
                            onClick={() => setShowLessonSelector(!showLessonSelector)}
                            className="flex-1 flex items-center justify-center gap-2 text-sm font-bold text-white hover:bg-white/5 py-1.5 rounded-lg transition-colors"
                        >
                            <span>{lesson?.name || 'Loading'}</span>
                            <ChevronUp size={14} className={`transition-transform ${showLessonSelector ? 'rotate-180' : ''}`} />
                        </button>

                        <button onClick={() => idx < lessons.length - 1 && setIdx(idx + 1)} disabled={idx === lessons.length - 1} className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white disabled:opacity-30">
                            <ChevronRight size={18} />
                        </button>
                    </div>

                    {/* Popover List */}
                    <AnimatePresence>
                        {showLessonSelector && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="absolute bottom-full left-0 w-full mb-2 bg-[#12121a] border border-white/10 rounded-xl shadow-2xl max-h-80 overflow-y-auto z-[100] scrollbar-thin scrollbar-thumb-white/10"
                            >
                                {lessons.map((l, i) => (
                                    <button
                                        key={i}
                                        onClick={() => { setIdx(i); setShowLessonSelector(false); }}
                                        className={`w-full text-left px-4 py-3 text-xs font-medium border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors ${i === idx ? 'text-indigo-400 bg-indigo-500/10' : 'text-gray-400'}`}
                                    >
                                        {l.name}
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Main Controls */}
                <div className="flex flex-col items-center gap-3 flex-1 max-w-2xl px-8">
                    <div className="flex items-center gap-8">
                        <button onClick={() => audioRef.current && (audioRef.current.currentTime -= 10)} className="text-gray-500 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full"><SkipBack size={20} /></button>
                        <button
                            onClick={togglePlay}
                            className="w-14 h-14 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] transition-all shadow-xl"
                        >
                            {playing ? <Pause size={24} fill="black" /> : <Play size={24} fill="black" className="ml-1" />}
                        </button>
                        <button onClick={() => audioRef.current && (audioRef.current.currentTime += 10)} className="text-gray-500 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full"><SkipForward size={20} /></button>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full flex items-center gap-4 text-[11px] font-mono text-gray-500">
                        <span className="w-10 text-right">{fmtTime(currTime)}</span>
                        <div className="flex-1 h-1.5 bg-white/5 rounded-full relative group cursor-pointer overflow-hidden">
                            <div className="absolute inset-0 bg-white/5 group-hover:bg-white/10 transition-colors" />
                            <motion.div
                                className="absolute h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full"
                                style={{ width: `${progress}%` }}
                                layoutId="progress"
                            />
                            <input type="range" min="0" max="100" value={progress} onChange={e => seek(parseFloat(e.target.value))} className="absolute inset-0 opacity-0 cursor-pointer" />
                        </div>
                        <span className="w-10">{fmtTime(dur)}</span>
                    </div>
                </div>

                {/* Right Actions */}
                <div className="w-64 flex justify-end items-center gap-6">
                    <div className="flex items-center gap-3">
                        <Volume2 size={18} className="text-gray-500" />
                        <div className="w-24 h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div className="w-3/4 h-full bg-gray-500 rounded-full" />
                        </div>
                    </div>
                </div>

                <audio ref={audioRef} src={audioUrl || undefined} onTimeUpdate={onTimeUpdate} onEnded={() => setPlaying(false)} />
            </div>
        </div>
    );
}
