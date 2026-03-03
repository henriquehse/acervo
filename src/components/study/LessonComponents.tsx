/**
 * Lesson Section Components - Pure React Components
 * Renders structured lesson data from JSON
 */

import React, { useState, useEffect, useRef } from 'react';
import { RotateCcw, Sparkles, NotebookPen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Type Definitions
export interface LessonSection {
    type: string;
    content: Record<string, any>;
    audioTimestamp?: number;
    needsImage?: boolean;
    imagePrompt?: string;
}

export interface LessonData {
    title: string;
    pages: {
        number: number;
        sections: LessonSection[];
    }[];
}

// Helper for highlight colors
const getHighlightClass = (color?: string, darkMode: boolean = false) => {
    if (!color) return darkMode ? 'bg-yellow-900/50' : 'bg-yellow-200/50';

    const c = color.toLowerCase().trim();

    // Unequivocal Logic for Color Mapping
    if (['cyan', 'blue', 'lightblue', 'turquoise', 'sky', 'azul'].some(k => c.includes(k))) {
        return 'bg-cyan-300 text-black px-1 rounded-sm shadow-sm decoration-clone';
    }
    if (['magenta', 'pink', 'purple', 'violet', 'fuchsia', 'rosa'].some(k => c.includes(k))) {
        return 'bg-fuchsia-400 text-black px-1 rounded-sm shadow-sm decoration-clone';
    }
    if (['red', 'crimson', 'danger', 'vermelho'].some(k => c.includes(k))) {
        return 'bg-red-600 text-white px-1 font-bold rounded-sm shadow-sm decoration-clone';
    }
    if (['green', 'lime', 'success', 'verde'].some(k => c.includes(k))) {
        return 'bg-emerald-300 text-black px-1 rounded-sm shadow-sm decoration-clone';
    }

    // Default Yellow/Orange
    return 'bg-yellow-300 text-black px-1 rounded-sm shadow-sm decoration-clone';
};

// Common props for section components
interface SectionProps {
    isActive?: boolean;
    onClick?: () => void;
    darkMode?: boolean;
    highlighted?: boolean;
    highlightColor?: string;
}

// Vocabulary Card Component with Flux Image Generation
export const VocabularyCard: React.FC<{
    word: string;
    translation: string;
    stress: number[];
    category?: string;
    needsImage?: boolean;
    imagePrompt?: string;
} & SectionProps> = ({ word, translation, stress, category, needsImage, imagePrompt, isActive, onClick, darkMode = false, highlighted, highlightColor }) => {
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Custom Prompt State
    const [customPrompt, setCustomPrompt] = useState<string | null>(null);
    const [isEditingPrompt, setIsEditingPrompt] = useState(false);
    const [editPromptValue, setEditPromptValue] = useState('');

    const cardRef = useRef<HTMLDivElement>(null);

    // Auto-scroll removed individually
    // useEffect(() => {
    //    if (isActive && cardRef.current) {
    //        cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    //    }
    // }, [isActive]);

    // Renderiza palavra com sílabas sublinhadas e highlight opcional
    const renderWord = () => {
        const syllables = word.split('');
        const content = syllables.map((char, i) => {
            const isStressed = stress && stress.includes(i);
            return (
                <span key={i} className={`inline-block ${isStressed ? 'border-b-4 border-purple-500' : ''}`}>
                    {char}
                </span>
            );
        });

        if (highlighted || highlightColor) {
            // Highlight REMOVED per user request
            return (
                <span className="">
                    {content}
                </span>
            );
        }
        return content;
    };


    // Load saved image on mount
    useEffect(() => {
        const savedImage = localStorage.getItem(`vocab_image_${word.toLowerCase()}`);
        if (savedImage) setGeneratedImage(savedImage);

        const savedPrompt = localStorage.getItem(`vocab_prompt_${word.toLowerCase()}`);
        if (savedPrompt) setCustomPrompt(savedPrompt);
    }, [word]);

    const handleSavePrompt = () => {
        if (!editPromptValue.trim()) return;
        localStorage.setItem(`vocab_prompt_${word.toLowerCase()}`, editPromptValue);
        setCustomPrompt(editPromptValue);
        setIsEditingPrompt(false);
    };

    // Gera imagem via Flux
    const generateImage = async (e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setGenerating(true);
        setError(null);

        // Prompt otimizado para Flux Schnell (hiper-realismo)
        // Order: Custom -> Backend (JSON) -> Frontend Default
        const fluxPrompt =
            customPrompt ||
            imagePrompt ||
            `literal educational photo of ${word.toLowerCase()}, isolated object on white background, highly detailed, photorealistic, 8k, no artistic exaggeration`;

        try {
            const response = await fetch('http://localhost:8001/api/generate-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: fluxPrompt,
                    width: 1024,  // WIDE
                    height: 576,  // 16:9 Aspect Ratio
                    steps: 4,
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();

            if (data.success && data.image_url) {
                const url = `http://localhost:8001${data.image_url}`;
                setGeneratedImage(url);
                localStorage.setItem(`vocab_image_${word.toLowerCase()}`, url);
            } else {
                throw new Error(data.error || 'Generation failed');
            }
        } catch (err: any) {
            console.error('Image generation error:', err);
            setError(err.message || 'Failed to generate image');
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div ref={cardRef} onClick={onClick} className={`vocab-card group my-4 transition-all duration-300 break-inside-avoid page-break-inside-avoid opacity-100`}>
            <div className={`relative overflow-hidden border rounded-2xl p-5 shadow-sm transition-all h-full flex flex-col justify-between
                ${darkMode
                    ? 'bg-zinc-900/50 border-zinc-800 hover:border-purple-400'
                    : 'bg-white border-gray-200 hover:border-purple-400'}
                `}>

                {/* Active Indicator Removed */}

                {/* Texto */}
                <div className="flex items-start gap-4 mb-4 pl-2">
                    <div className="flex-1">
                        {category && (
                            <span className="text-[10px] text-indigo-400 font-black uppercase tracking-widest opacity-80 flex items-center gap-2 mb-1">
                                {category}
                            </span>
                        )}
                        <h3 className={`text-3xl font-black tracking-tight leading-none ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                            {renderWord()}
                        </h3>
                        <p className={`${darkMode ? 'text-zinc-400' : 'text-gray-600'} text-base font-medium mt-1`}>{translation}</p>
                    </div>
                </div>

                {/* Imagem Otimizada */}
                <div className="mt-4 w-full relative group/container">
                    {isEditingPrompt ? (
                        <div className="absolute inset-0 z-20 bg-white/95 dark:bg-zinc-900/95 flex flex-col p-3 rounded-lg border border-indigo-500 shadow-xl">
                            <label className="text-[10px] font-bold uppercase text-indigo-500 mb-1">Custom Prompt</label>
                            <textarea
                                value={editPromptValue}
                                onChange={(e) => setEditPromptValue(e.target.value)}
                                className="flex-1 w-full text-xs p-2 rounded border border-gray-300 dark:border-zinc-700 bg-transparent resize-none focus:outline-none focus:border-indigo-500 mb-2"
                                placeholder="Describe image (e.g. Red apple on table)"
                                autoFocus
                            />
                            <div className="flex gap-2 justify-end">
                                <button
                                    onClick={() => setIsEditingPrompt(false)}
                                    className="text-[10px] px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-zinc-800"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSavePrompt}
                                    className="text-[10px] px-2 py-1 rounded bg-indigo-500 text-white hover:bg-indigo-600 font-bold"
                                >
                                    Save
                                </button>
                            </div>
                        </div>
                    ) : null}

                    {/* Custom Prompt Toggle Button - Top Left */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setEditPromptValue(customPrompt || imagePrompt || word);
                            setIsEditingPrompt(true);
                        }}
                        className="absolute top-2 left-2 z-10 p-2 bg-white/80 dark:bg-black/60 backdrop-blur-md rounded-lg border border-zinc-200 dark:border-zinc-700 opacity-0 group-hover/container:opacity-100 transition-opacity hover:bg-white dark:hover:bg-black"
                        title="Edit Image Prompt"
                    >
                        <NotebookPen size={14} className="text-zinc-600 dark:text-zinc-300" />
                    </button>

                    {generatedImage ? (
                        <div className="relative group/img w-full overflow-hidden rounded-lg border border-zinc-700/50 shadow-md">
                            <img
                                src={generatedImage}
                                alt={word}
                                className="w-full h-auto max-h-72 object-contain bg-black/5 dark:bg-black/20" // Imagem inteira
                            />
                            <button
                                onClick={generateImage}
                                disabled={generating}
                                className="absolute top-2 right-2 p-2 bg-black/60 hover:bg-black/90 backdrop-blur-md rounded-lg border border-white/10 opacity-0 group-hover/img:opacity-100 transition-all"
                                title="Regenerate"
                            >
                                <RotateCcw size={14} className={`text-white ${generating ? 'animate-spin' : ''}`} />
                            </button>
                            {customPrompt && <div className="absolute bottom-2 right-2 px-2 py-1 bg-indigo-500/80 text-white text-[9px] rounded font-bold backdrop-blur">CUSTOM</div>}
                        </div>
                    ) : (
                        <button
                            onClick={generateImage}
                            disabled={generating}
                            className="w-full h-24 bg-zinc-100 dark:bg-zinc-800/30 hover:dark:bg-zinc-800/50 rounded-lg border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-indigo-500/50 transition-all flex flex-col items-center justify-center gap-1 group/btn"
                        >
                            {generating ? (
                                <Sparkles size={20} className="text-indigo-400 animate-pulse" />
                            ) : (
                                <div className="text-xl opacity-50 group-hover/btn:scale-110 transition-transform">✨</div>
                            )}
                            <div className="flex flex-col items-center">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 group-hover/btn:text-indigo-400">Visualize</span>
                                {customPrompt && <span className="text-[9px] text-indigo-400">(Custom Prompt)</span>}
                            </div>
                        </button>
                    )}
                    {error && <p className="text-red-400 text-[10px] mt-1 text-center">{error}</p>}
                </div>
            </div>
        </div>
    );
};

// Exercise Component (Fill in the blank)
export const Exercise: React.FC<{ template: string; parts: string[] } & SectionProps> = ({ template, parts, isActive, onClick, darkMode = false }) => {
    if (!template) return null;
    // Unique ID for persistence
    const exerciseId = `exercise_${template.substring(0, 15).replace(/\s/g, '')}`;
    const [answer, setAnswer] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    // Persist answer
    useEffect(() => {
        const saved = localStorage.getItem(exerciseId);
        if (saved) setAnswer(saved);
    }, []);

    const handleChange = (val: string) => {
        setAnswer(val);
        localStorage.setItem(exerciseId, val);
    };

    // Auto-scroll
    useEffect(() => {
        if (isActive && containerRef.current) {
            containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [isActive]);

    return (
        <div ref={containerRef} onClick={onClick} className={`exercise-item break-inside-avoid page-break-inside-avoid transition-all duration-300 border rounded-xl p-6 my-4 
            ${isActive
                ? (darkMode
                    ? 'bg-indigo-900/20 border-indigo-500/50 shadow-md scale-[1.01]'
                    : 'bg-purple-50 border-purple-500 shadow-md scale-[1.01]')
                : (darkMode
                    ? 'bg-zinc-900/40 border-zinc-800/50 hover:border-zinc-700'
                    : 'bg-gray-50 border-gray-200 hover:border-gray-300')
            }`}>
            <div className={`flex items-center gap-3 flex-wrap text-lg leading-relaxed ${isActive ? (darkMode ? 'text-white' : 'text-gray-900') : (darkMode ? 'text-zinc-300' : 'text-gray-600')}`}>
                {parts.map((part, i) => (
                    <React.Fragment key={i}>
                        <span>{part}</span>
                        {i < parts.length - 1 && (
                            <input
                                type="text"
                                value={answer}
                                onChange={(e) => handleChange(e.target.value)}
                                className={`magic-input border-b-2 px-4 py-1 text-center min-w-[120px] outline-none rounded-t-lg transition-all font-bold tracking-wide font-serif italic
                                    ${darkMode ? 'text-blue-400 placeholder:text-zinc-700' : 'text-blue-600 placeholder:text-gray-300'}
                                    ${isActive
                                        ? (darkMode
                                            ? 'bg-indigo-950/50 border-blue-500/50 shadow-inner'
                                            : 'bg-white border-blue-400 shadow-inner')
                                        : (darkMode
                                            ? 'bg-zinc-800/50 border-zinc-700'
                                            : 'bg-white border-gray-300')
                                    } focus:border-blue-500`}
                                placeholder="write here..."
                                autoComplete="off"
                            />
                        )}
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
};

// Heading Component
export const Heading: React.FC<{ text: string; level: number } & SectionProps> = ({ text, level, isActive, onClick, darkMode = false }) => {
    const headingRef = useRef<HTMLDivElement>(null);
    const className =
        level === 1
            ? 'section-header text-4xl font-black border-l-8 border-indigo-600 pl-8 mt-12 mb-8 uppercase tracking-tight bg-gradient-to-r from-indigo-900/20 to-transparent py-4 rounded-r-2xl col-span-full break-after-avoid ' + (darkMode ? 'text-white' : 'text-gray-900')
            : 'text-2xl font-bold border-b pb-2 mt-8 mb-4 uppercase tracking-wide flex items-center gap-3 col-span-full break-after-avoid ' + (darkMode ? 'text-zinc-100 border-zinc-800' : 'text-gray-800 border-gray-200');

    // Auto-scroll removed
    // useEffect(() => {
    //     if (isActive && headingRef.current) {
    //         headingRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    //     }
    // }, [isActive]);

    return (
        <div ref={headingRef} onClick={onClick} className={`transition-opacity duration-500 break-inside-avoid page-break-inside-avoid opacity-100`}>
            {level === 1 ? (
                <h2 className={className}>{text}</h2>
            ) : (
                <h3 className={className}>
                    {text}
                </h3>
            )}
        </div>
    );
};

// List Item Component
export const ListItem: React.FC<{ number: number; text: string } & SectionProps> = ({ number, text, isActive, onClick, darkMode = false }) => {
    const itemRef = useRef<HTMLDivElement>(null);
    // Auto-scroll removed
    // useEffect(() => {
    //     if (isActive && itemRef.current) itemRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    // }, [isActive]);

    return (
        <div ref={itemRef} onClick={onClick} className={`flex gap-5 items-start my-4 p-4 rounded-xl transition-all duration-300 group cursor-pointer 
            ${darkMode
                ? 'hover:bg-white/5 border border-transparent'
                : 'hover:bg-gray-50 border border-transparent'}
        `}>
            <span className={`font-black text-xl min-w-[2.5rem] shrink-0 transition-colors 
                ${isActive
                    ? (darkMode ? 'text-indigo-400' : 'text-purple-600')
                    : (darkMode ? 'text-zinc-600 group-hover:text-zinc-400' : 'text-gray-400 group-hover:text-gray-600')
                }`}>{number}.</span>
            <p className={`text-lg leading-relaxed transition-colors 
                ${isActive
                    ? (darkMode ? 'text-white font-semibold' : 'text-black font-semibold')
                    : (darkMode ? 'text-zinc-400 group-hover:text-zinc-200' : 'text-gray-600 group-hover:text-gray-800')
                }`}>{text}</p>
        </div>
    );
};


// Paragraph Component
export const Paragraph: React.FC<{ text: string } & SectionProps> = ({ text, isActive, onClick, darkMode = false, highlighted, highlightColor }) => {
    const pRef = useRef<HTMLParagraphElement>(null);

    // Auto-scroll when active removed
    // useEffect(() => {
    //     if (isActive && pRef.current) {
    //         pRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    //     }
    // }, [isActive]);

    return (
        <p
            ref={pRef}
            onClick={onClick}
            className={`example-sentence text-lg my-4 pl-6 border-l-4 leading-relaxed transition-all duration-300 cursor-pointer rounded-r-lg
                ${darkMode
                    ? 'text-zinc-400 border-zinc-800 hover:text-zinc-300 py-2'
                    : 'text-gray-500 border-gray-200 hover:text-gray-700 py-2'
                }`}
        >
            <span className={(highlighted || highlightColor) ? getHighlightClass(highlightColor, darkMode) : ''}>
                {text}
            </span>
        </p>
    );
};

// Section Renderer - Dinamically renders based on type
export const LessonSectionRenderer: React.FC<{ section: LessonSection; isActive: boolean; darkMode?: boolean }> = ({ section, isActive, darkMode = false }) => {
    // Scroll handling is done inside individual components

    switch (section.type) {
        case 'vocabulary':
            return (
                <VocabularyCard
                    word={section.content.word}
                    translation={section.content.translation}
                    stress={section.content.stress || []}
                    category={section.content.category}
                    needsImage={section.needsImage}
                    imagePrompt={section.imagePrompt}
                    highlighted={section.content.highlighted}
                    highlightColor={section.content.highlightColor}
                    isActive={isActive}
                    darkMode={darkMode}
                />
            );
        case 'exercise':
            return <Exercise template={section.content.template} parts={section.content.parts} isActive={isActive} darkMode={darkMode} />;
        case 'heading':
            return <Heading text={section.content.text} level={section.content.level || 1} isActive={isActive} darkMode={darkMode} />;
        case 'list_item':
            return <ListItem number={section.content.number} text={section.content.text} isActive={isActive} darkMode={darkMode} />;
        case 'paragraph':
            return <Paragraph
                text={section.content.text}
                highlighted={section.content.highlighted}
                highlightColor={section.content.highlightColor}
                isActive={isActive}
                darkMode={darkMode}
            />;
        default:
            return (
                <div className="text-zinc-500 text-sm italic my-2">Unknown type: {section.type}</div>
            );
    }
};

// Complete Lesson Renderer
export const LessonRenderer: React.FC<{ data: LessonData; currentTime?: number; darkMode?: boolean }> = ({ data, currentTime = 0, darkMode = false }) => {
    // Flatten all sections to find active index easily
    const allSections = data.pages.flatMap(p => p.sections);

    // Find active section index based on timestamp
    // Revised logic to handle overlapping timestamps: pick the LAST one that started
    let activeIndex = -1;
    for (let i = 0; i < allSections.length; i++) {
        if (currentTime >= (allSections[i].audioTimestamp || 0)) {
            activeIndex = i;
        } else {
            // Since sections are usually sorted by timestamp, we can stop early
            break;
        }
    }

    return (
        <div id="lesson-container" className={`relative min-h-screen font-sans antialiased pb-32 ${darkMode ? 'bg-[#0a0a0a] text-white' : 'bg-white text-gray-900'}`}>
            {/* Header */}
            <header className={`text-center py-16 px-6 border-b bg-gradient-to-b to-transparent ${darkMode ? 'from-zinc-950 border-zinc-900/50' : 'from-gray-50 border-gray-200'}`}>
                <h1 className={`text-6xl md:text-8xl font-black tracking-tighter bg-clip-text text-transparent mb-6 drop-shadow-2xl ${darkMode ? 'bg-gradient-to-r from-white via-zinc-200 to-zinc-500' : 'bg-gradient-to-r from-gray-900 via-gray-700 to-gray-500'}`}>
                    {data.title}
                </h1>
                <p className={`text-xs md:text-sm uppercase tracking-[0.4em] font-medium border inline-block px-4 py-2 rounded-full ${darkMode ? 'text-zinc-500 border-zinc-800' : 'text-gray-500 border-gray-300'}`}>
                    Interactive Study Material
                </p>
            </header>

            {/* Content */}
            <main className="max-w-4xl mx-auto px-6 md:px-8 py-12 space-y-12">
                {data.pages.map((page, pageIdx) => (
                    <div key={page.number} className="page-sections grid grid-cols-1 gap-8">
                        {page.sections.map((section, sectionIdx) => {
                            // Calculate global index for this section to match with activeIndex
                            let globalIdx = 0;
                            for (let i = 0; i < pageIdx; i++) globalIdx += data.pages[i].sections.length;
                            globalIdx += sectionIdx;

                            const isActive = globalIdx === activeIndex;

                            return (
                                <LessonSectionRenderer
                                    key={`${page.number}-${sectionIdx}`}
                                    section={section}
                                    isActive={isActive}
                                    darkMode={darkMode}
                                />
                            );
                        })}
                    </div>
                ))}
            </main>

            {/* Footer */}
            <footer className="text-center py-12 text-zinc-700 text-xs border-t border-zinc-900/50 mt-12 bg-black/20">
                <p>Interactive lesson • Powered by Vision AI extraction</p>
            </footer>
        </div>
    );
};
