'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Pencil, Square, ArrowRight, Type, Eraser, MousePointer2 } from 'lucide-react';

interface Annotation {
    id: string;
    type: 'rect' | 'arrow' | 'text';
    x: number;
    y: number;
    w?: number;
    h?: number;
    ex?: number; // end x for arrow
    ey?: number; // end y for arrow
    text?: string;
    color: string;
}

interface Props {
    width: number;
    height: number;
    active: boolean;
}

export default function AnnotationLayer({ width, height, active }: Props) {
    const [annotations, setAnnotations] = useState<Annotation[]>([]);
    const [tool, setTool] = useState<'rect' | 'arrow' | 'text' | 'eraser' | 'select'>('select');
    const [color, setColor] = useState('#ec4899'); // Pink default
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentShape, setCurrentShape] = useState<Partial<Annotation> | null>(null);
    const svgRef = useRef<SVGSVGElement>(null);

    // Tools UI
    const tools = [
        { id: 'select', icon: MousePointer2 },
        { id: 'rect', icon: Square },
        { id: 'arrow', icon: ArrowRight },
        // { id: 'text', icon: Type }, // Complex interactions, keeping simple for now
        { id: 'eraser', icon: Eraser },
    ];

    const getMousePos = (e: React.MouseEvent) => {
        if (!svgRef.current) return { x: 0, y: 0 };
        const rect = svgRef.current.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (tool === 'select' || !active) return;
        const { x, y } = getMousePos(e);
        setIsDrawing(true);
        setCurrentShape({
            id: Date.now().toString(),
            type: tool as any,
            x, y, w: 0, h: 0, ex: x, ey: y, color
        });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDrawing || !currentShape) return;
        const { x, y } = getMousePos(e);

        if (tool === 'rect') {
            setCurrentShape(prev => ({
                ...prev,
                w: x - (prev?.x || 0),
                h: y - (prev?.y || 0)
            }));
        } else if (tool === 'arrow') {
            setCurrentShape(prev => ({
                ...prev,
                ex: x,
                ey: y
            }));
        }
    };

    const handleMouseUp = () => {
        if (isDrawing && currentShape) {
            setAnnotations(prev => [...prev, currentShape as Annotation]);
            setIsDrawing(false);
            setCurrentShape(null);
            // Switch back to select after drawing? Optional.
        }
    };

    const handleClick = (e: React.MouseEvent, id: string) => {
        if (tool === 'eraser') {
            e.stopPropagation();
            setAnnotations(prev => prev.filter(a => a.id !== id));
        }
    };

    if (!active) return null;

    return (
        <div className="absolute inset-0 z-20 pointer-events-none">
            {/* Toolbar */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-auto bg-white dark:bg-[#1a1a24] shadow-lg rounded-full px-4 py-2 flex gap-4 border border-gray-200 dark:border-white/10 animate-in fade-in slide-in-from-top-4">
                {tools.map(t => (
                    <button
                        key={t.id}
                        onClick={() => setTool(t.id as any)}
                        className={`p-2 rounded-full transition-all ${tool === t.id
                                ? 'bg-pink-500 text-white shadow-md shadow-pink-500/30'
                                : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'
                            }`}
                    >
                        <t.icon size={18} />
                    </button>
                ))}
                <div className="w-px h-6 bg-gray-200 dark:bg-white/10 self-center" />
                <div className="flex items-center gap-2">
                    {['#ec4899', '#ef4444', '#3b82f6', '#10b981'].map(c => (
                        <button
                            key={c}
                            onClick={() => setColor(c)}
                            className={`w-4 h-4 rounded-full border border-white/20 transition-transform hover:scale-125 ${color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-black' : ''}`}
                            style={{ backgroundColor: c }}
                        />
                    ))}
                </div>
            </div>

            {/* Canvas */}
            <svg
                ref={svgRef}
                className={`w-full h-full pointer-events-auto ${tool !== 'select' ? 'cursor-crosshair' : 'cursor-default'}`}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
            >
                {/* Render Existing */}
                {annotations.map(a => (
                    <g key={a.id} onClick={(e) => handleClick(e, a.id)} className="hover:opacity-80 cursor-pointer">
                        {a.type === 'rect' && (
                            <rect
                                x={a.w! < 0 ? a.x + a.w! : a.x}
                                y={a.h! < 0 ? a.y + a.h! : a.y}
                                width={Math.abs(a.w!)}
                                height={Math.abs(a.h!)}
                                fill={a.color}
                                fillOpacity="0.2"
                                stroke={a.color}
                                strokeWidth="2"
                            />
                        )}
                        {a.type === 'arrow' && (
                            <line
                                x1={a.x} y1={a.y} x2={a.ex} y2={a.ey}
                                stroke={a.color} strokeWidth="3" markerEnd={`url(#arrowhead-${a.id})`}
                            />
                        )}
                        {/* Define marker per arrow to match color */}
                        <defs>
                            <marker id={`arrowhead-${a.id}`} markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                                <polygon points="0 0, 10 3.5, 0 7" fill={a.color} />
                            </marker>
                        </defs>
                    </g>
                ))}

                {/* Render Current Drawing */}
                {isDrawing && currentShape && (
                    <g>
                        {currentShape.type === 'rect' && (
                            <rect
                                x={currentShape.w! < 0 ? currentShape.x! + currentShape.w! : currentShape.x}
                                y={currentShape.h! < 0 ? currentShape.y! + currentShape.h! : currentShape.y}
                                width={Math.abs(currentShape.w!)}
                                height={Math.abs(currentShape.h!)}
                                fill={color} fillOpacity="0.2" stroke={color} strokeWidth="2" strokeDasharray="5,5"
                            />
                        )}
                        {currentShape.type === 'arrow' && (
                            <line
                                x1={currentShape.x} y1={currentShape.y} x2={currentShape.ex} y2={currentShape.ey}
                                stroke={color} strokeWidth="3"
                            />
                        )}
                    </g>
                )}
            </svg>
        </div>
    );
}
