'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Unlock, AlertCircle, RefreshCw, Key, X } from 'lucide-react';

interface PinModalProps {
    isOpen: boolean;
    onSuccess: () => void;
    onClose?: () => void;
    title?: string;
    description?: string;
    isDefaultPin?: boolean;
    initialMode?: 'VERIFY' | 'CHANGE_OLD' | 'CHANGE_NEW';
}

export const PinModal = ({
    isOpen,
    onSuccess,
    onClose,
    title = "Acesso Restrito",
    description = "Digite o código de segurança.",
    isDefaultPin = false,
    initialMode = 'VERIFY'
}: PinModalProps) => {
    const [pin, setPin] = useState(['', '', '', '']);
    const [mode, setMode] = useState<'VERIFY' | 'CHANGE_OLD' | 'CHANGE_NEW'>(initialMode);
    const [newPin, setNewPin] = useState('');
    const [error, setError] = useState(false);
    const [success, setSuccess] = useState(false);
    const [message, setMessage] = useState('');
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        if (isOpen && inputRefs.current[0]) {
            inputRefs.current[0].focus();
        }
        if (!isOpen) {
            resetState();
        }
    }, [isOpen]);

    const resetState = () => {
        setPin(['', '', '', '']);
        setMode(initialMode);
        setError(false);
        setSuccess(false);
        setMessage('');
        setNewPin('');
    };

    const handleClose = () => {
        resetState();
        if (onClose) onClose();
    };

    const handleChange = (index: number, value: string) => {
        if (isNaN(Number(value))) return;

        const newPinArr = [...pin];
        newPinArr[index] = value;
        setPin(newPinArr);
        setError(false);

        // Auto-advance
        if (value !== '' && index < 3) {
            inputRefs.current[index + 1]?.focus();
        }

        // Check PIN when full
        if (index === 3 && value !== '') {
            const fullPin = newPinArr.join('');
            handlePinSubmit(fullPin);
        }
        // Also check if we filled a previous slot and this was the last one (edge case paste)
        else if (newPinArr.every(d => d !== '')) {
            handlePinSubmit(newPinArr.join(''));
        }
    };

    const handlePinSubmit = async (inputPin: string) => {
        // Prevent double submit
        if (success) return;

        if (mode === 'VERIFY') {
            await verifyPin(inputPin);
        } else if (mode === 'CHANGE_OLD') {
            await verifyOldPinForChange(inputPin);
        } else if (mode === 'CHANGE_NEW') {
            await changePin(inputPin);
        }
    };

    const verifyPin = async (inputPin: string) => {
        try {
            const token = localStorage.getItem('bunker_token');
            const res = await fetch('/api/security/verify-pin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ pin: inputPin })
            });
            const data = await res.json();

            if (data.valid) {
                handleSuccess();
            } else {
                handleError('Código Incorreto');
            }
        } catch (e) {
            handleError('Erro de conexão');
        }
    };

    const verifyOldPinForChange = async (inputPin: string) => {
        try {
            const token = localStorage.getItem('bunker_token');
            const res = await fetch('/api/security/verify-pin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ pin: inputPin })
            });
            const data = await res.json();

            if (data.valid) {
                // Old pin correct, ask for new pin
                setNewPin(inputPin); // Store old temporarily (actually not needed if backend handles check, but API requires it)
                setMode('CHANGE_NEW');
                setPin(['', '', '', '']);
                setMessage('Digite o NOVO PIN de 4 dígitos');
                setTimeout(() => inputRefs.current[0]?.focus(), 100);
            } else {
                handleError('PIN atual incorreto');
            }
        } catch (e) {
            handleError('Erro de conexão');
        }
    };

    const changePin = async (inputNewPin: string) => {
        // Need the old pin to authorize change. 
        // In this flow: 
        // 1. User enters OLD PIN (CHANGE_OLD) -> stored in `newPin` state variable (hacky naming but temporary)
        // 2. User enters NEW PIN (CHANGE_NEW) -> `inputNewPin`

        try {
            const token = localStorage.getItem('bunker_token');
            const res = await fetch('/api/security/change-pin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    current_pin: newPin, // This holds the OLD pin from previous step
                    new_pin: inputNewPin
                })
            });

            if (res.ok) {
                setSuccess(true);
                setMode('VERIFY'); // Reset for future
                setMessage('PIN alterado com sucesso!');
                setTimeout(() => {
                    onSuccess(); // Or close modal?
                }, 1000);
                setTimeout(() => window.location.reload(), 1500); // Reload to update context/hint
            } else {
                const data = await res.json();
                handleError(data.detail || 'Erro ao alterar PIN');
                setMode('CHANGE_OLD'); // Restart flow?
                setPin(['', '', '', '']);
                setMessage('Tente novamente: Digite o PIN ATUAL');
            }
        } catch (e) {
            handleError('Erro de conexão');
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace') {
            if (pin[index] === '' && index > 0) {
                inputRefs.current[index - 1]?.focus();
                const newPinArr = [...pin];
                newPinArr[index - 1] = '';
                setPin(newPinArr);
            } else {
                const newPinArr = [...pin];
                newPinArr[index] = '';
                setPin(newPinArr);
            }
        }
    };

    const handleSuccess = () => {
        setSuccess(true);
        setTimeout(() => {
            onSuccess();
        }, 800);
    };

    const handleError = (msg: string) => {
        setError(true);
        setMessage(msg);
        setTimeout(() => {
            setPin(['', '', '', '']);
            setError(false);
            setMessage('');
            inputRefs.current[0]?.focus();
        }, 1500);
    };

    const startChangePin = () => {
        setMode('CHANGE_OLD');
        setMessage('Digite o PIN ATUAL para continuar');
        setPin(['', '', '', '']);
        inputRefs.current[0]?.focus();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl"
            >
                <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    className="w-full max-w-sm bg-[#12121a] border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative"
                >
                    {/* Background Effects */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-50" />
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                    {onClose && (
                        <button
                            onClick={handleClose}
                            className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>
                    )}

                    <div className="p-8 flex flex-col items-center text-center">
                        <div className={`
                            w-16 h-16 mb-6 rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg transition-all duration-500
                            ${success ? 'bg-emerald-500 shadow-emerald-500/30' : error ? 'bg-red-500 shadow-red-500/30' : 'bg-[#1a1a24] shadow-black/50'}
                        `}>
                            {success ? <Unlock /> : error ? <AlertCircle /> : mode === 'VERIFY' ? <Lock /> : <Key />}
                        </div>

                        <h3 className="text-xl font-black text-white uppercase tracking-wide mb-2">
                            {mode === 'VERIFY' ? title : 'Alterar PIN'}
                        </h3>
                        <p className="text-xs text-gray-500 mb-8 max-w-[200px]">
                            {message || (mode === 'VERIFY' ? description : 'Siga as instruções para definir novo código.')}
                        </p>

                        <div className="flex gap-4 mb-4">
                            {pin.map((digit, idx) => (
                                <input
                                    key={idx}
                                    ref={el => { inputRefs.current[idx] = el; }}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={digit}
                                    disabled={success}
                                    onChange={(e) => handleChange(idx, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(idx, e)}
                                    className={`
                                        w-12 h-14 bg-[#08080c] border rounded-xl text-center text-2xl text-white font-mono focus:outline-none transition-all duration-300
                                        ${success
                                            ? 'border-emerald-500 text-emerald-400'
                                            : error
                                                ? 'border-red-500 text-red-400'
                                                : 'border-white/10 focus:border-purple-500 focus:shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                                        }
                                    `}
                                />
                            ))}
                        </div>

                        {/* HINT LOGIC */}
                        {isDefaultPin && mode === 'VERIFY' && !error && !success && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="mb-4 px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-full"
                            >
                                <p className="text-[10px] font-bold text-yellow-500 uppercase tracking-widest">
                                    Dica: 0000
                                </p>
                            </motion.div>
                        )}

                        {/* Status Message */}
                        <div className="h-6 mb-6">
                            {error && (
                                <motion.p
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-xs font-bold text-red-500 uppercase tracking-widest"
                                >
                                    {message || 'Código Incorreto'}
                                </motion.p>
                            )}
                            {success && (
                                <motion.p
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-xs font-bold text-emerald-500 uppercase tracking-widest"
                                >
                                    Sucesso
                                </motion.p>
                            )}
                        </div>

                        {/* CHANGE PIN BUTTON */}
                        {mode === 'VERIFY' && !success && (
                            <button
                                onClick={startChangePin}
                                className="flex items-center gap-2 text-[10px] text-gray-500 hover:text-white transition-colors uppercase tracking-widest font-bold"
                            >
                                <RefreshCw size={12} />
                                Alterar Código
                            </button>
                        )}

                        {mode !== 'VERIFY' && (
                            <button
                                onClick={onClose || resetState}
                                className="mt-2 text-[10px] text-gray-500 hover:text-red-400 transition-colors uppercase tracking-widest font-bold"
                            >
                                {onClose ? 'Fechar' : 'Cancelar'}
                            </button>
                        )}

                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};
