'use client';
import { PageNav } from '@/components/layout/PageNav';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Activity, Heart, Moon, Zap, Droplets, Brain, TrendingUp,
    Flame, Footprints, Timer, ThermometerSun, Wind,
    Scale, Target, Plus, ChevronRight,
    AlertTriangle, CheckCircle, Dumbbell, Bed, Play,
    X, ExternalLink, ShieldCheck, CircleDot, Waves, Pizza, IceCream,
    Salad, Beef, Egg, Fish, Leaf, Clock, BarChart3
} from 'lucide-react';

// API Base URL
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

// ============================================
// BIO-DATA - TACTICAL PERFORMANCE HUD
// Sistema de Inteligência Biométrica de Elite
// ============================================

export default function BioDataPage() {
    const [activeTab, setActiveTab] = useState('overview');
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [generatingWorkout, setGeneratingWorkout] = useState(false);
    const [generatedWorkout, setGeneratedWorkout] = useState<any>(null);
    const [generatingNutrition, setGeneratingNutrition] = useState(false);
    const [generatedNutrition, setGeneratedNutrition] = useState<any>(null);
    const [activeExerciseVideo, setActiveExerciseVideo] = useState<any>(null);
    const [savingWorkout, setSavingWorkout] = useState(false);
    const [workoutSaved, setWorkoutSaved] = useState(false);
    const [workoutGoal, setWorkoutGoal] = useState('hipertrofia');
    const [workoutDuration, setWorkoutDuration] = useState(45);
    const [workoutLevel, setWorkoutLevel] = useState('intermediario');
    const [workoutEquipment, setWorkoutEquipment] = useState('academia');
    const [currentTime, setCurrentTime] = useState(new Date());
    const [syncingWearable, setSyncingWearable] = useState(false);
    const [showManualDataModal, setShowManualDataModal] = useState(false);
    const [manualData, setManualData] = useState({
        steps: 5000, calories: 1200, active_minutes: 30, sleep_hours: 8.0,
        sleep_deep: 1.5, sleep_rem: 2.0, sleep_quality: 85,
        weight: 78.5, body_fat: 18.0, muscle_mass: 38.5, hydration: 55,
        heart_rate: 68, blood_pressure_sys: 120, blood_pressure_dia: 80,
        hrv: 55, body_temp: 36.5, respiratory_rate: 14, blood_oxygen: 98,
        water_glasses: 6, mood: 'good' as string, energy_level: 7,
        notes: ''
    });
    const [manualDataTab, setManualDataTab] = useState<'activity' | 'sleep' | 'vitals' | 'body'>('activity');

    // ── User Profile ──
    const [profile, setProfile] = useState(() => {
        try { return JSON.parse(localStorage.getItem('acervo_biodata_profile') || 'null') || { name: '', age: '', weight: '', height: '', goal: 'hipertrofia' }; } catch { return { name: '', age: '', weight: '', height: '', goal: 'hipertrofia' }; }
    });

    // ── Workout videos from YT ──
    const [workoutVideos, setWorkoutVideos] = useState<{ id: string; title: string; thumbnail: string; channel: string }[]>([]);

    const saveManualData = async () => {
        setSyncingWearable(true);
        try {
            const res = await fetch(`${API_BASE}/api/biodata/wearable/manual_update`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(manualData)
            });
            if (res.ok) {
                setShowManualDataModal(false);
                // Atualiza dashboard em 2 segundos para dar tempo ao Supabase
                setTimeout(async () => {
                    const resDash = await fetch(`${API_BASE}/api/biodata/dashboard`);
                    const json = await resDash.json();
                    setData(json);
                }, 2000);
            } else {
                alert('Erro ao salvar dados manuais!');
            }
        } catch (err) {
            console.error('Erro:', err);
        } finally {
            setSyncingWearable(false);
        }
    };

    useEffect(() => {
        const interval = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const res = await fetch(`${API_BASE}/api/biodata/dashboard`);
                const json = await res.json();
                setData(json);
            } catch (err) {
                console.error("Erro ao buscar BioData:", err);
                // Mock data fallback
                setData({
                    vitals: {
                        heartRate: { current: 68, min: 52, max: 142, avg: 72, status: 'optimal' },
                        hrv: { current: 58, trend: 'up', status: 'good' },
                        bloodOxygen: { current: 98, status: 'optimal' },
                        respiratoryRate: { current: 14, status: 'optimal' },
                        bodyTemp: { current: 36.5, status: 'normal' },
                        bloodPressure: { systolic: 118, diastolic: 76, status: 'optimal' }
                    },
                    sleep: {
                        lastNight: { total: 7.5, deep: 1.8, rem: 2.1, light: 3.2, awake: 0.4, score: 85 },
                        weekAvg: 7.2, trend: 'improving'
                    },
                    fitness: {
                        steps: { today: 8432, goal: 10000 },
                        calories: { burned: 2150, goal: 2500, consumed: 1850 },
                        activeMinutes: { today: 45, goal: 60 },
                        workouts: { week: 4, streak: 12 },
                        vo2max: 42, restingHR: 58
                    },
                    body: {
                        weight: { current: 78.5, goal: 75, trend: 'down' },
                        bodyFat: { current: 18.2, goal: 15 },
                        muscle: { current: 38.5, trend: 'up' },
                        hydration: { current: 52, optimal: 60 },
                        bmi: 24.1
                    },
                    wellnessScore: 82,
                    insights: [
                        { type: 'success', message: 'Sono profundo acima da média (+15%)', icon: 'CheckCircle' },
                        { type: 'warning', message: 'Hidratação abaixo do ideal. Beba mais água.', icon: 'AlertTriangle' },
                        { type: 'info', message: 'HRV em 58ms - Prontidão alta para treino intenso.', icon: 'TrendingUp' },
                        { type: 'success', message: 'Streak de 12 dias consecutivos!', icon: 'Flame' }
                    ]
                });
            } finally {
                setLoading(false);
            }
        };
        fetchDashboard();
    }, []);

    const generateWorkout = async () => {
        setGeneratingWorkout(true);
        setWorkoutVideos([]);

        // Build static workout protocol based on params
        const goalLabels: Record<string, string> = {
            hipertrofia: 'Hipertrofia', emagrecimento: 'Emagrecimento', forca: 'Força',
            longevidade: 'Longevidade', funcional: 'Funcional'
        };
        const levelLabels: Record<string, string> = {
            iniciante: 'Recruta', intermediario: 'Soldado', avancado: 'Operador'
        };
        const workoutPlans: Record<string, any> = {
            hipertrofia: {
                title: `Protocolo Hipertrofia — ${levelLabels[workoutLevel]}`,
                description: 'Foco em volume e hiper estimulação muscular.',
                rounds: workoutDuration <= 30 ? 3 : workoutDuration <= 60 ? 4 : 5,
                exercises: [
                    { name: 'Agachamento Livre', sets: '4x8-12', rest: '90s', muscle: 'Quádriceps/Glúteos' },
                    { name: 'Supino Reto', sets: '4x8-12', rest: '90s', muscle: 'Peitoral' },
                    { name: 'Remada Curvada', sets: '3x10', rest: '60s', muscle: 'Costas' },
                    { name: 'Desenvolvimento', sets: '3x10-12', rest: '60s', muscle: 'Ombros' },
                    { name: 'Rosca Direta', sets: '3x12', rest: '45s', muscle: 'Bíceps' },
                    { name: 'Tríceps Corda', sets: '3x12', rest: '45s', muscle: 'Tríceps' },
                ].slice(0, workoutDuration <= 30 ? 4 : 6)
            },
            emagrecimento: {
                title: `Protocolo Fat Burn — ${levelLabels[workoutLevel]}`,
                description: 'Alta intensidade e circuito para máximo gasto calórico.',
                rounds: 4,
                exercises: [
                    { name: 'Burpee', sets: '4x15', rest: '30s', muscle: 'Full Body' },
                    { name: 'Jump Squat', sets: '4x20', rest: '30s', muscle: 'Pernas/Glúteos' },
                    { name: 'Mountain Climber', sets: '4x30', rest: '30s', muscle: 'Core/Cardio' },
                    { name: 'Flexo com Toque no Ombro', sets: '3x12', rest: '45s', muscle: 'Peitoral/Core' },
                    { name: 'Panturrilha em Pé', sets: '4x20', rest: '20s', muscle: 'Panturrilha' },
                ]
            },
            forca: {
                title: `Protocolo Força Bruta — ${levelLabels[workoutLevel]}`,
                description: 'Movimentos compostos com baixa repetição e alta carga.',
                rounds: 5,
                exercises: [
                    { name: 'Levantamento Terra', sets: '5x3-5', rest: '3min', muscle: 'Full Body' },
                    { name: 'Agachamento Livre', sets: '5x3-5', rest: '3min', muscle: 'Pernas' },
                    { name: 'Supino Reto', sets: '5x3-5', rest: '3min', muscle: 'Peitoral' },
                    { name: 'Barra Fixa', sets: '4x5', rest: '2min', muscle: 'Costas' },
                ]
            },
            longevidade: {
                title: `Protocolo Longevidade — ${levelLabels[workoutLevel]}`,
                description: 'Mobilidade, resistência e saúde articular para o longo prazo.',
                rounds: 3,
                exercises: [
                    { name: 'Turkish Get-Up', sets: '3x5 cada lado', rest: '60s', muscle: 'Full Body' },
                    { name: 'Farmers Walk', sets: '4x30m', rest: '60s', muscle: 'Core/Pedaços' },
                    { name: 'Prancha Lateral', sets: '3x45s', rest: '30s', muscle: 'Core' },
                    { name: 'Agachamento Goblet', sets: '3x15', rest: '60s', muscle: 'Pernas' },
                    { name: 'Face Pull', sets: '3x15', rest: '45s', muscle: 'Ombros/Rotadores' },
                ]
            },
            funcional: {
                title: `Protocolo Funcional — ${levelLabels[workoutLevel]}`,
                description: 'Movimentos que replicam padrões da vida real e esportes.',
                rounds: 4,
                exercises: [
                    { name: 'Kettlebell Swing', sets: '4x20', rest: '45s', muscle: 'Posterior/Core' },
                    { name: 'Box Jump', sets: '4x10', rest: '60s', muscle: 'Pernas/Potencia' },
                    { name: 'Remo Invertido', sets: '4x12', rest: '60s', muscle: 'Costas' },
                    { name: 'Prensa de Ombro 1 Braço', sets: '3x10', rest: '60s', muscle: 'Ombros' },
                    { name: 'Sprint 100m', sets: '6 repetições', rest: '2min', muscle: 'Cardio/Potencia' },
                ]
            }
        };

        const plan = workoutPlans[workoutGoal] || workoutPlans['hipertrofia'];
        setGeneratedWorkout(plan);
        setActiveTab('workout-result');

        // Fetch YouTube videos for this workout type
        const ytKey = (() => { try { const k = JSON.parse(localStorage.getItem('acervo_apikeys') || '{}'); return k.google || k.yt2 || k.yt3 || ''; } catch { return ''; } })();
        const ytUserToken = localStorage.getItem('acervo_token');

        const queryMap: Record<string, string> = {
            hipertrofia: 'treino hipertrofia muscular academia',
            emagrecimento: 'treino emagrecimento HIIT emagrecimento rápido',
            forca: 'treino de força powerlifting',
            longevidade: 'treino longevidade mobilidade saúde',
            funcional: 'treino funcional calistenia'
        };
        const query = queryMap[workoutGoal] || 'treino completo';

        try {
            const headers: Record<string, string> = ytKey ? {} : { Authorization: `Bearer ${ytUserToken}` };
            const baseUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=6&relevanceLanguage=pt&order=relevance`;
            const finalUrl = ytKey ? `${baseUrl}&key=${ytKey}` : baseUrl;
            const res = await fetch(finalUrl, { headers });
            const data = await res.json();
            if (data.items) {
                const vids = data.items.map((v: any) => ({
                    id: v.id.videoId, title: v.snippet.title,
                    thumbnail: v.snippet.thumbnails?.high?.url || v.snippet.thumbnails?.medium?.url || '',
                    channel: v.snippet.channelTitle
                }));
                setWorkoutVideos(vids);
            }
        } catch (err) {
            console.warn('Could not fetch YT workout videos:', err);
        }

        setGeneratingWorkout(false);
    };

    const generateNutrition = async () => {
        setGeneratingNutrition(true);
        // Static nutrition plan — no backend needed
        const cals = profile.weight ? Math.round(Number(profile.weight) * 30 + 500) : 2200;
        setTimeout(() => {
            setGeneratedNutrition({
                daily_calories: cals,
                protein_g: Math.round(cals * 0.3 / 4),
                carbs_g: Math.round(cals * 0.4 / 4),
                fat_g: Math.round(cals * 0.3 / 9),
                meals: [
                    { time: '07:00', name: 'Café da manhã', description: `4 ovos mexidos + 2 fatias de tapioca + café preto` },
                    { time: '10:00', name: 'Lanche 1', description: 'Punhado de castanhas + 1 fríta caju' },
                    { time: '13:00', name: 'Almoço', description: `150g frango grelhado + arroz + salada verde + manteiga` },
                    { time: '16:00', name: 'Pré-Treino', description: `Banana + 1 col. de pasta de amendoim + café` },
                    { time: '19:00', name: 'Pós-Treino / Jantar', description: `200g carne vermelha + batata-doce + ovo cozido` },
                    { time: '22:00', name: 'Lanche Final', description: `Queijo cottage + 2 ovos cozidos` },
                ]
            });
            setActiveTab('diet-result');
            setGeneratingNutrition(false);
        }, 800);
    };

    const saveWorkout = () => {
        if (!generatedWorkout) return;
        setSavingWorkout(true);
        // Save to localStorage
        try {
            const saved = JSON.parse(localStorage.getItem('acervo_biodata_workouts') || '[]');
            saved.unshift({ ...generatedWorkout, savedAt: new Date().toISOString(), goal: workoutGoal, level: workoutLevel });
            localStorage.setItem('acervo_biodata_workouts', JSON.stringify(saved.slice(0, 10)));
            setWorkoutSaved(true);
            setTimeout(() => setWorkoutSaved(false), 3000);
        } catch { }
        setSavingWorkout(false);
    };

    const fetchExerciseVideo = async (keyword: string) => {
        try {
            const ytKey = (() => { try { const k = JSON.parse(localStorage.getItem('acervo_apikeys') || '{}'); return k.google || k.yt2 || ''; } catch { return ''; } })();
            const ytUserToken = localStorage.getItem('acervo_token');
            const headers: Record<string, string> = ytKey ? {} : { Authorization: `Bearer ${ytUserToken}` };
            const baseUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(keyword + ' como fazer execução')}&type=video&maxResults=3&relevanceLanguage=pt`;
            const finalUrl = ytKey ? `${baseUrl}&key=${ytKey}` : baseUrl;
            const res = await fetch(finalUrl, { headers });
            const json = await res.json();
            if (json.items?.length > 0) {
                setActiveExerciseVideo({ id: json.items[0].id.videoId, title: json.items[0].snippet.title });
            }
        } catch (err) {
            console.error('Erro video exer:', err);
        }
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            optimal: '#10B981', good: '#3B82F6', normal: '#F59E0B', warning: '#EF4444'
        };
        return colors[status] || '#6B7280';
    };

    const formatTime = (date: Date) => date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    if (loading) {
        return (
            <div className="min-h-screen bg-[#050508] flex items-center justify-center">
                <div className="text-center">
                    <div className="relative w-24 h-24 mx-auto mb-6">
                        <div className="absolute inset-0 border-4 border-emerald-500/20 rounded-full" />
                        <div className="absolute inset-0 border-4 border-transparent border-t-emerald-500 rounded-full animate-spin" />
                        <Heart className="absolute inset-0 m-auto w-8 h-8 text-emerald-500 animate-pulse" />
                    </div>
                    <p className="text-gray-500 font-mono text-sm tracking-[0.3em] uppercase animate-pulse">
                        Inicializando Matrix Biométrica...
                    </p>
                </div>
            </div>
        );
    }

    const vitals = data?.vitals || {};
    const fitness = data?.fitness || {};
    const sleep = data?.sleep || {};
    const body = data?.body || {};
    const wellnessScore = data?.wellnessScore || 0;
    const insights = data?.insights || [];

    return (
        <div className="min-h-screen bg-[#050508] text-white overflow-x-hidden pt-16">
            <PageNav title="Bio-Data" />
            {/* Global Premium Styles */}
            {/* Global Premium Styles */}
            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;700&display=swap');
                
                .font-orbitron { font-family: 'Orbitron', sans-serif; }
                .font-mono-jet { font-family: 'JetBrains Mono', monospace; }
                
                .glass-hud {
                    background: rgba(5, 5, 8, 0.8);
                    backdrop-filter: blur(20px);
                    border-bottom: 1px solid rgba(16, 185, 129, 0.1);
                }
                
                .glass-card {
                    background: rgba(255, 255, 255, 0.02);
                    backdrop-filter: blur(12px);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    border-radius: 1.5rem;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                
                .glass-card:hover {
                    background: rgba(255, 255, 255, 0.04);
                    border-color: rgba(16, 185, 129, 0.3);
                    transform: translateY(-2px);
                    box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.5), 0 0 20px -5px rgba(16, 185, 129, 0.1);
                }
                
                .glow-emerald { filter: drop-shadow(0 0 8px rgba(16, 185, 129, 0.4)); }
                .glow-text { text-shadow: 0 0 15px currentColor; }
                
                .tactical-grid {
                    background-image: 
                        linear-gradient(rgba(16, 185, 129, 0.02) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(16, 185, 129, 0.02) 1px, transparent 1px);
                    background-size: 20px 20px;
                }
                
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                
                .btn-primary {
                    background: linear-gradient(135deg, #10B981 0%, #059669 100%);
                    box-shadow: 0 0 20px -5px rgba(16, 185, 129, 0.4);
                    transition: all 0.3s ease;
                }
                
                .btn-primary:hover {
                    transform: scale(1.02);
                    box-shadow: 0 0 30px -5px rgba(16, 185, 129, 0.6);
                }

                .nav-dock {
                    background: rgba(10, 10, 15, 0.8);
                    backdrop-filter: blur(16px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    box-shadow: 0 -10px 30px rgba(0, 0, 0, 0.5);
                }
            `}</style>

            {/* Ambient Background */}
            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute inset-0 tactical-grid" />
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-emerald-600/5 rounded-full blur-[200px] animate-float" />
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-cyan-600/5 rounded-full blur-[150px]" style={{ animationDelay: '-2s' }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-red-600/3 rounded-full blur-[120px]" />
            </div>

            {/* Main Content */}
            <main className="relative z-10 min-h-screen pb-24 md:pb-0">
                {/* HEADER HUD */}
                <header className="sticky top-0 z-50 glass-hud px-4 md:px-8 py-3 md:py-4">
                    <div className="max-w-7xl mx-auto flex items-center justify-between">
                        <div className="flex items-center gap-3 md:gap-4">
                            <button onClick={() => window.history.back()} className="md:hidden p-2 -ml-2 text-white/40 hover:text-white transition-colors">
                                <ChevronRight className="rotate-180 w-5 h-5" />
                            </button>
                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-900/40">
                                <Activity className="w-5 h-5 md:w-6 md:h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="font-orbitron text-base md:text-xl font-bold tracking-tight">
                                    BIO<span className="text-emerald-400">DATA</span>
                                </h1>
                                <p className="hidden md:block text-[8px] text-gray-500 font-mono-jet tracking-widest uppercase">
                                    v2.0 Tactical HUD
                                </p>
                            </div>
                        </div>

                        {/* Stats - Compact on mobile */}
                        <div className="flex items-center gap-3 md:gap-6">

                            <button
                                onClick={() => setShowManualDataModal(true)}
                                disabled={syncingWearable}
                                className="hidden sm:flex items-center gap-2 glass-card rounded-xl px-4 py-2 hover:bg-emerald-500/20 transition-all border-emerald-500/30 font-orbitron text-xs text-emerald-400 glow-text"
                            >
                                <Zap className={`w-4 h-4 ${syncingWearable ? 'animate-pulse' : ''}`} />
                                {syncingWearable ? 'SALVANDO...' : 'DADOS MANUAIS'}
                            </button>

                            <div className="hidden sm:flex items-center gap-2 glass-card rounded-xl px-3 py-1.5 border-emerald-500/10">
                                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="font-mono-jet text-[10px] tracking-wider">{formatTime(currentTime)}</span>
                            </div>

                            <div className="flex items-center gap-2 md:gap-3 glass-card rounded-2xl px-3 py-1.5 md:px-4 md:py-2 border-emerald-500/20 shadow-emerald-900/20">
                                <div className="text-right">
                                    <p className="hidden md:block text-[8px] text-gray-500 uppercase font-black">Readiness</p>
                                    <p className="font-orbitron text-lg md:text-2xl font-black text-emerald-400 glow-text leading-none">{wellnessScore}%</p>
                                </div>
                                <div className="relative w-8 h-8 md:w-10 md:h-10">
                                    <svg className="w-full h-full -rotate-90">
                                        <circle cx="50%" cy="50%" r="40%" stroke="rgba(16,185,129,0.1)" strokeWidth="3" fill="none" />
                                        <circle cx="50%" cy="50%" r="40%" stroke="#10B981" strokeWidth="3" fill="none"
                                            strokeLinecap="round" strokeDasharray={`${wellnessScore * 1.25} 125`} />
                                    </svg>
                                    <Heart className="absolute inset-0 m-auto w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Navigation - Bottom Dock on Mobile, Top bar on Desktop */}
                <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 md:translate-x-0 md:static md:bottom-auto md:left-auto md:top-20 z-[100] md:z-40 w-[90%] md:w-full max-w-lg md:max-w-7xl mx-auto">
                    <div className="nav-dock md:bg-transparent md:backdrop-blur-0 md:border-0 md:border-b md:border-white/5 md:shadow-none rounded-full md:rounded-none px-4 md:px-0 py-2 md:py-0">
                        <div className="flex justify-between md:justify-start md:gap-1 overflow-x-auto no-scrollbar py-1">
                            {[
                                { id: 'overview', label: 'Overview', icon: BarChart3 },
                                { id: 'workout', label: 'Workout', icon: Dumbbell },
                                { id: 'nutrition', label: 'Diet', icon: Leaf },
                                { id: 'sleep', label: 'Sleep', icon: Moon },
                                { id: 'body', label: 'Metrics', icon: Scale },
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex flex-col md:flex-row items-center gap-1.5 md:gap-2 px-3 md:px-5 py-1.5 md:py-3 rounded-xl transition-all ${activeTab === tab.id || (tab.id === 'workout' && activeTab === 'workout-result') || (tab.id === 'nutrition' && activeTab === 'diet-result')
                                        ? 'text-emerald-400 bg-emerald-500/10 md:border-b-2 md:border-emerald-500 md:rounded-none'
                                        : 'text-gray-500 md:hover:text-white'
                                        }`}
                                >
                                    <tab.icon className="w-4 h-4 md:w-3.5 md:h-3.5" />
                                    <span className="text-[9px] md:text-sm font-bold uppercase md:capitalize tracking-tighter md:tracking-normal">{tab.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </nav>



                {/* Content Area */}
                <div className="max-w-[1800px] mx-auto px-6 py-8">
                    <AnimatePresence mode="wait">

                        {/* ========== OVERVIEW TAB ========== */}
                        {activeTab === 'overview' && (
                            <motion.div
                                key="overview"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="space-y-8"
                            >
                                {/* Top Row: Vitals HUD */}
                                <section>
                                    <h2 className="font-orbitron text-lg font-bold text-white mb-4 flex items-center gap-3">
                                        <div className="w-2 h-6 bg-gradient-to-b from-emerald-400 to-cyan-400 rounded-full" />
                                        MONITORAMENTO VITAL
                                    </h2>
                                    <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 md:gap-4">
                                        {[
                                            { label: 'Freq. Cardíaca', value: vitals.heartRate?.current || 0, unit: 'BPM', icon: Heart, color: '#EF4444', status: vitals.heartRate?.status },
                                            { label: 'HRV', value: vitals.hrv?.current || 0, unit: 'ms', icon: Activity, color: '#8B5CF6', status: vitals.hrv?.status },
                                            { label: 'SpO2', value: vitals.bloodOxygen?.current || 0, unit: '%', icon: Droplets, color: '#3B82F6', status: vitals.bloodOxygen?.status },
                                            { label: 'Respiração', value: vitals.respiratoryRate?.current || 0, unit: '/min', icon: Wind, color: '#06B6D4', status: vitals.respiratoryRate?.status },
                                            { label: 'Temp.', value: vitals.bodyTemp?.current || 0, unit: '°C', icon: ThermometerSun, color: '#F59E0B', status: vitals.bodyTemp?.status },
                                            { label: 'Pressão', value: `${vitals.bloodPressure?.systolic || 0}/${vitals.bloodPressure?.diastolic || 0}`, unit: '', icon: Waves, color: '#10B981', status: vitals.bloodPressure?.status },
                                        ].map((vital, i) => (
                                            <div key={i} className="glass-card p-3 md:p-4 group relative overflow-hidden flex flex-col justify-between h-full">
                                                <div className="flex items-center justify-between mb-2">
                                                    <vital.icon className="w-4 h-4 md:w-5 md:h-5" style={{ color: vital.color }} />
                                                    <div className="w-1.5 h-1.5 rounded-full animate-pulse"
                                                        style={{ backgroundColor: getStatusColor(vital.status), boxShadow: `0 0 8px ${getStatusColor(vital.status)}` }} />
                                                </div>
                                                <div>
                                                    <div className="font-orbitron text-lg md:text-2xl font-bold text-white leading-tight">
                                                        {vital.value}<span className="text-[10px] md:text-sm text-gray-600 ml-1 font-normal">{vital.unit}</span>
                                                    </div>
                                                    <p className="text-[8px] md:text-[10px] text-gray-500 uppercase tracking-widest font-bold">{vital.label}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                {/* Middle Row: Activity + Sleep + Insights */}
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    {/* Activity Card */}
                                    <div className="glass-card rounded-3xl p-6 space-y-6">
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-orbitron text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                                <Flame className="w-4 h-4 text-orange-400" />
                                                Atividade Diária
                                            </h3>
                                            <span className="text-xs text-emerald-400 font-bold">{Math.round((fitness.steps?.today / fitness.steps?.goal) * 100)}%</span>
                                        </div>

                                        <div className="space-y-4">
                                            {/* Steps */}
                                            <div>
                                                <div className="flex justify-between text-xs text-gray-500 mb-2">
                                                    <span className="flex items-center gap-2"><Footprints className="w-3 h-3" /> Passos</span>
                                                    <span className="font-mono-jet">{fitness.steps?.today?.toLocaleString()} / {fitness.steps?.goal?.toLocaleString()}</span>
                                                </div>
                                                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${Math.min(100, (fitness.steps?.today / fitness.steps?.goal) * 100)}%` }}
                                                        transition={{ duration: 1, ease: "easeOut" }}
                                                        className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full"
                                                    />
                                                </div>
                                            </div>

                                            {/* Calories */}
                                            <div>
                                                <div className="flex justify-between text-xs text-gray-500 mb-2">
                                                    <span className="flex items-center gap-2"><Flame className="w-3 h-3" /> Calorias</span>
                                                    <span className="font-mono-jet">{fitness.calories?.burned} kcal</span>
                                                </div>
                                                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${Math.min(100, (fitness.calories?.burned / fitness.calories?.goal) * 100)}%` }}
                                                        transition={{ duration: 1, delay: 0.2 }}
                                                        className="h-full bg-gradient-to-r from-orange-500 to-red-400 rounded-full"
                                                    />
                                                </div>
                                            </div>

                                            {/* Active Minutes */}
                                            <div>
                                                <div className="flex justify-between text-xs text-gray-500 mb-2">
                                                    <span className="flex items-center gap-2"><Timer className="w-3 h-3" /> Minutos Ativos</span>
                                                    <span className="font-mono-jet">{fitness.activeMinutes?.today} / {fitness.activeMinutes?.goal} min</span>
                                                </div>
                                                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${Math.min(100, (fitness.activeMinutes?.today / fitness.activeMinutes?.goal) * 100)}%` }}
                                                        transition={{ duration: 1, delay: 0.4 }}
                                                        className="h-full bg-gradient-to-r from-purple-500 to-pink-400 rounded-full"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Streak & Stats */}
                                        <div className="grid grid-cols-3 gap-3 pt-6 border-t border-white/5">
                                            <div className="text-center group-hover:scale-110 transition-transform">
                                                <p className="font-orbitron text-xl md:text-2xl font-black text-white">{fitness.workouts?.streak}</p>
                                                <p className="text-[8px] md:text-[10px] text-gray-500 uppercase font-bold tracking-tighter">Streak</p>
                                            </div>
                                            <div className="text-center group-hover:scale-110 transition-transform">
                                                <p className="font-orbitron text-xl md:text-2xl font-black text-emerald-400 glow-text">{fitness.vo2max}</p>
                                                <p className="text-[8px] md:text-[10px] text-gray-500 uppercase font-bold tracking-tighter">VO2 Max</p>
                                            </div>
                                            <div className="text-center group-hover:scale-110 transition-transform">
                                                <p className="font-orbitron text-xl md:text-2xl font-black text-cyan-400 glow-text">{fitness.restingHR}</p>
                                                <p className="text-[8px] md:text-[10px] text-gray-500 uppercase font-bold tracking-tighter">RHR</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Sleep Card */}
                                    <div className="glass-card rounded-3xl p-6 space-y-6">
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-orbitron text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                                <Moon className="w-4 h-4 text-indigo-400" />
                                                Análise de Sono
                                            </h3>
                                            <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-bold">
                                                Score: {sleep.lastNight?.score}
                                            </span>
                                        </div>

                                        <div className="text-center py-4">
                                            <p className="font-orbitron text-5xl font-black text-white">{sleep.lastNight?.total}<span className="text-xl text-gray-500">h</span></p>
                                            <p className="text-xs text-gray-500 mt-2">Última Noite</p>
                                        </div>

                                        {/* Sleep Phases */}
                                        <div className="space-y-4">
                                            {[
                                                { label: 'Deep', value: sleep.lastNight?.deep, color: '#6366F1', total: sleep.lastNight?.total },
                                                { label: 'REM', value: sleep.lastNight?.rem, color: '#8B5CF6', total: sleep.lastNight?.total },
                                                { label: 'Light', value: sleep.lastNight?.light, color: '#A78BFA', total: sleep.lastNight?.total },
                                            ].map((phase, i) => (
                                                <div key={i} className="group/phase">
                                                    <div className="flex justify-between text-[10px] md:text-xs mb-1.5 px-0.5">
                                                        <span className="text-gray-500 font-bold uppercase tracking-widest">{phase.label}</span>
                                                        <span className="font-mono-jet text-white font-bold">{phase.value}h</span>
                                                    </div>
                                                    <div className="h-1.5 md:h-2 bg-white/5 rounded-full overflow-hidden">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${(phase.value / phase.total) * 100}%` }}
                                                            transition={{ duration: 1, delay: i * 0.1 }}
                                                            className="h-full rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)]"
                                                            style={{ backgroundColor: phase.color }}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="flex justify-between pt-4 border-t border-white/5 text-xs">
                                            <span className="text-gray-500">Média Semanal</span>
                                            <span className="font-bold text-white">{sleep.weekAvg}h</span>
                                        </div>
                                    </div>

                                    {/* Insights Card */}
                                    <div className="glass-card rounded-3xl p-6 space-y-4">
                                        <h3 className="font-orbitron text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                            <Brain className="w-4 h-4 text-emerald-400" />
                                            Insights IA
                                        </h3>

                                        <div className="space-y-3">
                                            {insights.map((insight: any, i: number) => (
                                                <motion.div
                                                    key={i}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: i * 0.1 }}
                                                    className="flex gap-3 p-3 rounded-xl bg-white/[0.02] border-l-2"
                                                    style={{ borderLeftColor: insight.type === 'success' ? '#10B981' : insight.type === 'warning' ? '#F59E0B' : '#3B82F6' }}
                                                >
                                                    <div className="shrink-0">
                                                        {insight.icon === 'CheckCircle' && <CheckCircle className="w-4 h-4 text-emerald-400" />}
                                                        {insight.icon === 'AlertTriangle' && <AlertTriangle className="w-4 h-4 text-amber-400" />}
                                                        {insight.icon === 'TrendingUp' && <TrendingUp className="w-4 h-4 text-blue-400" />}
                                                        {insight.icon === 'Flame' && <Flame className="w-4 h-4 text-orange-400" />}
                                                    </div>
                                                    <p className="text-sm text-gray-300">{insight.message}</p>
                                                </motion.div>
                                            ))}
                                        </div>

                                        <button
                                            onClick={() => setActiveTab('workout')}
                                            className="w-full py-4 btn-primary rounded-xl text-black font-bold uppercase tracking-wider flex items-center justify-center gap-2"
                                        >
                                            <Dumbbell className="w-4 h-4" />
                                            Gerar Próximo Treino
                                        </button>
                                    </div>
                                </div>

                                {/* Body Composition Quick View */}
                                <section className="glass-card rounded-3xl p-6">
                                    <div className="flex items-center justify-between mb-4 md:mb-6">
                                        <h3 className="font-orbitron text-xs md:text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                                            <Scale className="w-3.5 h-3.5 md:w-4 md:h-4 text-cyan-400" />
                                            Bio-Composition
                                        </h3>
                                        <button onClick={() => setActiveTab('body')} className="text-[10px] md:text-xs text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1 font-bold">
                                            DETAILS <ChevronRight className="w-3 h-3" />
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
                                        {[
                                            { label: 'Weight', value: body.weight?.current, unit: 'kg', goal: body.weight?.goal, trend: body.weight?.trend },
                                            { label: 'Fat', value: body.bodyFat?.current, unit: '%', goal: body.bodyFat?.goal },
                                            { label: 'Muscle', value: body.muscle?.current, unit: 'kg', trend: body.muscle?.trend },
                                            { label: 'Hydration', value: body.hydration?.current, unit: '%', goal: body.hydration?.optimal },
                                            { label: 'BMI', value: body.bmi, unit: '' },
                                        ].map((metric, i) => (
                                            <div key={i} className="flex flex-col justify-center p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors">
                                                <p className="font-orbitron text-xl md:text-3xl font-black text-white leading-none">
                                                    {metric.value}<span className="text-[10px] md:text-xs text-gray-500 ml-1 font-normal uppercase tracking-tighter">{metric.unit}</span>
                                                </p>
                                                <div className="flex items-center justify-between mt-2 md:mt-3">
                                                    <p className="text-[8px] md:text-[10px] text-gray-500 uppercase font-black tracking-widest">{metric.label}</p>
                                                    {metric.trend && (
                                                        <TrendingUp className={`w-3 h-3 ${metric.trend === 'up' ? 'text-emerald-400' : 'text-red-400 rotate-180'} glow-emerald`} />
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            </motion.div>
                        )}

                        {/* ========== WORKOUT TAB ========== */}
                        {activeTab === 'workout' && (
                            <motion.div
                                key="workout"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="max-w-4xl mx-auto"
                            >
                                <div className="text-center mb-10">
                                    <h2 className="font-orbitron text-4xl font-black text-white mb-3">
                                        PROTOCOLO DE <span className="text-emerald-400">TREINO</span>
                                    </h2>
                                    <p className="text-gray-500">Configure os parâmetros para geração inteligente do seu treino tático</p>
                                </div>

                                <div className="glass-card rounded-3xl p-8 space-y-8">
                                    {/* Goal Selection */}
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Objetivo Primário</label>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
                                            {[
                                                { id: 'hipertrofia', label: 'Hypertrophy', icon: '💪', color: 'emerald' },
                                                { id: 'emagrecimento', label: 'Fat Burn', icon: '🔥', color: 'orange' },
                                                { id: 'forca', label: 'Strength', icon: '⚡', color: 'red' },
                                                { id: 'longevidade', label: 'Longevity', icon: '🧬', color: 'cyan' },
                                                { id: 'funcional', label: 'Functional', icon: '🏃', color: 'indigo' },
                                            ].map(goal => (
                                                <button
                                                    key={goal.id}
                                                    onClick={() => setWorkoutGoal(goal.id)}
                                                    className={`relative p-4 md:p-6 rounded-2xl md:rounded-3xl border transition-all duration-300 group overflow-hidden ${workoutGoal === goal.id
                                                        ? `bg-${goal.color}-500/10 border-${goal.color}-500/50 text-${goal.color}-400`
                                                        : 'bg-white/[0.02] border-white/5 text-gray-400 hover:border-white/20'
                                                        }`}
                                                >
                                                    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
                                                    <span className={`text-2xl md:text-3xl mb-2 md:mb-3 block group-hover:scale-110 transition-transform ${workoutGoal === goal.id ? 'animate-pulse' : ''}`}>{goal.icon}</span>
                                                    <span className="text-[10px] md:text-xs font-black uppercase tracking-widest">{goal.label}</span>
                                                    {workoutGoal === goal.id && (
                                                        <div className={`absolute bottom-0 left-0 h-1 w-full bg-${goal.color}-500 glow-${goal.color}`} />
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Duration Selection */}
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Janela de Tempo</label>
                                        <div className="flex gap-3">
                                            {[30, 45, 60, 90].map(min => (
                                                <button
                                                    key={min}
                                                    onClick={() => setWorkoutDuration(min)}
                                                    className={`flex-1 py-4 rounded-xl font-orbitron font-bold text-lg transition-all ${workoutDuration === min
                                                        ? 'bg-white text-black'
                                                        : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                                        }`}
                                                >
                                                    {min}<span className="text-xs ml-1">min</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Level Selection */}
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Nível de Combate</label>
                                        <div className="grid grid-cols-3 gap-3">
                                            {[
                                                { id: 'iniciante', label: 'Recruta', desc: 'Fundamentos' },
                                                { id: 'intermediario', label: 'Soldado', desc: 'Intensidade Moderada' },
                                                { id: 'avancado', label: 'Operador', desc: 'Elite Tactical' },
                                            ].map(level => (
                                                <button
                                                    key={level.id}
                                                    onClick={() => setWorkoutLevel(level.id)}
                                                    className={`p-4 rounded-2xl border text-left transition-all ${workoutLevel === level.id
                                                        ? 'bg-red-500/20 border-red-500/50'
                                                        : 'border-white/10 hover:border-white/30'
                                                        }`}
                                                >
                                                    <span className={`font-bold uppercase text-sm ${workoutLevel === level.id ? 'text-red-400' : 'text-white'}`}>{level.label}</span>
                                                    <p className="text-xs text-gray-500 mt-1">{level.desc}</p>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Equipment Selection */}
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Ambiente / Equipamento</label>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                            {[
                                                { id: 'academia', label: 'Academia Elite', icon: '🏋️' },
                                                { id: 'home', label: 'Home Gym', icon: '🏠' },
                                                { id: 'corpo', label: 'Peso Corporal', icon: '🤸' },
                                                { id: 'halteres', label: 'Halteres', icon: '💪' },
                                            ].map(eq => (
                                                <button
                                                    key={eq.id}
                                                    onClick={() => setWorkoutEquipment(eq.id)}
                                                    className={`p-4 rounded-2xl border text-center transition-all ${workoutEquipment === eq.id
                                                        ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
                                                        : 'border-white/10 text-gray-400 hover:border-white/30'
                                                        }`}
                                                >
                                                    <span className="text-2xl mb-2 block">{eq.icon}</span>
                                                    <span className="text-xs font-bold uppercase">{eq.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Generate Button */}
                                    <button
                                        onClick={generateWorkout}
                                        disabled={generatingWorkout}
                                        className="w-full py-5 btn-primary rounded-2xl text-black font-black uppercase tracking-widest text-lg flex items-center justify-center gap-3 disabled:opacity-50"
                                    >
                                        {generatingWorkout ? (
                                            <>
                                                <div className="w-6 h-6 border-3 border-black/30 border-t-black rounded-full animate-spin" />
                                                Calculando Protocolo...
                                            </>
                                        ) : (
                                            <>
                                                <Zap className="w-5 h-5" fill="currentColor" />
                                                Gerar Protocolo Tático
                                            </>
                                        )}
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* ========== WORKOUT RESULT TAB ========== */}
                        {activeTab === 'workout-result' && generatedWorkout && (
                            <motion.div
                                key="workout-result"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="space-y-8"
                            >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div>
                                        <h2 className="font-orbitron text-3xl font-black text-white uppercase tracking-tight">
                                            {generatedWorkout.title || 'Protocolo Tático'}
                                        </h2>
                                        <p className="text-emerald-400 text-sm font-mono-jet mt-1">STATUS: PROTOCOLO ATIVO</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {workoutSaved && (
                                            <span className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-sm font-bold animate-pulse">
                                                <CheckCircle className="w-4 h-4" /> Salvo!
                                            </span>
                                        )}
                                        <button
                                            onClick={saveWorkout}
                                            disabled={savingWorkout || workoutSaved}
                                            className="px-4 py-2 rounded-xl flex items-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-bold transition-all disabled:opacity-50 text-sm"
                                        >
                                            {savingWorkout ? (
                                                <><div className="w-4 h-4 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" /> Salvando...</>
                                            ) : (
                                                <><Target className="w-4 h-4" /> Salvar no Tracker</>
                                            )}
                                        </button>
                                        <button onClick={() => { setActiveTab('workout'); setWorkoutSaved(false); }} className="btn-tactical px-4 py-2 rounded-xl flex items-center gap-2 text-sm border border-white/10 hover:border-white/20 transition-all">
                                            <Plus className="w-4 h-4" /> Novo Treino
                                        </button>
                                    </div>
                                </div>

                                {generatedWorkout.overview && (
                                    <div className="glass-card rounded-2xl p-6 border-l-4 border-emerald-500">
                                        <p className="text-gray-300 italic">{generatedWorkout.overview}</p>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                                    {/* Warmup */}
                                    <div className="glass-card rounded-2xl p-5">
                                        <h3 className="font-orbitron text-xs font-bold text-amber-400 uppercase mb-4">Aquecimento</h3>
                                        <div className="space-y-3">
                                            {generatedWorkout.warmup?.map((item: any, i: number) => (
                                                <div key={i} className="flex gap-3">
                                                    <div className="w-1 bg-amber-500 rounded-full" />
                                                    <div>
                                                        <p className="text-sm font-bold text-white">{item.exercise}</p>
                                                        <p className="text-xs text-gray-500">{item.duration}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Main Block */}
                                    <div className="lg:col-span-2 space-y-4">
                                        <h3 className="font-orbitron text-sm font-bold text-white uppercase flex items-center gap-2">
                                            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                                            Bloco Principal
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {generatedWorkout.main_block?.map((item: any, i: number) => (
                                                <div key={i} className="glass-card p-4 md:p-5 group hover:border-emerald-500/30">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div>
                                                            <h4 className="font-orbitron text-sm md:text-base font-black text-white uppercase leading-tight tracking-tight">{item.exercise}</h4>
                                                            <div className="flex gap-3 mt-2">
                                                                <span className="text-[10px] md:text-xs font-mono-jet text-emerald-400/80 bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/10 font-bold">{item.sets} SETS</span>
                                                                <span className="text-[10px] md:text-xs font-mono-jet text-cyan-400/80 bg-cyan-500/5 px-2 py-0.5 rounded border border-cyan-500/10 font-bold">{item.reps} REPS</span>
                                                                <span className="text-[10px] md:text-xs font-mono-jet text-orange-400/80 bg-orange-500/5 px-2 py-0.5 rounded border border-orange-500/10 font-bold">{item.rest} REST</span>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => fetchExerciseVideo(item.youtube_keyword || (item.exercise + " como fazer corretamente tutorial"))}
                                                            className="p-2.5 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-lg shadow-red-900/10 group-hover:scale-110"
                                                        >
                                                            <Play className="w-4 h-4" fill="currentColor" />
                                                        </button>
                                                    </div>
                                                    {item.instruction && (
                                                        <div className="bg-white/[0.02] rounded-xl p-3 border border-white/5 group-hover:bg-white/[0.04] transition-colors">
                                                            <p className="text-[10px] md:text-xs text-gray-400 leading-relaxed flex gap-2">
                                                                <ShieldCheck className="w-3 h-3 md:w-3.5 md:h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                                                {item.instruction}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Finisher & Recovery */}
                                    <div className="space-y-4">
                                        {generatedWorkout.finisher && (
                                            <div className="glass-card rounded-2xl p-5 bg-gradient-to-br from-red-900/20 to-transparent border-red-500/20">
                                                <h3 className="font-orbitron text-xs font-bold text-red-400 uppercase mb-3 flex items-center gap-2">
                                                    <Flame className="w-4 h-4" /> Finisher
                                                </h3>
                                                {generatedWorkout.finisher.map((item: any, i: number) => (
                                                    <div key={i}>
                                                        <p className="font-bold text-white">{item.exercise}</p>
                                                        <p className="text-xs text-gray-400 mt-1">{item.instruction}</p>
                                                        <span className="inline-block mt-2 px-3 py-1 bg-red-500/20 text-red-400 text-xs font-bold rounded-full">{item.duration}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {generatedWorkout.recovery && (
                                            <div className="glass-card rounded-2xl p-5">
                                                <h3 className="font-orbitron text-xs font-bold text-cyan-400 uppercase mb-3">Recuperação</h3>
                                                <p className="text-xs text-gray-400">{generatedWorkout.recovery}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* ========== NUTRITION TAB ========== */}
                        {activeTab === 'nutrition' && (
                            <motion.div
                                key="nutrition"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-8"
                            >
                                {/* Hero Banner */}
                                <div className="relative h-80 rounded-3xl overflow-hidden group">
                                    <img
                                        src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=1600"
                                        alt="Wild Food"
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#050508] via-[#050508]/60 to-transparent" />
                                    <div className="absolute bottom-8 left-8 right-8">
                                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/20 border border-red-500/30 mb-4">
                                            <Leaf className="w-4 h-4 text-red-400" />
                                            <span className="text-xs font-bold text-red-400 uppercase tracking-widest">Protocolo Ancestral</span>
                                        </div>
                                        <h2 className="font-orbitron text-5xl font-black text-white uppercase tracking-tight">
                                            Dieta da <span className="text-emerald-400">Selva</span>
                                        </h2>
                                        <p className="text-gray-300 mt-3 max-w-xl">
                                            Zero processados. Zero óleos vegetais. Performance biológica máxima fundamentada na nossa genética ancestral.
                                        </p>
                                    </div>
                                </div>

                                {/* Principles Cards */}
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                                    {[
                                        { icon: Beef, label: 'Animal Protein', desc: 'Meats, eggs, organs', color: '#EF4444' },
                                        { icon: Fish, label: 'Real Omega-3', desc: 'Wild caught fish', color: '#3B82F6' },
                                        { icon: Egg, label: 'Noble Fats', desc: 'Butter, ghee, olive oil', color: '#F59E0B' },
                                        { icon: Salad, label: 'Local Greens', desc: 'Roots and ferments', color: '#10B981' },
                                    ].map((principle, i) => (
                                        <div key={i} className="glass-card rounded-2xl p-4 md:p-5 group hover:scale-[1.02] transition-all">
                                            <principle.icon className="w-6 h-6 md:w-8 md:h-8 mb-3 md:mb-4" style={{ color: principle.color }} />
                                            <h3 className="font-bold text-white uppercase text-[10px] md:text-sm tracking-widest">{principle.label}</h3>
                                            <p className="hidden md:block text-xs text-gray-500 mt-1">{principle.desc}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* Action Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div
                                        onClick={generateNutrition}
                                        className="glass-card rounded-3xl p-8 cursor-pointer group hover:border-emerald-500/30"
                                    >
                                        <Salad className="w-12 h-12 text-emerald-400 mb-6 group-hover:scale-110 transition-transform" />
                                        <h3 className="font-orbitron text-2xl font-bold text-white uppercase mb-2">Protocolo Diário</h3>
                                        <p className="text-gray-500 text-sm mb-6">Gere um plano completo baseado em densidade nutricional máxima</p>
                                        <button
                                            disabled={generatingNutrition}
                                            className="btn-primary px-6 py-3 rounded-xl text-black font-bold uppercase text-sm flex items-center gap-2"
                                        >
                                            {generatingNutrition ? 'Gerando...' : 'Calcular Macros'}
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div className="glass-card rounded-3xl p-8 bg-gradient-to-br from-amber-900/10 to-transparent border-amber-500/10">
                                        <div className="flex gap-4 mb-6">
                                            <Pizza className="w-10 h-10 text-amber-400" />
                                            <IceCream className="w-10 h-10 text-pink-400" />
                                        </div>
                                        <h3 className="font-orbitron text-2xl font-bold text-white uppercase mb-2">Estratégia de Sábado</h3>
                                        <p className="text-gray-500 text-sm mb-6">Como integrar pizza e Häagen-Dazs sem arruinar o metabolismo</p>
                                        <div className="flex flex-wrap gap-2">
                                            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-full border border-emerald-500/30">Controle de Insulina</span>
                                            <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-xs font-bold rounded-full border border-blue-500/30">Refeed Controlado</span>
                                            <span className="px-3 py-1 bg-purple-500/20 text-purple-400 text-xs font-bold rounded-full border border-purple-500/30">Timing Estratégico</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* ========== DIET RESULT TAB ========== */}
                        {activeTab === 'diet-result' && generatedNutrition && (
                            <motion.div
                                key="diet-result"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="space-y-8"
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="font-orbitron text-3xl font-black text-white uppercase">
                                            {generatedNutrition.title || 'Protocolo Alimentar'}
                                        </h2>
                                        <p className="text-emerald-400 text-sm font-mono-jet mt-1">PADRÃO DIETA DA SELVA ATIVO</p>
                                    </div>
                                    <button onClick={() => setActiveTab('nutrition')} className="btn-tactical px-4 py-2 rounded-xl">
                                        Recalcular
                                    </button>
                                </div>

                                {/* Macros Overview */}
                                {generatedNutrition.macros && (
                                    <div className="glass-card p-4 md:p-6 border-emerald-500/10">
                                        <h3 className="font-orbitron text-xs md:text-sm font-black text-white uppercase tracking-widest mb-4 md:mb-6">Daily Macro Targets</h3>
                                        <div className="grid grid-cols-3 gap-3 md:gap-6">
                                            <div className="p-3 md:p-6 bg-red-500/[0.03] rounded-2xl md:rounded-3xl border border-red-500/10 text-center relative overflow-hidden group">
                                                <div className="absolute inset-0 bg-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                <p className="font-orbitron text-xl md:text-5xl font-black text-red-400 glow-text leading-none">{generatedNutrition.macros.proteina}</p>
                                                <p className="text-[8px] md:text-xs text-gray-500 uppercase font-black tracking-widest mt-2 md:mt-3">Protein</p>
                                            </div>
                                            <div className="p-3 md:p-6 bg-amber-500/[0.03] rounded-2xl md:rounded-3xl border border-amber-500/10 text-center relative overflow-hidden group">
                                                <div className="absolute inset-0 bg-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                <p className="font-orbitron text-xl md:text-5xl font-black text-amber-400 glow-text leading-none">{generatedNutrition.macros.carbo}</p>
                                                <p className="text-[8px] md:text-xs text-gray-500 uppercase font-black tracking-widest mt-2 md:mt-3">Carbs</p>
                                            </div>
                                            <div className="p-3 md:p-6 bg-emerald-500/[0.03] rounded-2xl md:rounded-3xl border border-emerald-500/10 text-center relative overflow-hidden group">
                                                <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                <p className="font-orbitron text-xl md:text-5xl font-black text-emerald-400 glow-text leading-none">{generatedNutrition.macros.gordura}</p>
                                                <p className="text-[8px] md:text-xs text-gray-500 uppercase font-black tracking-widest mt-2 md:mt-3">Fats</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Daily Routine */}
                                {generatedNutrition.daily_routine && (
                                    <div className="space-y-4">
                                        <h3 className="font-orbitron text-sm font-bold text-white uppercase">Rotina Diária</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {generatedNutrition.daily_routine.map((meal: any, i: number) => (
                                                <div key={i} className="glass-card p-5 md:p-6 group hover:border-emerald-500/30">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div>
                                                            <h4 className="font-orbitron text-sm md:text-base font-black text-white uppercase tracking-tight leading-tight">{meal.meal}</h4>
                                                            <p className="text-[10px] md:text-xs font-mono-jet text-emerald-400 font-bold mt-1.5 opacity-80 uppercase">{meal.macro}</p>
                                                        </div>
                                                        <Clock className="w-4 h-4 text-gray-600" />
                                                    </div>
                                                    <ul className="space-y-2.5 mb-5">
                                                        {meal.items?.map((item: string, j: number) => (
                                                            <li key={j} className="text-xs md:text-sm text-gray-300 flex items-start gap-2.5">
                                                                <CircleDot className="w-1.5 h-1.5 text-emerald-500 shrink-0 mt-1" />
                                                                {item}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                    {meal.survival_tip && (
                                                        <div className="bg-emerald-500/[0.03] rounded-xl p-3 border border-emerald-500/10 group-hover:bg-emerald-500/5 transition-colors">
                                                            <p className="text-[10px] md:text-xs text-emerald-400 font-medium flex gap-2 leading-relaxed">
                                                                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                                                                {meal.survival_tip}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Cheat Day Strategy */}
                                {generatedNutrition.cheat_day_strategy && (
                                    <div className="glass-card rounded-2xl p-6 bg-gradient-to-br from-amber-900/10 to-transparent border-amber-500/20">
                                        <div className="flex items-center gap-3 mb-4">
                                            <Pizza className="w-6 h-6 text-amber-400" />
                                            <h3 className="font-orbitron text-sm font-bold text-amber-400 uppercase">Estratégia Sábado Livre</h3>
                                        </div>
                                        <p className="text-gray-300">{generatedNutrition.cheat_day_strategy}</p>
                                    </div>
                                )}

                                {/* Probiotic Focus */}
                                {generatedNutrition.probiotic_focus && (
                                    <div className="glass-card rounded-2xl p-6">
                                        <h3 className="font-orbitron text-sm font-bold text-purple-400 uppercase mb-3">Foco Probiótico</h3>
                                        <p className="text-gray-300 text-sm">{generatedNutrition.probiotic_focus}</p>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* ========== SLEEP TAB ========== */}
                        {activeTab === 'sleep' && (
                            <motion.div
                                key="sleep"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="max-w-5xl mx-auto space-y-8"
                            >
                                <div className="text-center mb-10">
                                    <h2 className="font-orbitron text-4xl font-black text-white mb-3">
                                        ANÁLISE DE <span className="text-indigo-400">SONO</span>
                                    </h2>
                                    <p className="text-gray-500">Otimização do ciclo circadiano para performance máxima</p>
                                </div>

                                {/* Last Night Summary */}
                                <div className="glass-card rounded-3xl p-8">
                                    <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-8">
                                        <div>
                                            <p className="text-[10px] md:text-xs text-gray-500 uppercase tracking-widest font-black mb-2 px-1">Restoration Period</p>
                                            <p className="font-orbitron text-5xl md:text-7xl font-black text-white leading-none">{sleep.lastNight?.total}<span className="text-xl md:text-2xl text-gray-600 ml-1">h</span></p>
                                        </div>
                                        <div className="flex flex-col items-center md:items-end">
                                            <p className="text-[10px] md:text-xs text-gray-500 uppercase font-black mb-3 px-1">Sleep Quality</p>
                                            <div className="relative w-24 h-24 md:w-28 md:h-28">
                                                <svg className="w-full h-full -rotate-90">
                                                    <circle cx="50%" cy="50%" r="42%" stroke="rgba(99,102,241,0.1)" strokeWidth="6" fill="none" />
                                                    <circle cx="50%" cy="50%" r="42%" stroke="#6366F1" strokeWidth="6" fill="none"
                                                        strokeLinecap="round" strokeDasharray={`${(sleep.lastNight?.score || 0) * 2.6} 260`} />
                                                </svg>
                                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                    <span className="font-orbitron text-2xl md:text-3xl font-black text-indigo-400 glow-indigo">
                                                        {sleep.lastNight?.score}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Sleep Phases Visualization */}
                                    <div className="space-y-4">
                                        <h3 className="font-bold text-white uppercase text-sm">Fases do Sono</h3>
                                        <div className="h-16 flex rounded-xl overflow-hidden">
                                            <div className="h-full bg-indigo-600 flex items-center justify-center" style={{ width: `${(sleep.lastNight?.deep / sleep.lastNight?.total) * 100}%` }}>
                                                <span className="text-xs font-bold text-white">Profundo</span>
                                            </div>
                                            <div className="h-full bg-violet-500 flex items-center justify-center" style={{ width: `${(sleep.lastNight?.rem / sleep.lastNight?.total) * 100}%` }}>
                                                <span className="text-xs font-bold text-white">REM</span>
                                            </div>
                                            <div className="h-full bg-purple-400 flex items-center justify-center" style={{ width: `${(sleep.lastNight?.light / sleep.lastNight?.total) * 100}%` }}>
                                                <span className="text-xs font-bold text-white">Leve</span>
                                            </div>
                                            <div className="h-full bg-gray-600 flex items-center justify-center" style={{ width: `${(sleep.lastNight?.awake / sleep.lastNight?.total) * 100}%` }}>
                                                <span className="text-xs font-bold text-white">Acordado</span>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-4 gap-4 mt-4">
                                            {[
                                                { label: 'Profundo', value: sleep.lastNight?.deep, color: '#4F46E5' },
                                                { label: 'REM', value: sleep.lastNight?.rem, color: '#8B5CF6' },
                                                { label: 'Leve', value: sleep.lastNight?.light, color: '#A78BFA' },
                                                { label: 'Acordado', value: sleep.lastNight?.awake, color: '#4B5563' },
                                            ].map((phase, i) => (
                                                <div key={i} className="text-center">
                                                    <div className="w-4 h-4 rounded-full mx-auto mb-2" style={{ backgroundColor: phase.color }} />
                                                    <p className="font-orbitron text-xl font-bold text-white">{phase.value}h</p>
                                                    <p className="text-xs text-gray-500">{phase.label}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Sleep Tips */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {[
                                        { icon: Moon, title: 'Quarto Escuro', tip: 'Bloqueie toda luz para produção máxima de melatonina' },
                                        { icon: ThermometerSun, title: '18-20°C', tip: 'Temperatura ideal para sono profundo reparador' },
                                        { icon: Clock, title: 'Consistência', tip: 'Durma e acorde no mesmo horário, até no fim de semana' },
                                    ].map((tip, i) => (
                                        <div key={i} className="glass-card rounded-2xl p-5">
                                            <tip.icon className="w-8 h-8 text-indigo-400 mb-4" />
                                            <h4 className="font-bold text-white uppercase text-sm mb-2">{tip.title}</h4>
                                            <p className="text-xs text-gray-500">{tip.tip}</p>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* ========== BODY TAB ========== */}
                        {activeTab === 'body' && (
                            <motion.div
                                key="body"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="max-w-5xl mx-auto space-y-8"
                            >
                                <div className="text-center mb-10">
                                    <h2 className="font-orbitron text-4xl font-black text-white mb-3">
                                        BODY <span className="text-cyan-400">METRICS</span>
                                    </h2>
                                    <p className="text-gray-500">Acompanhamento de composição e evolução física</p>
                                </div>

                                {/* Main Metrics */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="glass-card rounded-2xl p-6 text-center">
                                        <Scale className="w-8 h-8 text-blue-400 mx-auto mb-4" />
                                        <p className="font-orbitron text-4xl font-black text-white">{body.weight?.current}</p>
                                        <p className="text-xs text-gray-500 uppercase mt-1">Peso (kg)</p>
                                        <p className="text-xs text-emerald-400 mt-2 flex items-center justify-center gap-1">
                                            <Target className="w-3 h-3" /> Meta: {body.weight?.goal}kg
                                        </p>
                                    </div>
                                    <div className="glass-card rounded-2xl p-6 text-center">
                                        <div className="w-8 h-8 mx-auto mb-4 rounded-full bg-gradient-to-br from-orange-400 to-red-500" />
                                        <p className="font-orbitron text-4xl font-black text-white">{body.bodyFat?.current}</p>
                                        <p className="text-xs text-gray-500 uppercase mt-1">Gordura (%)</p>
                                        <p className="text-xs text-emerald-400 mt-2 flex items-center justify-center gap-1">
                                            <Target className="w-3 h-3" /> Meta: {body.bodyFat?.goal}%
                                        </p>
                                    </div>
                                    <div className="glass-card rounded-2xl p-6 text-center">
                                        <Dumbbell className="w-8 h-8 text-emerald-400 mx-auto mb-4" />
                                        <p className="font-orbitron text-4xl font-black text-white">{body.muscle?.current}</p>
                                        <p className="text-xs text-gray-500 uppercase mt-1">Muscle Mass (kg)</p>
                                        <div className="flex justify-center mt-2">
                                            <TrendingUp className={`w-4 h-4 ${body.muscle?.trend === 'up' ? 'text-emerald-400' : 'text-red-400 rotate-180'}`} />
                                        </div>
                                    </div>
                                    <div className="glass-card rounded-2xl p-6 text-center">
                                        <Droplets className="w-8 h-8 text-cyan-400 mx-auto mb-4" />
                                        <p className="font-orbitron text-4xl font-black text-white">{body.hydration?.current}</p>
                                        <p className="text-xs text-gray-500 uppercase mt-1">Hidratação (%)</p>
                                        <p className="text-xs text-amber-400 mt-2 flex items-center justify-center gap-1">
                                            <AlertTriangle className="w-3 h-3" /> Ideal: {body.hydration?.optimal}%
                                        </p>
                                    </div>
                                </div>

                                {/* BMI Card */}
                                <div className="glass-card p-6 md:p-8">
                                    <h3 className="font-orbitron text-xs md:text-sm font-black text-white uppercase tracking-widest mb-6 px-1">Body Mass Index Matrix</h3>
                                    <div className="relative h-10 md:h-12 bg-white/5 rounded-2xl overflow-hidden border border-white/5 p-1 mb-6">
                                        <div className="absolute inset-1 rounded-xl bg-gradient-to-r from-blue-500/40 via-emerald-500/40 via-yellow-500/40 to-red-500/40 flex justify-between px-6 items-center text-[8px] md:text-[10px] text-white font-black uppercase tracking-widest leading-none">
                                            <span>Under</span><span>Normal</span><span>Over</span><span>Obese</span>
                                        </div>
                                        <motion.div
                                            initial={{ left: 0 }}
                                            animate={{ left: `${Math.min(98, Math.max(2, (body.bmi - 15) / 25 * 100))}%` }}
                                            transition={{ duration: 1, type: "spring" }}
                                            className="absolute top-0 h-full w-1 md:w-1.5 bg-white shadow-[0_0_15px_white] z-10"
                                        />
                                    </div>
                                    <div className="flex items-end justify-center gap-3">
                                        <span className="font-orbitron text-5xl md:text-6xl font-black text-white leading-none">{body.bmi}</span>
                                        <span className="text-emerald-400 text-sm md:text-lg font-black uppercase tracking-widest leading-none mb-1 md:mb-2">Optimal Range</span>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </main>

            {/* Manual Data Entry Modal — EXPANDED */}
            <AnimatePresence>
                {showManualDataModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="w-full max-w-lg glass-card p-6 border-emerald-500/30 relative max-h-[90vh] overflow-y-auto no-scrollbar"
                        >
                            <button
                                onClick={() => setShowManualDataModal(false)}
                                className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-red-500/20 text-white hover:text-red-500 rounded-full transition-all z-10"
                            >
                                <X className="w-4 h-4" />
                            </button>

                            <h2 className="font-orbitron font-bold text-lg text-emerald-400 mb-4 flex items-center gap-2">
                                <Zap className="w-5 h-5" /> INSERÇÃO BIOMÉTRICA
                            </h2>

                            {/* Category Tabs */}
                            <div className="flex gap-1 mb-6 bg-white/5 rounded-xl p-1">
                                {[
                                    { id: 'activity' as const, label: '🔥 Atividade', icon: Flame },
                                    { id: 'sleep' as const, label: '😴 Sono', icon: Moon },
                                    { id: 'vitals' as const, label: '❤️ Vitais', icon: Heart },
                                    { id: 'body' as const, label: '⚖️ Corpo', icon: Scale },
                                ].map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setManualDataTab(tab.id)}
                                        className={`flex-1 py-2 px-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${manualDataTab === tab.id
                                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                            : 'text-gray-500 hover:text-white'
                                            }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            <div className="space-y-4">
                                {/* ACTIVITY TAB */}
                                {manualDataTab === 'activity' && (
                                    <>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-[10px] text-gray-400 font-mono-jet mb-1 block uppercase tracking-widest">Passos</label>
                                                <input type="number" value={manualData.steps} onChange={e => setManualData({ ...manualData, steps: Number(e.target.value) })}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white font-mono focus:outline-none focus:border-emerald-500/50" />
                                            </div>
                                            <div>
                                                <label className="text-[10px] text-gray-400 font-mono-jet mb-1 block uppercase tracking-widest">Calorias (kcal)</label>
                                                <input type="number" value={manualData.calories} onChange={e => setManualData({ ...manualData, calories: Number(e.target.value) })}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white font-mono focus:outline-none focus:border-emerald-500/50" />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-[10px] text-gray-400 font-mono-jet mb-1 block uppercase tracking-widest">Min. Ativos</label>
                                                <input type="number" value={manualData.active_minutes} onChange={e => setManualData({ ...manualData, active_minutes: Number(e.target.value) })}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white font-mono focus:outline-none focus:border-emerald-500/50" />
                                            </div>
                                            <div>
                                                <label className="text-[10px] text-gray-400 font-mono-jet mb-1 block uppercase tracking-widest">Copos de Água</label>
                                                <input type="number" value={manualData.water_glasses} onChange={e => setManualData({ ...manualData, water_glasses: Number(e.target.value) })}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white font-mono focus:outline-none focus:border-emerald-500/50" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-gray-400 font-mono-jet mb-2 block uppercase tracking-widest">Nível de Energia (1-10)</label>
                                            <div className="flex gap-1">
                                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                                                    <button key={n} onClick={() => setManualData({ ...manualData, energy_level: n })}
                                                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${manualData.energy_level >= n
                                                            ? n <= 3 ? 'bg-red-500/30 text-red-400' : n <= 6 ? 'bg-amber-500/30 text-amber-400' : 'bg-emerald-500/30 text-emerald-400'
                                                            : 'bg-white/5 text-gray-600'
                                                            }`}>{n}</button>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-gray-400 font-mono-jet mb-2 block uppercase tracking-widest">Humor</label>
                                            <div className="flex gap-2">
                                                {[
                                                    { id: 'great', emoji: '🔥', label: 'Excelente' },
                                                    { id: 'good', emoji: '😊', label: 'Bem' },
                                                    { id: 'neutral', emoji: '😐', label: 'Neutro' },
                                                    { id: 'tired', emoji: '😴', label: 'Cansado' },
                                                    { id: 'bad', emoji: '😓', label: 'Ruim' },
                                                ].map(m => (
                                                    <button key={m.id} onClick={() => setManualData({ ...manualData, mood: m.id })}
                                                        className={`flex-1 flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${manualData.mood === m.id ? 'bg-emerald-500/20 border border-emerald-500/40' : 'bg-white/5 border border-transparent'
                                                            }`}>
                                                        <span className="text-lg">{m.emoji}</span>
                                                        <span className="text-[8px] text-gray-500 uppercase font-bold">{m.label}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* SLEEP TAB */}
                                {manualDataTab === 'sleep' && (
                                    <>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-[10px] text-gray-400 font-mono-jet mb-1 block uppercase tracking-widest">Horas Totais</label>
                                                <input type="number" step="0.5" value={manualData.sleep_hours} onChange={e => setManualData({ ...manualData, sleep_hours: Number(e.target.value) })}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white font-mono focus:outline-none focus:border-indigo-500/50" />
                                            </div>
                                            <div>
                                                <label className="text-[10px] text-gray-400 font-mono-jet mb-1 block uppercase tracking-widest">Qualidade (0-100)</label>
                                                <input type="number" min="0" max="100" value={manualData.sleep_quality} onChange={e => setManualData({ ...manualData, sleep_quality: Number(e.target.value) })}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white font-mono focus:outline-none focus:border-indigo-500/50" />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-[10px] text-gray-400 font-mono-jet mb-1 block uppercase tracking-widest">Sono Profundo (h)</label>
                                                <input type="number" step="0.1" value={manualData.sleep_deep} onChange={e => setManualData({ ...manualData, sleep_deep: Number(e.target.value) })}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white font-mono focus:outline-none focus:border-indigo-500/50" />
                                            </div>
                                            <div>
                                                <label className="text-[10px] text-gray-400 font-mono-jet mb-1 block uppercase tracking-widest">Sono REM (h)</label>
                                                <input type="number" step="0.1" value={manualData.sleep_rem} onChange={e => setManualData({ ...manualData, sleep_rem: Number(e.target.value) })}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white font-mono focus:outline-none focus:border-indigo-500/50" />
                                            </div>
                                        </div>
                                        <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                                            <p className="text-xs text-indigo-300"><Bed className="w-3 h-3 inline mr-1" />Sono leve é calculado automaticamente: {Math.max(0, manualData.sleep_hours - manualData.sleep_deep - manualData.sleep_rem).toFixed(1)}h</p>
                                        </div>
                                    </>
                                )}

                                {/* VITALS TAB */}
                                {manualDataTab === 'vitals' && (
                                    <>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-[10px] text-gray-400 font-mono-jet mb-1 block uppercase tracking-widest">Freq. Cardíaca (BPM)</label>
                                                <input type="number" value={manualData.heart_rate} onChange={e => setManualData({ ...manualData, heart_rate: Number(e.target.value) })}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white font-mono focus:outline-none focus:border-red-500/50" />
                                            </div>
                                            <div>
                                                <label className="text-[10px] text-gray-400 font-mono-jet mb-1 block uppercase tracking-widest">HRV (ms)</label>
                                                <input type="number" value={manualData.hrv} onChange={e => setManualData({ ...manualData, hrv: Number(e.target.value) })}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white font-mono focus:outline-none focus:border-purple-500/50" />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-[10px] text-gray-400 font-mono-jet mb-1 block uppercase tracking-widest">PA Sistólica</label>
                                                <input type="number" value={manualData.blood_pressure_sys} onChange={e => setManualData({ ...manualData, blood_pressure_sys: Number(e.target.value) })}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white font-mono focus:outline-none focus:border-emerald-500/50" />
                                            </div>
                                            <div>
                                                <label className="text-[10px] text-gray-400 font-mono-jet mb-1 block uppercase tracking-widest">PA Diastólica</label>
                                                <input type="number" value={manualData.blood_pressure_dia} onChange={e => setManualData({ ...manualData, blood_pressure_dia: Number(e.target.value) })}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white font-mono focus:outline-none focus:border-emerald-500/50" />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-3">
                                            <div>
                                                <label className="text-[10px] text-gray-400 font-mono-jet mb-1 block uppercase tracking-widest">SpO2 (%)</label>
                                                <input type="number" value={manualData.blood_oxygen} onChange={e => setManualData({ ...manualData, blood_oxygen: Number(e.target.value) })}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white font-mono focus:outline-none focus:border-blue-500/50" />
                                            </div>
                                            <div>
                                                <label className="text-[10px] text-gray-400 font-mono-jet mb-1 block uppercase tracking-widest">Temp (°C)</label>
                                                <input type="number" step="0.1" value={manualData.body_temp} onChange={e => setManualData({ ...manualData, body_temp: Number(e.target.value) })}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white font-mono focus:outline-none focus:border-amber-500/50" />
                                            </div>
                                            <div>
                                                <label className="text-[10px] text-gray-400 font-mono-jet mb-1 block uppercase tracking-widest">Resp/min</label>
                                                <input type="number" value={manualData.respiratory_rate} onChange={e => setManualData({ ...manualData, respiratory_rate: Number(e.target.value) })}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white font-mono focus:outline-none focus:border-cyan-500/50" />
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* BODY TAB */}
                                {manualDataTab === 'body' && (
                                    <>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-[10px] text-gray-400 font-mono-jet mb-1 block uppercase tracking-widest">Peso (kg)</label>
                                                <input type="number" step="0.1" value={manualData.weight} onChange={e => setManualData({ ...manualData, weight: Number(e.target.value) })}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white font-mono focus:outline-none focus:border-cyan-500/50" />
                                            </div>
                                            <div>
                                                <label className="text-[10px] text-gray-400 font-mono-jet mb-1 block uppercase tracking-widest">Gordura (%)</label>
                                                <input type="number" step="0.1" value={manualData.body_fat} onChange={e => setManualData({ ...manualData, body_fat: Number(e.target.value) })}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white font-mono focus:outline-none focus:border-orange-500/50" />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-[10px] text-gray-400 font-mono-jet mb-1 block uppercase tracking-widest">Massa Muscular (kg)</label>
                                                <input type="number" step="0.1" value={manualData.muscle_mass} onChange={e => setManualData({ ...manualData, muscle_mass: Number(e.target.value) })}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white font-mono focus:outline-none focus:border-emerald-500/50" />
                                            </div>
                                            <div>
                                                <label className="text-[10px] text-gray-400 font-mono-jet mb-1 block uppercase tracking-widest">Hidratação (%)</label>
                                                <input type="number" value={manualData.hydration} onChange={e => setManualData({ ...manualData, hydration: Number(e.target.value) })}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white font-mono focus:outline-none focus:border-cyan-500/50" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-gray-400 font-mono-jet mb-1 block uppercase tracking-widest">Notas / Observações</label>
                                            <textarea value={manualData.notes} onChange={e => setManualData({ ...manualData, notes: e.target.value })}
                                                placeholder="Anotações sobre o dia, sintomas, suplementos..."
                                                rows={3}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-emerald-500/50 resize-none" />
                                        </div>
                                    </>
                                )}

                                <button onClick={saveManualData} disabled={syncingWearable}
                                    className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black font-orbitron font-bold rounded-xl mt-4 transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2">
                                    {syncingWearable ? (
                                        <><div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> SALVANDO...</>
                                    ) : (
                                        <><ShieldCheck className="w-4 h-4" /> REGISTRAR DADOS BIOMÉTRICOS</>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Video Modal Player */}
            <AnimatePresence>
                {activeExerciseVideo && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-6"
                        onClick={() => setActiveExerciseVideo(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="w-full max-w-4xl"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-orbitron text-lg font-bold text-white truncate">{activeExerciseVideo.title}</h3>
                                <button onClick={() => setActiveExerciseVideo(null)} className="p-2 hover:bg-white/10 rounded-full transition">
                                    <X className="w-6 h-6 text-white" />
                                </button>
                            </div>
                            <div className="aspect-video bg-black rounded-2xl overflow-hidden">
                                <iframe
                                    src={`https://www.youtube.com/embed/${activeExerciseVideo.id}?autoplay=1`}
                                    className="w-full h-full"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                />
                            </div>
                            <div className="flex items-center justify-between mt-4">
                                <span className="text-gray-500 text-sm">Duração: {activeExerciseVideo.duration}</span>
                                <a
                                    href={activeExerciseVideo.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-red-400 hover:text-red-300 text-sm"
                                >
                                    Abrir no YouTube <ExternalLink className="w-4 h-4" />
                                </a>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
