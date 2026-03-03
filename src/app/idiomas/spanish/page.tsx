'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeftRight, Bot, Sparkles, PlayCircle, Youtube,
    GraduationCap, CheckCircle2, ExternalLink, X, Send,
    Copy, Check, RefreshCw
} from 'lucide-react';

// === WORD BANK ESPAÑOL EXTENDIDO (100 Palabras) ===
const WORD_BANK_ES = [
    { word: "Lograr", meaning: "Conseguir o alcanzar algo con esfuerzo", example: "Logré terminar el proyecto." },
    { word: "Desafío", meaning: "Reto o situación difícil de enfrentar", example: "Este examen es un desafío." },
    { word: "Éxito", meaning: "Resultado feliz de un negocio o actuación", example: "La fiesta fue un éxito total." },
    { word: "Desarrollo", meaning: "Crecimiento o mejora de algo", example: "El desarrollo web es fascinante." },
    { word: "Innovar", meaning: "Mudar o alterar las cosas introduciendo novedades", example: "Debemos innovar para sobrevivir." },
    { word: "Liderazgo", meaning: "Cualidad de líder", example: "Su liderazgo inspiró al equipo." },
    { word: "Estrategia", meaning: "Arte de dirigir un asunto", example: "Necesitamos una nueva estrategia." },
    { word: "Meta", meaning: "Fin a que se dirigen las acciones", example: "Mi meta es aprender español." },
    { word: "Objetivo", meaning: "Fin que se quiere alcanzar", example: "El objetivo es vender más." },
    { word: "Pasión", meaning: "Afición muy viva a algo", example: "Tengo pasión por la música." },
    { word: "Sueño", meaning: "Proyecto, deseo o esperanza", example: "Mi sueño es viajar por el mundo." },
    { word: "Realidad", meaning: "Existencia real y efectiva", example: "Hizo su sueño realidad." },
    { word: "Futuro", meaning: "Tiempo que vendrá", example: "El futuro es incierto." },
    { word: "Crecimiento", meaning: "Acción y efecto de crecer", example: "La empresa tuvo un gran crecimiento." },
    { word: "Oportunidad", meaning: "Momento propicio para algo", example: "Es una gran oportunidad." },
    { word: "Habilidad", meaning: "Capacidad para algo", example: "Tiene habilidad para los idiomas." },
    { word: "Conocimiento", meaning: "Entendimiento, inteligencia", example: "El conocimiento es poder." },
    { word: "Aprendizaje", meaning: "Adquisición de conocimientos", example: "El aprendizaje nunca termina." },
    { word: "Esfuerzo", meaning: "Empleo enérgico de la fuerza", example: "Valió la pena el esfuerzo." },
    { word: "Persistencia", meaning: "Mantenerse firme en algo", example: "La persistencia es clave." },
    { word: "Resiliencia", meaning: "Capacidad de adaptación", example: "Su resiliencia es admirable." },
    { word: "Creatividad", meaning: "Facultad de crear", example: "La creatividad no tiene límites." },
    { word: "Imaginación", meaning: "Facultad de representar imágenes", example: "Usa tu imaginación." },
    { word: "Inspiración", meaning: "Estímulo creador", example: "Busco inspiración en la naturaleza." },
    { word: "Motivación", meaning: "Cosa que anima a actuar", example: "Falta motivación en el grupo." },
    { word: "Confianza", meaning: "Esperanza firme o seguridad", example: "Tengo confianza en ti." },
    { word: "Seguridad", meaning: "Cualidad de seguro", example: "La seguridad es lo primero." },
    { word: "Libertad", meaning: "Facultad natural de obrar", example: "Lucharon por su libertad." },
    { word: "Justicia", meaning: "Principio moral de dar a cada uno lo suyo", example: "Pedimos justicia." },
    { word: "Verdad", meaning: "Conformidad de las cosas con el concepto", example: "Dime siempre la verdad." },
    { word: "Amistad", meaning: "Afecto personal puro y desinteresado", example: "Nuestra amistad es eterna." },
    { word: "Amor", meaning: "Sentimiento intenso del ser humano", example: "El amor mueve el mundo." },
    { word: "Felicidad", meaning: "Estado de grata satisfacción", example: "Busco la felicidad." },
    { word: "Paz", meaning: "Situación sin guerra ni luchas", example: "Queremos paz mundial." },
    { word: "Alegría", meaning: "Sentimiento grato y vivo", example: "Su risa nos dio alegría." },
    { word: "Esperanza", meaning: "Estado de ánimo optimista", example: "La esperanza es lo último que se pierde." },
    { word: "Coraje", meaning: "Valor, decisión y apasionamiento", example: "Tuvo el coraje de hablar." },
    { word: "Bondad", meaning: "Cualidad de bueno", example: "Su bondad no tiene fin." },
    { word: "Gratitud", meaning: "Sentimiento de agradecimiento", example: "Siento gratitud por tu ayuda." },
    { word: "Respeto", meaning: "Veneración, acatamiento", example: "Muestra respeto a los mayores." },
    { word: "Responsabilidad", meaning: "Cargo u obligación moral", example: "Es tu responsabilidad." },
    { word: "Honestidad", meaning: "Cualidad de honesto", example: "La honestidad es vital." },
    { word: "Humildad", meaning: "Conocimiento de las propias limitaciones", example: "Aceptó el premio con humildad." },
    { word: "Paciencia", meaning: "Capacidad de padecer o soportar", example: "Ten paciencia." },
    { word: "Tolerancia", meaning: "Respeto a las ideas ajenas", example: "Practica la tolerancia." },
    { word: "Solidaridad", meaning: "Adhesión a la causa de otros", example: "Mostraron solidaridad." },
    { word: "Generosidad", meaning: "Tendencia a ayudar a los demás", example: "Su generosidad es inmensa." },
    { word: "Compasión", meaning: "Sentimiento de commiseración", example: "Sintió compasión por él." },
    { word: "Empatía", meaning: "Identificación afectiva con otro", example: "Le falta empatía." },
    { word: "Sabiduría", meaning: "Grado más alto del conocimiento", example: "La sabiduría viene con los años." }
];

// === MAIN MODULES ===
const MAIN_MODULES_ES = [
    {
        id: 'duolingo',
        name: 'Duolingo',
        subtitle: 'Gamificación',
        description: 'Aprende español jugando con lecciones interactivas',
        image: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&q=80',
        gradient: 'from-green-500 to-emerald-600',
        tag: 'POPULAR',
        url: 'https://www.duolingo.com/learn'
    },
    {
        id: 'youtube',
        name: 'YouTube Learning',
        subtitle: 'Listas Curadas con IA',
        description: 'Aprendizaje inmersivo con contenido curado de YouTube',
        image: 'https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=800&q=80',
        gradient: 'from-red-500 to-rose-600',
        tag: '✨ IA',
    },
    {
        id: 'memrise',
        name: 'Memrise',
        subtitle: 'Repetición Espaciada',
        description: 'Construye vocabulario con métodos científicamente probados',
        image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&q=80',
        gradient: 'from-yellow-500 to-amber-500',
        tag: 'EXTERNO',
        url: 'https://app.memrise.com/'
    },
];

// === DOCK TOOLS ===
const DOCK_TOOLS = [
    { id: 'translator', name: 'Traductor', icon: ArrowLeftRight, gradient: 'from-emerald-500 to-teal-500' },
    { id: 'tutor', name: 'Tutor IA', icon: Bot, gradient: 'from-violet-500 to-purple-600' },
];

// === TRANSLATOR MODAL ===
function TranslatorModal({ onClose }: { onClose: () => void }) {
    const [sourceText, setSourceText] = useState('');
    const [translatedText, setTranslatedText] = useState('');
    const [isTranslating, setIsTranslating] = useState(false);
    const [copied, setCopied] = useState(false);
    const [sourceLang, setSourceLang] = useState('es');
    const [targetLang, setTargetLang] = useState('pt');

    const translate = async () => {
        if (!sourceText.trim()) return;
        setIsTranslating(true);

        try {
            const res = await fetch('/api/ai/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: `Eres un traductor profesional. Traduce el siguiente texto de ${sourceLang === 'es' ? 'Español' : sourceLang === 'pt' ? 'Portugués' : 'Inglés'} a ${targetLang === 'pt' ? 'Portugués' : targetLang === 'en' ? 'Inglés' : 'Español'}. Solo proporciona la traducción, nada más.\n\nTexto: "${sourceText}"`,
                })
            });
            const data = await res.json();
            setTranslatedText(data.response || data.text || 'Error en la traducción');
        } catch (error) {
            setTranslatedText('Error al traducir. Intenta de nuevo.');
        } finally {
            setIsTranslating(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(translatedText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const swapLanguages = () => {
        const temp = sourceLang;
        setSourceLang(targetLang);
        setTargetLang(temp);
        setSourceText(translatedText);
        setTranslatedText(sourceText);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={onClose}
        >
            <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full sm:w-[95%] max-w-5xl h-[90dvh] sm:h-[90vh] bg-[#0a0a0f] rounded-t-3xl sm:rounded-3xl border-t sm:border border-white/10 shadow-2xl overflow-hidden flex flex-col mt-auto sm:mt-0"
            >
                <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-4 md:p-6 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 md:p-3 rounded-lg md:rounded-xl bg-white/20">
                            <ArrowLeftRight className="w-5 h-5 md:w-7 md:h-7 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl md:text-2xl font-black text-white">Traductor</h2>
                            <p className="text-white/70 text-[10px] md:text-sm uppercase tracking-wider">Powered by Gemini AI</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/20 transition">
                        <X size={20} className="text-white" />
                    </button>
                </div>

                <div className="flex-1 p-4 md:p-8 overflow-auto">
                    <div className="max-w-4xl mx-auto">
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4 mb-6">
                            <select
                                value={sourceLang}
                                onChange={(e) => setSourceLang(e.target.value)}
                                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-white/10 border border-white/10 text-white text-sm"
                            >
                                <option value="es">🇵🇾 Español</option>
                                <option value="pt">🇧🇷 Português</option>
                                <option value="en">🇺🇸 English</option>
                            </select>

                            <button
                                onClick={swapLanguages}
                                className="p-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:scale-105 transition-transform"
                            >
                                <ArrowLeftRight size={20} />
                            </button>

                            <select
                                value={targetLang}
                                onChange={(e) => setTargetLang(e.target.value)}
                                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-white/10 border border-white/10 text-white text-sm"
                            >
                                <option value="pt">🇧🇷 Português</option>
                                <option value="en">🇺🇸 English</option>
                                <option value="es">🇵🇾 Español</option>
                            </select>
                        </div>

                        <div className="flex flex-col gap-4 md:gap-6">
                            <div className="relative">
                                <textarea
                                    value={sourceText}
                                    onChange={(e) => setSourceText(e.target.value)}
                                    placeholder="Escribe para traducir..."
                                    className="w-full h-40 md:h-64 p-4 md:p-6 rounded-2xl bg-white/5 border border-white/10 text-white text-base md:text-lg resize-none focus:outline-none focus:border-emerald-500/50"
                                />
                                <div className="absolute bottom-4 right-4">
                                    <button
                                        onClick={translate}
                                        disabled={isTranslating || !sourceText.trim()}
                                        className="px-4 md:px-6 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm md:text-base font-bold flex items-center gap-2 disabled:opacity-50"
                                    >
                                        {isTranslating ? <RefreshCw size={16} className="animate-spin" /> : <Sparkles size={16} />}
                                        Traducir
                                    </button>
                                </div>
                            </div>

                            <div className="relative">
                                <div className="w-full h-40 md:h-64 p-4 md:p-6 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 text-white text-base md:text-lg overflow-auto">
                                    {isTranslating ? (
                                        <div className="flex items-center gap-2 text-gray-400">
                                            <RefreshCw size={16} className="animate-spin" />
                                            Traduciendo...
                                        </div>
                                    ) : (
                                        translatedText || <span className="text-gray-500 text-sm md:text-base">La traducción aparecerá aquí...</span>
                                    )}
                                </div>
                                {translatedText && (
                                    <button
                                        onClick={copyToClipboard}
                                        className="absolute bottom-4 right-4 p-2 rounded-lg bg-white/10 text-white hover:bg-white/20"
                                    >
                                        {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}

// === AI TUTOR MODAL ===
function AITutorModal({ onClose }: { onClose: () => void }) {
    const [messages, setMessages] = useState<any[]>([
        {
            role: 'assistant',
            content: "¡Hola! Soy tu tutor de español. 🎓 Puedo ayudarte con:\n\n• Correcciones gramaticales\n• Práctica de vocabulario\n• Práctica de conversación\n• Responder cualquier pregunta\n\n¿Cómo puedo ayudarte hoy?"
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const sendMessage = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const systemPrompt = `Eres un tutor experto de español. Tu rol es:
1. Corregir errores gramaticales
2. Explicar las correcciones claramente
3. Enseñar vocabulario cuando sea relevante
4. Animar al estudiante
5. Responder siempre en una mezcla de Español y Portugués (Brasileño) para ayudar al aprendizaje
6. Si el usuario escribe en Portugués, ayúdalo a expresarlo en Español
7. Sé amigable y de apoyo

Mensaje del estudiante: "${input}"`;

            const res = await fetch('/api/ai/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: systemPrompt })
            });

            const data = await res.json();
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: data.response || data.text || 'Lo siento, tuve problemas para procesar eso. ¿Podrías intentarlo de nuevo?'
            }]);
        } catch (error) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Lo siento, encontré un error. Por favor intenta de nuevo.'
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={onClose}
        >
            <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full sm:w-[95%] max-w-5xl h-[90dvh] sm:h-[90vh] bg-[#0a0a0f] rounded-t-3xl sm:rounded-3xl border-t sm:border border-white/10 shadow-2xl overflow-hidden flex flex-col mt-auto sm:mt-0"
            >
                <div className="bg-gradient-to-r from-violet-600 to-purple-600 p-4 md:p-6 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 md:p-3 rounded-lg md:rounded-xl bg-white/20">
                            <Bot className="w-5 h-5 md:w-7 md:h-7 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl md:text-2xl font-black text-white">Tutor IA</h2>
                            <p className="text-white/70 text-[10px] md:text-sm uppercase tracking-wider">Practica español con IA</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/20 transition">
                        <X size={20} className="text-white" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
                    {messages.map((msg, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`max-w-[85%] md:max-w-[70%] p-3 md:p-4 rounded-2xl ${msg.role === 'user'
                                ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-tr-sm'
                                : 'bg-white/10 text-gray-200 rounded-tl-sm'
                                }`}>
                                <div className="whitespace-pre-wrap">{msg.content}</div>
                            </div>
                        </motion.div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-white/10 p-4 rounded-2xl rounded-tl-sm flex gap-1">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-3 md:p-6 border-t border-white/5">
                    <div className="relative">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                            placeholder="Pregunta a tu tutor..."
                            className="w-full px-4 md:px-6 py-3 md:py-4 pr-14 rounded-2xl bg-white/5 border border-white/10 text-white text-sm md:text-base focus:outline-none focus:border-violet-500/50"
                        />
                        <button
                            onClick={sendMessage}
                            disabled={isLoading}
                            className="absolute right-2 top-2 p-2.5 md:p-3 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white disabled:opacity-50"
                        >
                            <Send size={18} />
                        </button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}

// === WORD CAROUSEL ===
function WordCarousel() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const interval = setInterval(() => {
            setIsVisible(false);
            setTimeout(() => {
                setCurrentIndex((prev) => (prev + 1) % WORD_BANK_ES.length);
                setIsVisible(true);
            }, 300);
        }, 45000);

        return () => clearInterval(interval);
    }, []);

    const word = WORD_BANK_ES[currentIndex];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 10 }}
            transition={{ duration: 0.3 }}
            className="w-full bg-gradient-to-r from-red-600/20 to-yellow-600/20 border border-red-500/30 rounded-2xl p-4 md:p-6 mb-6 md:mb-8"
        >
            <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-red-500 to-yellow-500 flex-shrink-0">
                    <Sparkles size={24} className="text-white" />
                </div>
                <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 md:gap-3 mb-2">
                        <h3 className="text-xl md:text-2xl font-black text-white">{word.word}</h3>
                        <span className="text-[10px] text-red-300 bg-red-500/20 px-2 py-1 rounded-full w-fit">
                            Palabra {currentIndex + 1}/{WORD_BANK_ES.length}
                        </span>
                    </div>
                    <p className="text-sm md:text-base text-gray-300 mb-2">{word.meaning}</p>
                    <p className="text-xs md:text-sm text-gray-400 italic">"{word.example}"</p>
                </div>
            </div>
        </motion.div>
    );
}

// === WEEKLY TRACKER ===
function WeeklyTracker() {
    const [completedDays, setCompletedDays] = useState<Set<number>>(new Set());

    useEffect(() => {
        const saved = localStorage.getItem('weekly-tracker-es');
        if (saved) {
            setCompletedDays(new Set(JSON.parse(saved)));
        }
    }, []);

    const toggleDay = (day: number) => {
        const newSet = new Set(completedDays);
        if (newSet.has(day)) {
            newSet.delete(day);
        } else {
            newSet.add(day);
        }
        setCompletedDays(newSet);
        localStorage.setItem('weekly-tracker-es', JSON.stringify(Array.from(newSet)));
    };

    const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

    return (
        <div className="w-full bg-gradient-to-r from-white/5 to-white/[0.02] border border-white/10 rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold">Progreso de Esta Semana</h3>
                <span className="text-gray-400 text-sm">{completedDays.size}/7 días</span>
            </div>
            <div className="grid grid-cols-7 gap-1.5 md:gap-2">
                {days.map((day, idx) => (
                    <button
                        key={idx}
                        onClick={() => toggleDay(idx)}
                        className={`aspect-square rounded-lg md:rounded-xl border md:border-2 transition-all ${completedDays.has(idx)
                            ? 'bg-gradient-to-br from-green-500 to-emerald-600 border-green-400 scale-105'
                            : 'bg-white/5 border-white/10 hover:border-white/30'
                            }`}
                    >
                        <div className="flex flex-col items-center justify-center h-full p-1">
                            <span className={`text-[10px] md:text-sm font-bold ${completedDays.has(idx) ? 'text-white' : 'text-gray-500'}`}>
                                {day.substring(0, 1)}
                            </span>
                            {completedDays.has(idx) ? (
                                <CheckCircle2 size={12} className="text-white mt-0.5 md:mt-1" />
                            ) : (
                                <div className="w-1 h-1 rounded-full bg-white/10 mt-1 md:hidden" />
                            )}
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}

// === MAIN PAGE ===
export default function SpanishPage() {
    const [activeTool, setActiveTool] = useState<string | null>(null);
    const router = useRouter();

    const handleModuleClick = (moduleId: string) => {
        const module = MAIN_MODULES_ES.find(m => m.id === moduleId);
        if (module?.url) {
            window.open(module.url, '_blank');
            return;
        }
        if (moduleId === 'youtube') {
            router.push('/idiomas/spanish/youtube');
            return;
        }
    };

    return (
        <>
            {/* Language Switcher */}
            <motion.button
                onClick={() => router.push('/idiomas')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="fixed top-4 right-4 z-[60] p-2 md:p-3 rounded-full bg-[#0a0a0f]/80 border border-white/20 backdrop-blur-2xl shadow-2xl hover:shadow-white/5 transition-all active:scale-90"
                title="Cambiar a English"
            >
                <span className="text-2xl md:text-3xl">🇺🇸</span>
            </motion.button>

            <main className="min-h-screen bg-[#08080c] transition-all duration-300 overflow-y-auto overflow-x-hidden pb-40 sm:pb-32">
                {/* Hero Section */}
                <div className="relative overflow-hidden">
                    <div className="absolute inset-0">
                        {/* Imagem de Assunção (Palacio de los Lopez) - URL Estável */}
                        <img
                            src="https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=1920&q=80"
                            alt="Asunción, Paraguay"
                            className="w-full h-full object-cover opacity-30"
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-[#08080c]/50 via-[#08080c]/80 to-[#08080c]" />
                    </div>

                    <div className="relative px-4 sm:px-6 md:px-8 py-8 sm:py-10 md:py-16 text-center">
                        <motion.div
                            initial={{ y: -20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="mb-6 sm:mb-8 md:mb-12"
                        >
                            <div className="flex flex-col md:flex-row items-center justify-center gap-2 md:gap-4 mb-4">
                                <div className="text-4xl sm:text-5xl md:text-7xl">🇵🇾</div>
                                <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-7xl font-black text-white tracking-tighter uppercase">
                                    Estudio de Español
                                </h1>
                            </div>
                            <p className="text-xs sm:text-sm md:text-xl text-gray-400 max-w-xl mx-auto font-medium px-4">
                                Domina el idioma del corazón de América Latina
                            </p>
                        </motion.div>

                        <div className="max-w-4xl mx-auto">
                            <WeeklyTracker />
                            <WordCarousel />
                        </div>
                    </div>
                </div>

                {/* Main Modules */}
                <div className="px-4 sm:px-6 md:px-8 pb-12">
                    <div className="max-w-7xl mx-auto">
                        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-4 sm:mb-6 md:mb-8 flex items-center gap-2 sm:gap-3">
                            <GraduationCap size={24} className="text-red-400 sm:w-7 sm:h-7 md:w-8 md:h-8" />
                            Caminos de Aprendizaje
                        </h2>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                            {MAIN_MODULES_ES.map((module, idx) => (
                                <motion.button
                                    key={module.id}
                                    onClick={() => handleModuleClick(module.id)}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    whileHover={{ scale: 1.02, y: -4 }}
                                    className="relative rounded-xl sm:rounded-2xl overflow-hidden border border-white/10 hover:border-white/30 text-left group h-44 sm:h-52 md:h-64"
                                >
                                    <div className="absolute inset-0">
                                        <img
                                            src={module.image}
                                            alt={module.name}
                                            className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity group-hover:scale-105 duration-500"
                                        />
                                        <div className={`absolute inset-0 bg-gradient-to-t ${module.gradient} mix-blend-multiply opacity-70`} />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                                    </div>

                                    {module.tag && (
                                        <div className="absolute top-3 right-3 sm:top-4 sm:right-4 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-white/20 backdrop-blur-sm text-[9px] sm:text-[10px] md:text-xs font-bold text-white">
                                            {module.tag}
                                        </div>
                                    )}

                                    <div className="relative h-full flex flex-col justify-end p-4 sm:p-5 md:p-6">
                                        <h3 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-black text-white mb-0.5 sm:mb-1 md:mb-2">{module.name}</h3>
                                        <p className="text-white/80 text-[10px] sm:text-xs md:text-sm mb-0.5 sm:mb-1">{module.subtitle}</p>
                                        <p className="text-white/60 text-[9px] sm:text-[10px] md:text-xs line-clamp-2">{module.description}</p>

                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <div className={`p-3 md:p-4 rounded-full bg-gradient-to-r ${module.gradient}`}>
                                                <PlayCircle className="w-6 h-6 md:w-8 md:h-8 text-white" />
                                            </div>
                                        </div>
                                    </div>
                                </motion.button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Premium Floating Dock */}
                <motion.div
                    initial={{ y: 200, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.5 }}
                    className="fixed bottom-28 sm:bottom-24 md:bottom-10 inset-x-0 z-[100] flex justify-center pointer-events-none md:pl-20 px-4"
                >
                    <div className="pointer-events-auto flex items-center gap-2 sm:gap-3 md:gap-5 p-2.5 sm:p-3 md:p-4 rounded-2xl sm:rounded-[2rem] md:rounded-[2.5rem] bg-[#0a0a0f]/60 backdrop-blur-2xl border border-white/10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] ring-1 ring-white/5">
                        {DOCK_TOOLS.map((tool) => (
                            <motion.button
                                key={tool.id}
                                onClick={() => setActiveTool(tool.id)}
                                whileHover={{ scale: 1.2, y: -10 }}
                                whileTap={{ scale: 0.9 }}
                                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                                className="group relative"
                            >
                                {/* Glow behind */}
                                <div className={`absolute inset-0 bg-gradient-to-br ${tool.gradient} blur-xl opacity-0 group-hover:opacity-40 transition-opacity duration-500 rounded-full`} />

                                {/* Button Body */}
                                <div className={`relative w-11 h-11 sm:w-12 sm:h-12 md:w-16 md:h-16 rounded-lg sm:rounded-xl md:rounded-2xl bg-gradient-to-br ${tool.gradient} flex items-center justify-center shadow-lg border border-white/10 overflow-hidden`}>
                                    {/* Shine effect */}
                                    <div className="absolute inset-x-0 top-0 h-[50%] bg-gradient-to-b from-white/20 to-transparent opacity-50" />
                                    <tool.icon className="w-5 h-5 sm:w-6 sm:h-6 md:w-[30px] md:h-[30px] text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]" />
                                </div>

                                {/* Label Tooltip */}
                                <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg bg-[#1a1a1f] border border-white/10 text-white text-[10px] md:text-xs font-semibold tracking-wide opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-200 pointer-events-none whitespace-nowrap shadow-xl">
                                    {tool.name}
                                </div>

                                {/* Reflection dot */}
                                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-white/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                            </motion.button>
                        ))}
                    </div>
                </motion.div>

                {/* Modals */}
                <AnimatePresence>
                    {activeTool === 'translator' && (
                        <TranslatorModal onClose={() => setActiveTool(null)} />
                    )}
                    {activeTool === 'tutor' && (
                        <AITutorModal onClose={() => setActiveTool(null)} />
                    )}
                </AnimatePresence>
            </main>
        </>
    );
}
