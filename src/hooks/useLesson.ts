/**
 * Hook to fetch structured lesson data from backend
 */

import { useState, useEffect } from 'react';
import type { LessonData } from '@/components/study/LessonComponents';

interface UseLessonResult {
    data: LessonData | null;
    loading: boolean;
    error: string | null;
    refetch: () => void;
}

export function useLesson(path: string): UseLessonResult {
    const [data, setData] = useState<LessonData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchLesson = async () => {
        if (!path) return;

        setLoading(true);
        setError(null);

        try {
            const response = await fetch('http://localhost:8001/api/lesson/extract', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ path }),
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const lessonData = await response.json();
            setData(lessonData);
        } catch (err: any) {
            console.error('Lesson fetch error:', err);
            setError(err.message || 'Failed to load lesson');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLesson();
    }, [path]);

    return {
        data,
        loading,
        error,
        refetch: fetchLesson,
    };
}
