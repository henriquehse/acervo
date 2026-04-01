'use client';
import { PageNav } from '@/components/layout/PageNav';

import React, { useState, useEffect } from 'react';

import { DigitalClock, DateDisplay } from '@/components/ui/DigitalClock';
import { Slideover } from '@/components/ui/Slideover';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, X, Clock, ChevronDown, ChevronUp, Plus, Layout, Save, CheckCircle, Activity, Trash2, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Package, Search, Pencil, ArrowLeft } from 'lucide-react';

import { InteractiveCalendar } from '@/components/ui/InteractiveCalendar';
import { useRouter } from 'next/navigation';


// === TYPES ===
type DayType = 'weekday' | 'saturday' | 'sunday' | 'holiday';
type RoutineStatus = 'pending' | 'done' | 'not_done';

interface ActivityTemplate {
    id: number;
    title: string;
    description?: string;
    image_url?: string;
    category: string;
}

// === API BASE URL ===
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

interface RoutineItem {
    id: number;
    title: string;
    description?: string;
    time: string;
    day_type: DayType;
    image_url?: string;
    status: RoutineStatus;
    order: number;
    completed_at?: string;
}

// === QUOTES MOCK (Futuro: AI Generated) ===
const QUOTES = [
    "A disciplina é a ponte entre metas e realizações.",
    "O sucesso é a soma de pequenos esforços repetidos dia após dia.",
    "Acredite que você pode, assim você já está no meio do caminho.",
    "Não espere por oportunidade. Crie-as."
];

export default function RoutinePage() {
    const [activeSection, setActiveSection] = useState<DayType>('weekday');
    const [quote, setQuote] = useState(QUOTES[0]);
    const [routineItems, setRoutineItems] = useState<RoutineItem[]>([]);
    const [, setLoading] = useState(true);
    const [progress, setProgress] = useState(0);

    const [isSlideoverOpen, setIsSlideoverOpen] = useState(false);

    // TEMPLATES STATE
    const [templates, setTemplates] = useState<ActivityTemplate[]>([]);
    const [showTemplateSelector, setShowTemplateSelector] = useState(false);
    const [templateSearch, setTemplateSearch] = useState('');
    const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);

    // NEW STATE: Date Navigation
    const [currentDate, setCurrentDate] = useState(new Date());
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const router = useRouter();


    // Form States
    const [newActivityTitle, setNewActivityTitle] = useState('');
    const [newActivityTime, setNewActivityTime] = useState('07:00');
    const [newActivityType, setNewActivityType] = useState<DayType>('weekday');
    const [newActivityDesc, setNewActivityDesc] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [editingItem, setEditingItem] = useState<RoutineItem | null>(null); // Item sendo editado

    // Lista de feriados fixos (MM-DD)
    const FIXED_HOLIDAYS = ['01-01', '04-21', '05-01', '09-07', '10-12', '11-02', '11-15', '12-25'];

    // Verificar se uma data é feriado
    const isHoliday = (date: Date): boolean => {
        const mmdd = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        return FIXED_HOLIDAYS.includes(mmdd);
    };

    // State para janela de edição especial
    const [editWindowActive, setEditWindowActive] = useState(false);
    const [editWindowDate, setEditWindowDate] = useState<string | null>(null);

    // Auto-detect day type based on currentDate (incluindo feriados)
    useEffect(() => {
        // Primeiro, verifica se é feriado
        if (isHoliday(currentDate)) {
            setActiveSection('holiday');
        } else {
            const day = currentDate.getDay(); // 0=Dom, 6=Sab
            if (day === 0) setActiveSection('sunday');
            else if (day === 6) setActiveSection('saturday');
            else setActiveSection('weekday');
        }

        // Fetch for the new date
        syncAndFetch(currentDate);

        // Verifica janela de edição especial
        checkEditWindow();
    }, [currentDate]);

    // Verifica se há janela de edição ativa
    const checkEditWindow = async () => {
        try {
            const token = localStorage.getItem('bunker_token');
            const res = await fetch(`${API_BASE}/api/routine/edit-window`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setEditWindowActive(data.active);
                setEditWindowDate(data.target_date);
            }
        } catch (error) {
            console.error("Window check error:", error);
        }

    };

    // Initial Load (Quotes)
    useEffect(() => {
        // Quote rotation
        const interval = setInterval(() => {
            setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
        }, 300000); // 5 min

        return () => clearInterval(interval);
    }, []);

    const syncAndFetch = async (targetDate: Date = new Date()) => {
        const token = localStorage.getItem('bunker_token');
        if (!token) return;

        setLoading(true);

        try {
            // 1. Sync (Catch-up logic) - Processa dias pendentes
            const syncRes = await fetch(`${API_BASE}/api/routine/sync`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const syncData = await syncRes.json();
            console.log('🚀 Sync completo:', syncData);

            // 2. Fetch Data with Date parameter
            const y = targetDate.getFullYear();
            const m = String(targetDate.getMonth() + 1).padStart(2, '0');
            const d = String(targetDate.getDate()).padStart(2, '0');
            const dateStr = `${y}-${m}-${d}`;

            const res = await fetch(`${API_BASE}/api/routine?date=${dateStr}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) throw new Error("Backend offline");

            const data = await res.json();

            if (Array.isArray(data)) {
                setRoutineItems(data);
                // Calcula progresso local como fallback
                calculateProgressFromItems(data);
            } else {
                console.error("API Response is not an array:", data);
                setRoutineItems([]);
            }

            // 3. Busca progresso do dia atual do backend (mais preciso)
            if (isDateToday(targetDate)) {
                await fetchTodayProgress();
            }
        } catch (error) {
            console.warn("Backend unavailable, using mock routine items", error);

            const mockItems: RoutineItem[] = [
                { id: 1, title: 'Workout', time: '07:00', day_type: 'weekday', status: 'done', order: 1 },
                { id: 2, title: 'Read Book', time: '21:00', day_type: 'weekday', status: 'pending', order: 2 },
                { id: 3, title: 'Deep Work', time: '09:00', day_type: 'weekday', status: 'not_done', order: 3 },
                { id: 4, title: 'Rest', time: '10:00', day_type: 'sunday', status: 'pending', order: 1 }
            ];
            setRoutineItems(mockItems);
            calculateProgressFromItems(mockItems);
        } finally {
            setLoading(false);
        }
    };

    const fetchTodayProgress = async () => {
        const token = localStorage.getItem('bunker_token');
        if (!token) return;

        try {
            const res = await fetch(`${API_BASE}/api/routine/today/progress`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Backend offline");
            const data = await res.json();
            setProgress(data.success_rate || 0);
            console.log('📊 Progresso HOJE:', data.success_rate + '%');
        } catch (error) {
            console.error("Progress fetch error:", error);
        }

    };

    const calculateProgressFromItems = (items: RoutineItem[]) => {
        // Fallback: calcula baseado nos items carregados
        // O ideal é usar o endpoint /today/progress
        if (items.length === 0) {
            setProgress(0);
            return;
        }

        const done = items.filter(i => i.status === 'done').length;
        setProgress(Math.round((done / items.length) * 100));
    };

    // DATE HELPERS
    const handlePrevDay = () => {
        const d = new Date(currentDate);
        d.setDate(d.getDate() - 1);
        setCurrentDate(d);
    };

    const handleNextDay = () => {
        const d = new Date(currentDate);
        d.setDate(d.getDate() + 1);
        setCurrentDate(d);
    };




    const isDateToday = (date: Date) => {
        const today = new Date();
        return date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();
    };

    // Permite edição se: é hoje OU se há janela de edição ativa para a data atual
    const currentDateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
    const isViewOnly = !isDateToday(currentDate) && !(editWindowActive && editWindowDate === currentDateStr);

    const handleStatusClick = async (item: RoutineItem) => {
        // Block changes in past/future view
        if (isViewOnly) {
            alert("Você está visualizando o histórico. Volte para HOJE para editar.");
            return;
        }

        // 🚪 SE JANELA DE EDIÇÃO ATIVA: Pula validações restritivas
        if (!editWindowActive) {
            // Validation: Day Check (só se NÃO for janela especial)
            const day = new Date().getDay();
            let currentDayType: DayType = 'weekday';
            if (day === 0) currentDayType = 'sunday';
            else if (day === 6) currentDayType = 'saturday';

            if (item.day_type !== currentDayType) {
                alert(`Esta atividade pertence a "${item.day_type === 'weekday' ? 'Segunda a Sexta' : item.day_type === 'saturday' ? 'Sábado' : 'Domingo'}". Hoje é outro dia! 📅`);
                return;
            }

            // Validation: Future Check (só se NÃO for janela especial)
            const now = new Date();
            const [h, m] = item.time.split(':').map(Number);
            const activityTime = new Date();
            activityTime.setHours(h, m, 0, 0);
            const diffMinutes = (activityTime.getTime() - now.getTime()) / 1000 / 60;

            if (diffMinutes > 30) {
                alert(`Ainda não é hora dessa atividade! (${item.time})`);
                return;
            }
        }

        let newStatus: RoutineStatus = 'pending';

        // Cycle: Pending -> Done -> Not Done -> Pending
        if (item.status === 'pending') newStatus = 'done';
        else if (item.status === 'done') newStatus = 'not_done';
        else newStatus = 'pending';

        // Otimistic update
        const updatedItems = routineItems.map(i =>
            i.id === item.id ? { ...i, status: newStatus } : i
        );
        setRoutineItems(updatedItems);

        // API Call
        try {
            const token = localStorage.getItem('bunker_token');
            // Formata data para YYYY-MM-DD
            const y = currentDate.getFullYear();
            const m = String(currentDate.getMonth() + 1).padStart(2, '0');
            const d = String(currentDate.getDate()).padStart(2, '0');
            const dateStr = `${y}-${m}-${d}`;

            const res = await fetch(`${API_BASE}/api/routine/toggle`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    template_id: item.id,
                    status: newStatus,
                    date_ref: dateStr // ENVIA A DATA SELECIONADA
                })
            });

            if (!res.ok) throw new Error("Backend offline");

            const data = await res.json();

            // 🎯 Atualiza progresso com valor do backend (mais preciso)
            if (data.live_progress) {
                setProgress(data.live_progress.success_rate);
                console.log(`📊 Progresso atualizado: ${data.live_progress.completed}/${data.live_progress.total} (${data.live_progress.success_rate}%)`);
            }
        } catch (error) {
            console.warn("Offline mock toggle success", error);
            calculateProgressFromItems(updatedItems);
        }

    };

    // Helper para verificar dia atual no render (considera feriados!)
    const isToday = (dayType: DayType) => {
        const today = new Date();

        // Primeiro verifica se é feriado
        if (isHoliday(today)) {
            return dayType === 'holiday';
        }

        const day = today.getDay();
        let current: DayType = 'weekday';
        if (day === 0) current = 'sunday';
        else if (day === 6) current = 'saturday';
        return dayType === current;
    };

    const handleRefreshImage = async (e: React.MouseEvent, item: RoutineItem) => {
        e.stopPropagation();
        if (!confirm('Gerar nova imagem com IA? Isso pode levar alguns segundos.')) return;

        try {
            const token = localStorage.getItem('bunker_token');
            const res = await fetch(`${API_BASE}/api/routine/${item.id}/refresh-image`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                syncAndFetch(); // Recarrega para pegar a nova URL
            }
        } catch (error) {
            console.error('Erro ao gerar imagem', error);
        }

    };

    const handleSaveActivity = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            const token = localStorage.getItem('bunker_token');
            if (!token) return;

            if (editingItem) {
                // UPDATE
                const res = await fetch(`${API_BASE}/api/routine/${editingItem.id}`, {
                    method: 'PATCH',
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        title: newActivityTitle,
                        time: newActivityTime,
                        day_type: newActivityType,
                        description: newActivityDesc
                    })
                });

                if (res.ok) {
                    setIsSlideoverOpen(false);
                    setEditingItem(null);
                    alert("Atividade atualizada!");
                    syncAndFetch(currentDate);
                }
            } else {
                // CREATE
                const res = await fetch(`${API_BASE}/api/routine`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        title: newActivityTitle,
                        time: newActivityTime,
                        day_type: newActivityType,
                        description: newActivityDesc,
                        activity_template_id: selectedTemplateId
                    })
                });

                if (res.ok) {
                    const createdActivity = await res.json();
                    const usedTemplate = selectedTemplateId !== null; // Guardar antes de resetar
                    setIsSlideoverOpen(false);
                    setNewActivityTitle('');
                    setNewActivityDesc('');
                    setSelectedTemplateId(null);

                    await syncAndFetch();

                    // SÓ gera imagem se criou atividade DO ZERO (sem template)
                    // Se usou template, a imagem já vem pronta ou o usuário gera manualmente
                    if (createdActivity && createdActivity.id && !usedTemplate) {
                        alert("Atividade criada! Gerando imagem em background... 🎨");
                        fetch(`${API_BASE}/api/routine/${createdActivity.id}/refresh-image`, {
                            method: 'POST',
                            headers: { 'Authorization': `Bearer ${token}` }
                        }).then(() => syncAndFetch()).catch(console.error);
                    } else {
                        alert("Atividade criada com sucesso! ✅");
                    }
                } else {
                    throw new Error("Backend offline");
                }
            }
        } catch (error) {
            console.warn("Backend offline, updating local state mock for save", error);

            const newItem: RoutineItem = {
                id: Date.now(),
                title: newActivityTitle,
                time: newActivityTime,
                day_type: newActivityType,
                status: 'pending',
                order: routineItems.length + 1,
                description: newActivityDesc
            };
            if (editingItem) {
                setRoutineItems(routineItems.map(i => i.id === editingItem.id ? { ...i, ...newItem } : i));
            } else {
                setRoutineItems([...routineItems, newItem]);
            }
            setIsSlideoverOpen(false);
            setEditingItem(null);
            setNewActivityTitle('');
            setNewActivityDesc('');
        } finally {
            setIsSaving(false);
        }
    };


    const openSlideover = (type?: DayType) => {
        setEditingItem(null); // Reset edit mode
        if (type) setNewActivityType(type);
        setNewActivityTitle('');
        setNewActivityDesc('');
        setNewActivityTime('07:00');
        setSelectedTemplateId(null);
        setShowTemplateSelector(false);
        fetchTemplates();
        setIsSlideoverOpen(true);
    };

    const openEditSlideover = (e: React.MouseEvent, item: RoutineItem) => {
        e.stopPropagation();
        setEditingItem(item);
        setNewActivityTitle(item.title);
        setNewActivityDesc(item.description || '');
        setNewActivityTime(item.time);
        setNewActivityType(item.day_type);
        setShowTemplateSelector(false);
        setIsSlideoverOpen(true);
    };

    const fetchTemplates = async () => {
        const token = localStorage.getItem('bunker_token');
        if (!token) return;
        try {
            const res = await fetch('/api/templates', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setTemplates(data);
            }
        } catch (e) {
            console.error("Erro fetching templates", e);
        }
    };

    const handleSelectTemplate = (template: ActivityTemplate) => {
        setNewActivityTitle(template.title);
        setNewActivityDesc(template.description || '');
        setSelectedTemplateId(template.id);
        setShowTemplateSelector(false);
    };

    const handleDeleteActivity = async (e: React.MouseEvent, item: RoutineItem) => {
        e.stopPropagation(); // Prevent status toggle

        const confirmed = confirm(`Tem certeza que deseja deletar "${item.title}"?`);
        if (!confirmed) return;

        try {
            const token = localStorage.getItem('bunker_token');
            const res = await fetch(`${API_BASE}/api/routine/${item.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                // Remove from local state
                setRoutineItems(routineItems.filter(i => i.id !== item.id));
                alert('Atividade deletada com sucesso!');
            } else {
                throw new Error("Backend off");
            }
        } catch (e) {
            console.warn('Backend offline mock delete:', e);
            setRoutineItems(routineItems.filter(i => i.id !== item.id));
        }
    };

    return (
        <div className="flex bg-[#08080c] min-h-screen text-gray-100">
            <PageNav title="Rotina" />


            <div className="flex-1 px-4 md:px-8 py-6 md:py-8 pt-14 flex flex-col w-full max-w-[95%] 2xl:max-w-[2400px] mx-auto pb-32">
                <header className="flex flex-col md:flex-row md:items-end justify-between mb-8 md:mb-12 border-b border-white/5 pb-6 md:pb-8 gap-6 md:gap-0">
                    <div className="text-center md:text-left">
                        <div className="flex items-center justify-center md:justify-start gap-4 mb-4">
                            <button
                                onClick={() => router.push('/')}
                                className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-all border border-white/10"
                            >
                                <ArrowLeft size={20} />
                            </button>
                            <DateDisplay />
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black text-white mt-2">Minha Rotina</h1>
                        <p className="text-gray-500 mt-1 max-w-lg italic text-sm md:text-base">&quot;{quote}&quot;</p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center md:items-end gap-4 md:gap-6 w-full md:w-auto">
                        {/* DATE NAVIGATOR */}
                        <div className="flex bg-white/5 p-1 rounded-xl border border-white/5 items-center gap-1 sm:gap-2 w-full sm:w-auto justify-between sm:justify-center">
                            <button onClick={handlePrevDay} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-all">
                                <ChevronLeft size={20} />
                            </button>
                            <div className="flex flex-col items-center px-4 min-w-[120px]">
                                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-none mb-1">
                                    {isDateToday(currentDate) ? 'HOJE' : 'HISTÓRICO'}
                                </span>


                                <div
                                    className="text-lg text-white font-mono font-bold flex items-center gap-2 cursor-pointer hover:text-purple-400 transition-colors"
                                    onClick={() => setIsCalendarOpen(true)}
                                >
                                    <CalendarIcon size={16} className="text-purple-500" />
                                    {currentDate.toLocaleDateString('pt-BR')}
                                </div>
                            </div>
                            <button onClick={handleNextDay} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-all">
                                <ChevronRight size={20} />
                            </button>
                        </div>

                        <div className="hidden md:block text-right">
                            <DigitalClock />
                        </div>
                    </div>
                </header>

                <div className="mb-12">
                    <div className="flex justify-between text-xs text-gray-400 mb-2 font-medium uppercase tracking-wider">
                        <span>Progresso Diário</span>
                        <span>{progress}%</span>
                    </div>
                    <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-[#FF6B00] to-[#25D366] transition-all duration-1000 ease-out"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>

                <div className="space-y-6">
                    {(['weekday', 'saturday', 'sunday', 'holiday'] as DayType[]).map((type) => {
                        const labelMap: Record<DayType, string> = {
                            'weekday': 'Segunda a Sexta',
                            'saturday': 'Sábado',
                            'sunday': 'Domingo',
                            'holiday': '🎉 Feriado'
                        };

                        return (
                            <div key={type} className={`border border-white/5 rounded-2xl overflow-hidden bg-[#12121a] transition-all duration-500 ${activeSection === type ? 'ring-1 ring-[#FF6B00]/30' : 'opacity-60 hover:opacity-100'}`}>
                                <button
                                    onClick={() => setActiveSection(type === activeSection ? activeSection : type)}
                                    className="w-full p-4 md:p-6 flex items-center justify-between bg-white/5 hover:bg-white/10 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <Layout className={`${activeSection === type ? 'text-[#FF6B00]' : 'text-gray-500'} w-[18px] h-[18px] md:w-[20px] md:h-[20px]`} />
                                        <span className="font-bold uppercase tracking-wider text-xs md:text-sm">
                                            {labelMap[type]}
                                            <span className="ml-2 md:ml-3 text-[10px] md:text-xs opacity-50 bg-white/10 px-2 py-0.5 rounded-full">
                                                {routineItems.filter(i => i.day_type === type).length}
                                            </span>
                                        </span>
                                    </div>
                                    {activeSection === type ? <ChevronUp className="w-[16px] h-[16px] md:w-[18px] md:h-[18px]" /> : <ChevronDown className="w-[16px] h-[16px] md:w-[18px] md:h-[18px]" />}
                                </button>

                                <AnimatePresence>
                                    {activeSection === type && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="p-4 md:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 min-[2000px]:grid-cols-5 gap-4 md:gap-8"
                                        >
                                            {routineItems.filter(i => i.day_type === type).map((item) => {
                                                // Lógica de "congelado":
                                                // 1. Se o tipo do dia não é o dia atual (ex: vendo atividades de sábado numa segunda)
                                                // 2. OU se estamos no histórico (visualizando data passada)
                                                const isDayTypeMismatch = !isToday(type);
                                                const isHistoricalView = isViewOnly; // Estamos vendo uma data que não é hoje

                                                // Cards ficam "frozen" (grayscale) se:
                                                // - É um tipo de dia diferente do atual, OU
                                                // - Estamos vendo histórico E a atividade não foi concluída
                                                const isFrozen = isDayTypeMismatch || (isHistoricalView && item.status !== 'done');

                                                return (
                                                    <div
                                                        key={item.id}
                                                        onClick={() => handleStatusClick(item)}
                                                        className={`
                                                    relative group cursor-pointer aspect-square rounded-2xl overflow-hidden transition-all duration-500 shadow-2xl shadow-black/50
                                                    ${isFrozen ? 'opacity-40 grayscale hover:opacity-100 hover:grayscale-0 ring-1 ring-white/5' : ''}
                                                    ${!isFrozen && item.status === 'done' ? 'ring-2 ring-[#25D366] grayscale-[0.5] hover:grayscale-0' : ''}
                                                    ${!isFrozen && item.status === 'not_done' ? 'ring-2 ring-[#D45B5B] grayscale' : ''}
                                                    ${!isFrozen && item.status === 'pending' ? 'ring-1 ring-white/10 hover:ring-[#FF6B00]/50 hover:shadow-2xl hover:shadow-[#FF6B00]/10 hover:scale-[1.01]' : ''}
                                                `}
                                                    >
                                                        {/* INACTIVE DAY OVERLAY (Texto sutil) */}
                                                        {isFrozen && (
                                                            <div className="absolute top-4 right-4 z-40 px-2 py-1 bg-black/80 rounded text-[10px] font-bold uppercase tracking-widest text-white/50">
                                                                Dia Inativo
                                                            </div>
                                                        )}

                                                        {/* Background Image */}
                                                        <div className="absolute inset-0 bg-[#0a0a0f]">
                                                            {item.image_url ? (
                                                                <img
                                                                    src={`${item.image_url}`}
                                                                    className={`w-full h-full object-cover transition-transform duration-1000 ${item.status === 'done' && !isFrozen ? 'scale-100 opacity-30' : 'scale-105 group-hover:scale-110 opacity-70 group-hover:opacity-100'
                                                                        }`}
                                                                    alt={item.title}
                                                                />

                                                            ) : (
                                                                <div className="w-full h-full bg-gradient-to-br from-[#1a1a24] to-[#0a0a0f] flex items-center justify-center">
                                                                    <Activity size={32} className="text-white/10" />
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Cinematic Overlay */}
                                                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                                                        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent opacity-60" />

                                                        {/* Refresh Button */}
                                                        <button
                                                            onClick={(e) => handleRefreshImage(e, item)}
                                                            className="absolute top-4 right-4 p-2 bg-black/40 backdrop-blur-md rounded-full text-white/70 hover:text-white hover:bg-[#FF6B00] transition-all opacity-100 md:opacity-0 group-hover:opacity-100 z-30 transform hover:rotate-180 duration-500"
                                                            title="Gerar Nova Imagem"
                                                        >
                                                            <RefreshCw size={14} />
                                                        </button>

                                                        <button
                                                            onClick={(e) => openEditSlideover(e, item)}
                                                            className="absolute top-4 right-20 md:right-24 p-2 bg-black/40 backdrop-blur-md rounded-full text-white/70 hover:text-white hover:bg-blue-500 transition-all opacity-100 md:opacity-0 group-hover:opacity-100 z-30"
                                                            title="Editar Atividade"
                                                        >
                                                            <Pencil size={14} />
                                                        </button>

                                                        {/* Delete Button */}
                                                        <button
                                                            onClick={(e) => handleDeleteActivity(e, item)}
                                                            className="absolute top-4 right-12 md:right-14 p-2 bg-black/40 backdrop-blur-md rounded-full text-white/70 hover:text-white hover:bg-red-500 transition-all opacity-100 md:opacity-0 group-hover:opacity-100 z-30"
                                                            title="Deletar Atividade"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>

                                                        {/* Status Badge */}
                                                        <div className="absolute top-4 left-4 z-20">
                                                            {item.status === 'done' && (
                                                                <div className="flex flex-col gap-1 items-start">
                                                                    <div className="flex items-center gap-1.5 bg-[#25D366] text-black text-xs font-black px-3 py-1.5 rounded-full uppercase tracking-wider shadow-[0_0_15px_rgba(37,211,102,0.5)]">
                                                                        <CheckCircle size={12} fill="black" /> DONE
                                                                    </div>
                                                                    {item.completed_at && (
                                                                        <div className="text-[#25D366] text-[10px] font-black bg-black/60 backdrop-blur-md px-2 py-0.5 rounded ml-1 border border-[#25D366]/30">
                                                                            {new Date(item.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                            {item.status === 'not_done' && <div className="bg-[#D45B5B]/20 backdrop-blur-md border border-[#D45B5B]/30 text-[#D45B5B] text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Missed</div>}
                                                            {item.status === 'pending' && <div className="bg-[#FF6B00]/20 backdrop-blur-md border border-[#FF6B00]/30 text-[#FF6B00] text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Pending</div>}
                                                        </div>

                                                        {/* Content - Bottom */}
                                                        <div className="absolute bottom-0 left-0 w-full p-6 md:p-8 bg-gradient-to-t from-black to-transparent z-10 pt-20">
                                                            <div className="flex items-center gap-2 text-[#FF6B00] text-xs md:text-sm font-bold mb-1 md:mb-2 shadow-black drop-shadow-md">
                                                                <Clock className="w-[14px] h-[14px] md:w-[16px] md:h-[16px]" strokeWidth={3} />
                                                                {item.time}
                                                            </div>
                                                            <h3 className="text-2xl md:text-3xl font-black text-white uppercase tracking-wide leading-none mb-2 drop-shadow-xl">
                                                                {item.title}
                                                            </h3>
                                                            {/* Descrição NÃO aparece no card - só usada para gerar prompt da imagem */}
                                                        </div>
                                                    </div>
                                                );
                                            })}

                                            {/* Create New Card Trigger */}
                                            <div
                                                onClick={() => openSlideover(type)}
                                                className="aspect-square rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center text-gray-600 hover:text-white hover:border-[#FF6B00]/50 hover:bg-[#FF6B00]/5 cursor-pointer transition-all gap-2 group"
                                            >
                                                <div className="p-4 rounded-full bg-white/5 group-hover:bg-[#FF6B00]/20 transition-colors">
                                                    <Plus size={32} className="group-hover:text-[#FF6B00]" />
                                                </div>
                                                <span className="text-sm font-bold uppercase tracking-wider">Nova Atividade</span>
                                            </div>

                                        </motion.div>
                                    )}
                                </AnimatePresence>

                            </div>
                        );
                    })}
                </div>

                <Slideover
                    isOpen={isSlideoverOpen}
                    onClose={() => setIsSlideoverOpen(false)}
                    title={editingItem ? "Editar Atividade" : "Nova Atividade"}
                >
                    <form onSubmit={handleSaveActivity} className="space-y-6">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Título da Atividade</label>
                            <input
                                type="text"
                                value={newActivityTitle}
                                onChange={(e) => setNewActivityTitle(e.target.value)}
                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#FF6B00] transition-colors"
                                placeholder="Ex: Ler 10 páginas"
                            />
                        </div>

                        {/* TEMPLATE SELECTOR */}
                        <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                                Usar Template Existente
                            </label>

                            {!showTemplateSelector ? (
                                <button
                                    type="button"
                                    onClick={() => setShowTemplateSelector(true)}
                                    className="w-full py-3 bg-[#E74C3C]/10 border border-[#E74C3C]/30 text-[#E74C3C] rounded-xl flex items-center justify-center gap-2 hover:bg-[#E74C3C]/20 transition-all font-bold"
                                >
                                    <Package size={18} />
                                    Escolher da Biblioteca
                                </button>
                            ) : (
                                <div className="space-y-3">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                                        <input
                                            type="text"
                                            placeholder="Buscar template..."
                                            value={templateSearch}
                                            onChange={(e) => setTemplateSearch(e.target.value)}
                                            className="w-full bg-black/40 border border-white/10 rounded-lg pl-10 pr-3 py-2 text-sm text-white focus:outline-none focus:border-[#E74C3C]"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowTemplateSelector(false)}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>

                                    <div className="max-h-48 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                                        {templates.filter(t => t.title.toLowerCase().includes(templateSearch.toLowerCase())).map(t => (
                                            <div
                                                key={t.id}
                                                onClick={() => handleSelectTemplate(t)}
                                                className="p-3 bg-black/40 rounded-lg border border-white/5 hover:border-[#E74C3C]/50 cursor-pointer flex items-center gap-3 group"
                                            >
                                                {t.image_url ? (
                                                    <img src={`${t.image_url}`} className="w-10 h-10 rounded-md object-cover" alt={t.title} />

                                                ) : (
                                                    <div className="w-10 h-10 rounded-md bg-white/10 flex items-center justify-center">
                                                        <Package size={16} className="text-gray-500" />
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-white text-sm font-medium truncate group-hover:text-[#E74C3C] transition-colors">{t.title}</p>
                                                    <p className="text-gray-500 text-xs truncate">{t.description}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {selectedTemplateId && (
                                <div className="mt-3 flex items-center gap-2 text-xs text-green-400 bg-green-400/10 px-3 py-2 rounded-lg border border-green-400/20">
                                    <CheckCircle size={14} />
                                    Template vinculado com sucesso!
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Horário</label>
                                <input
                                    type="time"
                                    value={newActivityTime}
                                    onChange={(e) => setNewActivityTime(e.target.value)}
                                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#FF6B00] transition-colors"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Frequência</label>
                                <select
                                    value={newActivityType}
                                    onChange={(e) => setNewActivityType(e.target.value as DayType)}
                                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#FF6B00] transition-colors appearance-none"
                                >
                                    <option value="weekday">Segunda a Sexta</option>
                                    <option value="saturday">Sábado</option>
                                    <option value="sunday">Domingo</option>
                                    <option value="holiday">🎉 Feriado</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Descrição (Opcional)</label>
                            <textarea
                                value={newActivityDesc}
                                onChange={(e) => setNewActivityDesc(e.target.value)}
                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#FF6B00] transition-colors h-24 resize-none"
                                placeholder="Detalhes sobre a atividade..."
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isSaving}
                            className={`w-full py-4 bg-gradient-to-r from-[#FF6B00] to-[#FF8533] rounded-xl font-bold text-white shadow-lg shadow-[#FF6B00]/20 hover:shadow-[#FF6B00]/40 transition-all flex items-center justify-center gap-2 ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <Save size={18} />
                            {isSaving ? 'Salvando...' : 'Salvar Atividade'}
                        </button>
                    </form>
                </Slideover>

                <AnimatePresence>
                    {isCalendarOpen && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                            <div className="w-full max-w-md">
                                <InteractiveCalendar
                                    selectedDate={currentDate}
                                    onDateSelect={(date) => {
                                        setCurrentDate(date);
                                        setIsCalendarOpen(false);
                                    }}
                                    onClose={() => setIsCalendarOpen(false)}
                                />
                            </div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

