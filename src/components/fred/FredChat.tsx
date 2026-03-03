"use client";

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Paperclip, Send, X, Sparkles, Loader2, Trash2, Volume2, ClipboardPaste } from 'lucide-react';
import { cn } from '@/lib/utils/utils';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    image?: string;
}

// Limpa markdown para texto legível
// Limpa markdown para texto legível (mas PRESERVA IMAGENS para renderização)
function formatMessage(text: string): string {
    return text
        .replace(/^#{1,6}\s*/gm, '')
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        // Preserva imagens ![...](...) mas formata links [...] (...)
        .replace(/(!?)\[(.*?)\]\((.*?)\)/g, (match, prefix, label, url) => {
            if (prefix === '!') return match;
            return `${label} (${url})`;
        })
        .replace(/`{1,3}(.*?)`{1,3}/g, '$1')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

declare global {
    interface Window {
        MediaRecorder: any;
    }
}

export function FredChat() {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [autoplayEnabled, setAutoplayEnabled] = useState(false); // ← Padrão: DESLIGADO
    const mediaRecorderRef = useRef<any>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const currentAudioRef = useRef<HTMLAudioElement | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const textInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'assistant',
            content: 'E aí, Henrique! Fred na área. Pronto para construir o futuro hoje?',
            timestamp: new Date(),
        }
    ]);

    // Listener para abrir via evento e Atalho de Teclado (Alt + A)
    useEffect(() => {
        const handleOpen = () => setIsOpen(true);
        window.addEventListener('open-fred', handleOpen);

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.altKey && e.key.toLowerCase() === 'a') {
                e.preventDefault();
                setIsOpen(prev => !prev);
            }
            if (e.key === 'Escape' && isOpen) {
                setIsOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('open-fred', handleOpen);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen]);

    // Auto-scroll e Auto-Focus
    useEffect(() => {
        if (isOpen) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            if (!isLoading) {
                setTimeout(() => textInputRef.current?.focus(), 100);
            }
        }
    }, [messages, isOpen, isLoading]);

    // Cleanup preview URL e Audio
    useEffect(() => {
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
            if (currentAudioRef.current) currentAudioRef.current.pause();
        };
    }, [previewUrl]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            const file = e.target.files[0];
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const clearFile = () => {
        setSelectedFile(null);
        setPreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // Handler de Ctrl+V para colar imagens
    const handlePaste = async (e: React.ClipboardEvent) => {
        const items = e.clipboardData?.items;
        if (!items) return;

        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const blob = items[i].getAsFile();
                if (blob) {
                    setSelectedFile(blob);
                    const url = URL.createObjectURL(blob);
                    setPreviewUrl(url);
                }
                break;
            }
        }
    };

    // Botão de colar da área de transferência
    const handlePasteButton = async () => {
        try {
            const clipboardItems = await navigator.clipboard.read();
            for (const item of clipboardItems) {
                for (const type of item.types) {
                    if (type.startsWith('image/')) {
                        const blob = await item.getType(type);
                        setSelectedFile(blob as File);
                        const url = URL.createObjectURL(blob);
                        setPreviewUrl(url);
                        return;
                    }
                }
            }
        } catch (err) {
            console.log('Erro ao acessar clipboard:', err);
        }
    };

    // --- LÓGICA DE ÁUDIO ---

    const stopCurrentSpeech = () => {
        if (currentAudioRef.current) {
            console.log("🔇 Interrompendo áudio anterior...");
            currentAudioRef.current.pause();
            currentAudioRef.current = null;
        }
    };

    // Audio Context Warmup para vencer Autoplay Policy
    const audioContextRef = useRef<AudioContext | null>(null);
    const gainNodeRef = useRef<GainNode | null>(null);

    // Inicializa contexto de áudio
    const initAudioContext = () => {
        if (!audioContextRef.current) {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            audioContextRef.current = new AudioContext();
            // Ganho (Volume)
            gainNodeRef.current = audioContextRef.current.createGain();
            gainNodeRef.current.connect(audioContextRef.current.destination);
        }
        if (audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume();
        }
    };

    // Função manual para tocar TTS (JS Puro + AudioContext)
    const playManualTTS = async (text: string) => {
        console.log("🔊 Tocando TTS:", text.substring(0, 50) + "...");

        try {
            // Se tiver player HTML anterior, pausa
            if (currentAudioRef.current) {
                currentAudioRef.current.pause();
                currentAudioRef.current = null;
            }

            // Remove markdown básico
            const cleanText = text.replace(/[*#_]/g, '');
            const url = `http://localhost:8001/api/fred/tts?text=${encodeURIComponent(cleanText)}`;

            // Cria novo player
            const audio = new Audio(url);
            currentAudioRef.current = audio; // Guarda ref

            // Log de eventos para debug
            audio.addEventListener('canplaythrough', () => console.log('✅ Áudio carregado e pronto!'));
            audio.addEventListener('error', (e) => console.error('❌ Erro no carregamento do áudio:', e));

            // Promise para tocar
            try {
                await audio.play();
                console.log("✅ Play executado com sucesso!");
            } catch (err) {
                console.error("❌ Erro autoplay (Block):", err);
                console.log("⚠️ Tentando forçar via User Interaction futura...");
            }

        } catch (error) {
            console.error("❌ Erro geral audio:", error);
        }
    };

    // Função para deletar imagem gerada
    const handleDeleteImage = async (imageUrl: string) => {
        if (!confirm("Tem certeza que deseja EXCLUIR esta imagem do servidor?")) return;
        try {
            // Extrair path relativo do URL
            // URL Típica: http://localhost:8001/vault/images/...
            // Path para API: /vault/images/...
            const urlObj = new URL(imageUrl);
            const path = urlObj.pathname;

            await fetch(`http://localhost:8001/api/fred/image?path=${encodeURIComponent(path)}`, {
                method: "DELETE"
            });
            alert("✅ Imagem deletada com sucesso!");

            // Opcional: Remover visualmente (recarregar página ou filtrar messages)
            // window.location.reload(); 
        } catch (error) {
            console.error(error);
            alert("❌ Erro ao deletar imagem.");
        }
    };

    const startRecording = async () => {
        initAudioContext(); // 🔊 WARMUP Áudio
        stopCurrentSpeech(); // Para de falar se estiver falando algo
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
            });

            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event: any) => {
                if (event.data.size > 0) audioChunksRef.current.push(event.data);
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

                // LIBERAR MICROFONE IMEDIATAMENTE (CRÍTICO)
                // Se não liberar, o driver pode ficar ocupado e bloquear o áudio de resposta
                stream.getTracks().forEach(track => {
                    track.stop();
                    console.log("🎤 Microfone liberado (Track stopped)");
                });

                await handleAudioUpload(audioBlob);
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (err: any) {
            console.error("Erro ao acessar microfone:", err);
            alert("Microfone não disponível.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            // Tracks são fechadas no evento onstop acima
        }
    };

    const handleAudioUpload = async (audioBlob: Blob) => {
        setIsLoading(true);
        const formData = new FormData();
        formData.append("file", audioBlob, "recording.webm");

        try {
            // 1. Transcrever (Usando rota nova /api/fred)
            const sttRes = await fetch("http://localhost:8001/api/fred/stt", {
                method: "POST",
                body: formData
            });

            if (!sttRes.ok) throw new Error("Erro na transcrição");
            const sttData = await sttRes.json();
            const transcribedText = sttData.transcription;

            if (!transcribedText) throw new Error("Áudio vazio");

            // 2. Adicionar mensagem do usuário
            const userMsg: Message = {
                id: Date.now().toString(),
                role: 'user',
                content: transcribedText,
                timestamp: new Date(),
                image: previewUrl || undefined
            };
            setMessages(prev => [...prev, userMsg]);

            // 3. Obter resposta do Fred (Usando endpoint unificado para suportar Imagem + Texto)
            const chatFormData = new FormData();
            chatFormData.append("message", transcribedText);
            const historyToSend = messages.map(m => ({ role: m.role, content: m.content }));
            chatFormData.append('history', JSON.stringify(historyToSend));
            if (selectedFile) chatFormData.append("file", selectedFile);

            // Limpar anexo após anexar ao envio
            setSelectedFile(null);
            setPreviewUrl(null);

            const chatRes = await fetch("http://localhost:8001/api/fred/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: transcribedText,
                    autoplay: autoplayEnabled // ← AGORA SIM: Flag adicionada! 
                })
            });

            const chatData = await chatRes.json();
            const assistantText = chatData.response;

            // 4. Adicionar resposta na tela
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: assistantText,
                timestamp: new Date()
            }]);

            // ← NOVO: TTS Automático se autoplay estiver ativo (igual ao handleSend)
            console.log(`🎤 Status Autoplay (Voz) -> Flag Resposta: ${chatData.autoplay}, Toggle Chat: ${autoplayEnabled}`);

            if (autoplayEnabled) {
                console.log("🔊 Autoplay disparando áudio (via Voz)...");
                playManualTTS(assistantText).catch(e => console.error("❌ Falha autoplay voz:", e));
            }

        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'assistant',
                content: "Opa, tive um problema aqui. Pode falar de novo?",
                timestamp: new Date()
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    // State de Persona
    const [selectedPersona, setSelectedPersona] = useState('fred');

    const PERSONAS = [
        { id: 'fred', name: 'Fred (Sócio)', color: 'text-emerald-400' },
        { id: 'coder', name: 'Code Ninja (Qwen)', color: 'text-blue-400' },
        { id: 'copywriter_elite', name: 'Copywriter (DeepSeek)', color: 'text-pink-400' }
    ];

    // ... (rest of states) ...

    const handleSend = async () => {
        if ((!input.trim() && !selectedFile) || isLoading) return;

        initAudioContext();
        stopCurrentSpeech();

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input,
            timestamp: new Date(),
            image: previewUrl || undefined
        };

        setMessages(prev => [...prev, userMessage]);

        // Payload
        const payload = {
            message: input,
            autoplay: autoplayEnabled,
            history: messages.map(m => ({ role: m.role, content: m.content })),
            task_type: selectedPersona, // <-- ENVIANDO PERSONA
            model: 'auto' // Deixa o backend decidir (Qwen ou DeepSeek) baseado na persona
        };

        setInput('');
        setSelectedFile(null);
        setPreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        setIsLoading(true);

        try {
            const response = await fetch('http://localhost:8001/api/fred/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            // ... (rest of handleSend) ...


            if (!response.ok) throw new Error('Falha na comunicação');

            const data = await response.json();
            const assistantText = data.response;

            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: assistantText,
                timestamp: new Date()
            }]);

            // ← NOVO: TTS Automático se autoplay estiver ativo
            console.log(`🎤 Status Autoplay -> Flag Resposta: ${data.autoplay}, Toggle Chat: ${autoplayEnabled}`);

            if (autoplayEnabled) {
                // Nota: Verificamos o toggle local como fonte de verdade final
                console.log("🔊 Autoplay disparando áudio...");
                playManualTTS(assistantText).catch(e => console.error("❌ Falha autoplay:", e));
            }

        } catch {
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'assistant',
                content: "Erro de conexão com o Fred.",
                timestamp: new Date(),
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClearChat = () => {
        stopCurrentSpeech();
        setMessages([{
            id: '1',
            role: 'assistant',
            content: 'Conversa limpa. O que temos para agora?',
            timestamp: new Date(),
        }]);
    };

    if (!isOpen) return null;

    return (
        <>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/80 backdrop-blur-lg z-[999]"
                onClick={() => setIsOpen(false)}
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: "spring", duration: 0.3 }}
                className="fixed z-[1000] inset-0 md:inset-6 lg:inset-12 bg-[#08080c] md:rounded-3xl flex flex-col overflow-hidden border-0 md:border-2 border-emerald-500/20 shadow-[0_0_100px_rgba(16,185,129,0.15)]"
            >
                {/* HEADER */}
                <div className="px-4 md:px-10 py-4 md:py-6 border-b-2 border-white/10 flex items-center gap-3 md:gap-5 bg-gradient-to-r from-emerald-950/50 via-transparent to-transparent">
                    <div className="w-10 h-10 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                        <Sparkles size={20} className="text-white md:hidden" />
                        <Sparkles size={32} className="text-white hidden md:block" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <h2 className="text-xl md:text-3xl font-bold text-white tracking-tight">Fred</h2>
                            {/* SELETOR DE PERSONA */}
                            <select
                                value={selectedPersona}
                                onChange={(e) => setSelectedPersona(e.target.value)}
                                className="ml-2 bg-[#12121a] text-xs md:text-sm border border-white/10 rounded-lg px-2 py-1 text-gray-300 focus:outline-none focus:border-emerald-500"
                            >
                                {PERSONAS.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                            <span className={cn(
                                "w-2 h-2 md:w-3 md:h-3 rounded-full",
                                isLoading ? "bg-amber-500 animate-pulse" : "bg-emerald-500"
                            )} />
                            <span className="text-sm md:text-lg font-medium text-emerald-400">
                                {isLoading ? "Processando..." : "Online"}
                            </span>
                        </div>
                    </div>

                    {/* Toggle Autoplay */}
                    <button
                        onClick={() => setAutoplayEnabled(!autoplayEnabled)}
                        className={cn(
                            "p-2 md:px-4 md:py-2 rounded-xl transition-all flex items-center gap-2 border border-white/5",
                            autoplayEnabled
                                ? "bg-emerald-600/20 text-emerald-400 border-emerald-500/30"
                                : "bg-white/5 text-gray-500 hover:text-gray-300"
                        )}
                        title="Alternar reprodução automática de voz"
                    >
                        {autoplayEnabled ? <Volume2 size={18} /> : <Volume2 size={18} className="opacity-50" />}
                        <span className="hidden md:inline text-sm font-medium uppercase tracking-wider">
                            {autoplayEnabled ? "Autoplay ON" : "Autoplay OFF"}
                        </span>
                    </button>
                    <button
                        onClick={handleClearChat}
                        className="p-2 md:p-4 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl md:rounded-2xl transition-all"
                        title="Limpar conversa"
                    >
                        <Trash2 size={20} className="md:hidden" />
                        <Trash2 size={28} className="hidden md:block" />
                    </button>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-2 md:p-4 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl md:rounded-2xl transition-all"
                        title="Fechar"
                    >
                        <X size={24} className="md:hidden" />
                        <X size={32} className="hidden md:block" />
                    </button>
                </div>

                {/* MENSAGENS */}
                <div className="flex-1 overflow-y-auto px-4 md:px-10 py-4 md:py-8 space-y-4 md:space-y-8">
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={cn(
                                "max-w-[80%] rounded-3xl",
                                msg.role === 'user'
                                    ? "ml-auto bg-emerald-600/25 border-2 border-emerald-500/40 rounded-br-lg px-8 py-6"
                                    : "mr-auto bg-[#12121a] border-2 border-white/10 rounded-bl-lg px-8 py-7"
                            )}
                        >
                            {msg.image && (
                                <div className="mb-5 rounded-2xl overflow-hidden border-2 border-white/10">
                                    <img src={msg.image} alt="Anexo" className="w-full max-h-[400px] object-cover" />
                                </div>
                            )}
                            <div className={cn(
                                "whitespace-pre-wrap",
                                msg.role === 'user'
                                    ? "text-xl font-medium text-white leading-relaxed"
                                    : "text-[22px] font-normal text-gray-100 leading-[2] tracking-wide"
                            )}>
                                {(() => {
                                    const content = msg.role === 'assistant' ? formatMessage(msg.content) : msg.content;
                                    // Detectar imagem markdown: ![alt](url)
                                    const imgMatch = content.match(/!\[(.*?)\]\((.*?)\)/);

                                    if (imgMatch && msg.role === 'assistant') {
                                        const [fullMatch, alt, url] = imgMatch;
                                        const parts = content.split(fullMatch);
                                        return (
                                            <div className="flex flex-col gap-4" key="msg-content">
                                                {parts[0] && <span>{parts[0]}</span>}
                                                <div className="relative group inline-block max-w-full rounded-xl overflow-hidden border-4 border-emerald-500/20 shadow-2xl my-2 w-fit">
                                                    <img src={url} alt={alt} className="w-full h-auto max-h-[500px] object-cover" />
                                                    <button
                                                        onClick={() => handleDeleteImage(url)}
                                                        className="absolute top-4 right-4 p-3 bg-red-600 hover:bg-red-700 text-white rounded-xl opacity-0 group-hover:opacity-100 transition-all shadow-lg transform hover:scale-105"
                                                        title="🗑️ Excluir Imagem (Apagar do Disco)"
                                                    >
                                                        <Trash2 size={24} />
                                                    </button>
                                                </div>
                                                {parts[1] && <span>{parts[1]}</span>}
                                            </div>
                                        );
                                    }
                                    return content;
                                })()}
                            </div>

                            {/* Botão de Áudio para mensagens do Fred (Manual) */}

                        </div>
                    ))}

                    {isLoading && (
                        <div className="mr-auto bg-[#12121a] border-2 border-white/10 rounded-bl-lg rounded-3xl px-8 py-7 flex items-center gap-5">
                            <Loader2 size={32} className="animate-spin text-emerald-400" />
                            <span className="text-xl font-medium text-gray-300">Fred está analisando...</span>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* INPUT */}
                <div className="px-3 md:px-10 py-4 md:py-8 bg-[#0a0a10] border-t-2 border-white/10">
                    {previewUrl && (
                        <div className="mb-5 flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10 w-fit">
                            <div className="w-20 h-20 rounded-xl overflow-hidden">
                                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-lg font-medium text-white max-w-[250px] truncate">{selectedFile?.name}</span>
                                <span className="text-base text-gray-400">{((selectedFile?.size || 0) / 1024).toFixed(0)} KB</span>
                            </div>
                            <button onClick={clearFile} className="ml-2 p-3 hover:bg-red-500/20 rounded-xl text-gray-400 hover:text-red-400 transition-all"><X size={24} /></button>
                        </div>
                    )}

                    <div className="flex items-center gap-2 md:gap-4 bg-[#16161e] rounded-xl md:rounded-2xl p-3 md:p-5 border-2 border-white/10 focus-within:border-emerald-500/60 transition-all">
                        <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} accept="image/*,application/pdf" />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className={cn("p-4 rounded-xl transition-all", selectedFile ? "text-emerald-400 bg-emerald-500/20" : "text-gray-400 hover:text-white hover:bg-white/10")}
                            title="Anexar arquivo"
                        >
                            <Paperclip size={28} />
                        </button>

                        <button
                            onClick={handlePasteButton}
                            className="p-4 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                            title="Colar da área de transferência"
                        >
                            <ClipboardPaste size={28} />
                        </button>

                        <input
                            type="text"
                            ref={textInputRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            onPaste={handlePaste}
                            placeholder="Fale com Fred... (Ctrl+V para colar imagem)"
                            disabled={isLoading}
                            className="flex-1 bg-transparent border-none outline-none text-base md:text-xl font-medium text-white placeholder:text-gray-500 disabled:opacity-50 min-w-0"
                        />

                        <button
                            onMouseDown={startRecording}
                            onMouseUp={stopRecording}
                            onMouseLeave={stopRecording}
                            onClick={() => { if (input.trim() || selectedFile) handleSend(); }}
                            disabled={isLoading}
                            className={cn(
                                "p-4 rounded-xl transition-all",
                                isRecording ? "bg-red-500 text-white animate-pulse" : (input.trim() || selectedFile) && !isLoading ? "bg-emerald-600 text-white hover:scale-105" : "text-gray-600 bg-white/5 hover:text-white hover:bg-white/10"
                            )}
                        >
                            {input.trim() || selectedFile ? <Send size={28} /> : <Mic size={28} className={isRecording ? "scale-125" : ""} />}
                        </button>
                    </div>
                </div>
            </motion.div >
        </>
    );
}
