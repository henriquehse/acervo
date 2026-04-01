export type ContentSource = 'bunker' | 'telegram' | 'youtube' | 'youtube_music';

export interface Book {
    id: string;
    title: string;
    author: string;
    cover: string;
    rating: number;
    category: string;
    description?: string;
    format: 'epub' | 'pdf' | 'mobi';
    pages: number;
    progress: number;
    tags: string[];
    isBestSeller?: boolean;
    source?: ContentSource;
    file_name?: string;
    file_path?: string;
}

export interface Audiobook {
    id: string;
    title: string;
    author: string;
    cover: string;
    narrator: string;
    duration: string;
    category: string;
    progress: number;
    platform: 'audible' | 'spotify' | 'local' | 'youtube_music' | 'telegram';
    source?: ContentSource;
    file_name?: string;
    file_path?: string;
}

export interface Course {
    id: number;
    title: string;
    type: string;
    video_count: number;
    doc_count: number;
    audio_count: number;
    content_type: string;
    hot_area: string;
    category: string;
    source: 'telegram';
}

export interface Podcast {
    title: string;
    host: string;
    cover: string;
    source?: string;
}

// API base URL
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

// Fetch DOWNLOADED books
export async function fetchTelegramBooks(): Promise<Book[]> {
    try {
        // Try multiple search strategies to find diverse books
        const searches = [
            'best sellers',
            'desenvolvimento pessoal',
            'negócios',
            'ficção',
            'autoajuda'
        ];

        const allBooks: Book[] = [];
        const seenIds = new Set<string>();

        for (const query of searches) {
            try {
                const response = await fetch(`${API_BASE}/api/telegram/discovery/quick-search?query=${encodeURIComponent(query)}&limit=40`);
                const data = await response.json();

                if (data.success && data.books) {
                    // Add unique books only
                    for (const book of data.books) {
                        if (!seenIds.has(book.id)) {
                            seenIds.add(book.id);
                            allBooks.push(book);
                        }
                    }
                }
            } catch (err) {
                console.warn(`Search failed for "${query}":`, err);
            }
        }

        console.log(`📚 Discovered ${allBooks.length} unique books via Telegram search`);
        return allBooks;

    } catch (error) {
        console.error('Error fetching books:', error);

        // Fallback to traditional endpoint
        try {
            const response = await fetch(`${API_BASE}/api/telegram/library/books`);
            const data = await response.json();
            return data.success ? data.books : [];
        } catch {
            return [];
        }
    }
}

// Fetch DOWNLOADED audiobooks
export async function fetchTelegramAudiobooks(): Promise<Audiobook[]> {
    try {
        // Try the indexed streaming endpoint first (preferred)
        const response = await fetch(`${API_BASE}/api/telegram/library/audiobooks-index`);
        const data = await response.json();

        if (data.success && data.audiobooks && data.audiobooks.length > 0) {
            console.log(`🎧 Loaded ${data.total} audiobooks from index`);
            return data.audiobooks;
        }

        // Fallback to quick search
        const searchResponse = await fetch(`${API_BASE}/api/telegram/discovery/quick-search?query=audiobook&limit=50`);
        const searchData = await searchResponse.json();

        if (searchData.success) {
            console.log(`🎧 Discovered ${searchData.total} audiobooks via search`);
            return searchData.books || [];
        }

        return [];
    } catch (error) {
        console.error('Error fetching audiobooks:', error);

        // Ultimate fallback
        try {
            const response = await fetch(`${API_BASE}/api/telegram/library/audiobooks`);
            const data = await response.json();
            return data.success ? data.audiobooks : [];
        } catch {
            return [];
        }
    }
}

// Fetch TELEGRAM COURSES (videoaulas)
export async function fetchTelegramCourses(): Promise<Course[]> {
    try {
        const response = await fetch(`${API_BASE}/api/telegram/courses`);
        const data = await response.json();

        if (!data.success) {
            console.warn('Failed to fetch courses:', data);
            return [];
        }

        console.log(`🎓 Loaded ${data.total} Telegram courses`);
        return data.courses || [];
    } catch (error) {
        console.error('Error fetching courses:', error);
        return [];
    }
}

// Get file URL for book
export function getBookUrl(book: Book): string {
    if (book.source === 'telegram' && book.file_name) {
        return `${API_BASE}/api/telegram/serve/${encodeURIComponent(book.file_name)}`;
    }
    return '/books/metamorphosis.epub';
}

// Get file URL for audiobook
export function getAudioUrl(audiobook: Audiobook): string {
    if (audiobook.source === 'telegram') {
        if (audiobook.channel_id && audiobook.message_id) {
            return `${API_BASE}/api/telegram/library/stream-audio/${audiobook.channel_id}/${audiobook.message_id}`;
        }
        if (audiobook.file_name) {
            return `${API_BASE}/api/telegram/serve/${encodeURIComponent(audiobook.file_name)}`;
        }
    }
    return '';
}

// Podcasts
export const podcasts: Podcast[] = [
    {
        title: 'Lex Fridman Podcast',
        host: 'Lex Fridman',
        cover: 'https://yt3.googleusercontent.com/ytc/AIdro_k1d6yVqF9l9c9f5l7r2q7x6b5n6j4k3m2l1=s900-c-k-c0x00ffffff-no-rj',
        source: 'youtube'
    },
    {
        title: 'Flow Podcast',
        host: 'Igor Coelho',
        cover: 'https://i.scdn.co/image/ab6765630000ba8a7c0c53c8c6f2f8f1f3f4f5f6',
        source: 'spotify'
    }
];

// Data loaders
export async function getAllBooks(): Promise<Book[]> {
    return await fetchTelegramBooks();
}

export async function getAllAudiobooks(): Promise<Audiobook[]> {
    return await fetchTelegramAudiobooks();
}

export async function getAllCourses(): Promise<Course[]> {
    return await fetchTelegramCourses();
}

// Legacy (deprecated)
export const curatedBooks: Book[] = [];
export const audiobooks: Audiobook[] = [];
