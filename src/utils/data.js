// Mock data for demo - will be replaced with Google Drive API integration
// Covers use placeholder gradients that look premium

const generateGradient = (index) => {
    const gradients = [
        'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
        'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
        'linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)',
        'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
        'linear-gradient(135deg, #f5576c 0%, #ff6f61 100%)',
        'linear-gradient(135deg, #667eea 0%, #47d6e8 100%)',
        'linear-gradient(135deg, #C850C0 0%, #4158D0 100%)',
        'linear-gradient(135deg, #0093E9 0%, #80D0C7 100%)',
        'linear-gradient(135deg, #8BC6EC 0%, #9599E2 100%)',
        'linear-gradient(135deg, #FBAB7E 0%, #F7CE68 100%)',
        'linear-gradient(135deg, #85FFBD 0%, #FFFB7D 100%)',
        'linear-gradient(135deg, #FF9A8B 0%, #FF6A88 50%, #FF99AC 100%)',
    ]
    return gradients[index % gradients.length]
}

export const DEMO_AUDIOBOOKS = [
    {
        id: 'ab-1',
        title: 'O Poder do Hábito',
        author: 'Charles Duhigg',
        type: 'audiobook',
        duration: 36000,
        currentTime: 12400,
        chapters: [
            { id: 1, title: 'O Loop do Hábito', start: 0, end: 3600 },
            { id: 2, title: 'O Cérebro Ansiador', start: 3600, end: 7200 },
            { id: 3, title: 'A Regra de Ouro da Mudança', start: 7200, end: 10800 },
            { id: 4, title: 'Hábitos Mestres', start: 10800, end: 14400 },
            { id: 5, title: 'Starbucks e o Hábito do Sucesso', start: 14400, end: 18000 },
            { id: 6, title: 'O Poder de uma Crise', start: 18000, end: 21600 },
            { id: 7, title: 'Como a Target Sabe', start: 21600, end: 25200 },
            { id: 8, title: 'A Igreja e os Boicotes', start: 25200, end: 28800 },
            { id: 9, title: 'A Neurologia do Livre Arbítrio', start: 28800, end: 32400 },
            { id: 10, title: 'Apêndice', start: 32400, end: 36000 },
        ],
        coverGradient: generateGradient(0),
        narrator: 'Narrador Profissional',
        rating: 4.8,
        category: 'Desenvolvimento Pessoal'
    },
    {
        id: 'ab-2',
        title: 'Sapiens: Uma Breve História da Humanidade',
        author: 'Yuval Noah Harari',
        type: 'audiobook',
        duration: 54000,
        currentTime: 0,
        chapters: [
            { id: 1, title: 'Um Animal Insignificante', start: 0, end: 5400 },
            { id: 2, title: 'A Árvore do Conhecimento', start: 5400, end: 10800 },
            { id: 3, title: 'Um Dia na Vida de Adão e Eva', start: 10800, end: 16200 },
            { id: 4, title: 'O Dilúvio', start: 16200, end: 21600 },
            { id: 5, title: 'A Maior Fraude da História', start: 21600, end: 27000 },
            { id: 6, title: 'Construindo Pirâmides', start: 27000, end: 32400 },
            { id: 7, title: 'Sobrecarga de Memória', start: 32400, end: 37800 },
            { id: 8, title: 'Não Há Justiça na História', start: 37800, end: 43200 },
            { id: 9, title: 'A Seta da História', start: 43200, end: 48600 },
            { id: 10, title: 'O Fim do Homo Sapiens', start: 48600, end: 54000 },
        ],
        coverGradient: generateGradient(1),
        narrator: 'Narrador Profissional',
        rating: 4.9,
        category: 'História'
    },
    {
        id: 'ab-3',
        title: 'Pai Rico, Pai Pobre',
        author: 'Robert Kiyosaki',
        type: 'audiobook',
        duration: 28800,
        currentTime: 5000,
        chapters: [
            { id: 1, title: 'Os Ricos Não Trabalham por Dinheiro', start: 0, end: 4800 },
            { id: 2, title: 'Por que Ensinar Alfabetização Financeira?', start: 4800, end: 9600 },
            { id: 3, title: 'Cuide de Seu Próprio Negócio', start: 9600, end: 14400 },
            { id: 4, title: 'A História dos Impostos', start: 14400, end: 19200 },
            { id: 5, title: 'Os Ricos Inventam Dinheiro', start: 19200, end: 24000 },
            { id: 6, title: 'Trabalhe para Aprender', start: 24000, end: 28800 },
        ],
        coverGradient: generateGradient(2),
        narrator: 'Narrador Profissional',
        rating: 4.6,
        category: 'Finanças'
    },
    {
        id: 'ab-4',
        title: 'Mindset: A Nova Psicologia do Sucesso',
        author: 'Carol S. Dweck',
        type: 'audiobook',
        duration: 32400,
        currentTime: 0,
        chapters: [
            { id: 1, title: 'Os Mindsets', start: 0, end: 5400 },
            { id: 2, title: 'Por Dentro dos Mindsets', start: 5400, end: 10800 },
            { id: 3, title: 'A Verdade Sobre Habilidade e Realização', start: 10800, end: 16200 },
            { id: 4, title: 'Esportes: O Mindset de um Campeão', start: 16200, end: 21600 },
            { id: 5, title: 'Negócios: Mindset e Liderança', start: 21600, end: 27000 },
            { id: 6, title: 'Relacionamentos', start: 27000, end: 32400 },
        ],
        coverGradient: generateGradient(3),
        narrator: 'Narrador Profissional',
        rating: 4.7,
        category: 'Psicologia'
    },
    {
        id: 'ab-5',
        title: 'Atomic Habits',
        author: 'James Clear',
        type: 'audiobook',
        duration: 19800,
        currentTime: 0,
        chapters: [
            { id: 1, title: 'O Poder Surpreendente dos Hábitos', start: 0, end: 3300 },
            { id: 2, title: 'Como Seus Hábitos Moldam Sua Identidade', start: 3300, end: 6600 },
            { id: 3, title: 'Torne Óbvio', start: 6600, end: 9900 },
            { id: 4, title: 'Torne Atrativo', start: 9900, end: 13200 },
            { id: 5, title: 'Torne Fácil', start: 13200, end: 16500 },
            { id: 6, title: 'Torne Satisfatório', start: 16500, end: 19800 },
        ],
        coverGradient: generateGradient(4),
        narrator: 'Narrador Profissional',
        rating: 4.9,
        category: 'Desenvolvimento Pessoal'
    },
]

export const DEMO_EBOOKS = [
    {
        id: 'eb-1',
        title: 'A Arte da Guerra',
        author: 'Sun Tzu',
        type: 'ebook',
        pages: 96,
        currentPage: 32,
        coverGradient: generateGradient(5),
        rating: 4.5,
        category: 'Estratégia',
        format: 'PDF'
    },
    {
        id: 'eb-2',
        title: 'O Príncipe',
        author: 'Maquiavel',
        type: 'ebook',
        pages: 172,
        currentPage: 0,
        coverGradient: generateGradient(6),
        rating: 4.4,
        category: 'Filosofia',
        format: 'EPUB'
    },
    {
        id: 'eb-3',
        title: 'Como Fazer Amigos e Influenciar Pessoas',
        author: 'Dale Carnegie',
        type: 'ebook',
        pages: 256,
        currentPage: 120,
        coverGradient: generateGradient(7),
        rating: 4.7,
        category: 'Comunicação',
        format: 'PDF'
    },
    {
        id: 'eb-4',
        title: 'Meditações',
        author: 'Marco Aurélio',
        type: 'ebook',
        pages: 224,
        currentPage: 0,
        coverGradient: generateGradient(8),
        rating: 4.8,
        category: 'Filosofia',
        format: 'EPUB'
    },
    {
        id: 'eb-5',
        title: 'O Homem Mais Rico da Babilônia',
        author: 'George S. Clason',
        type: 'ebook',
        pages: 144,
        currentPage: 88,
        coverGradient: generateGradient(9),
        rating: 4.6,
        category: 'Finanças',
        format: 'PDF'
    },
    {
        id: 'eb-6',
        title: 'Os 7 Hábitos das Pessoas Altamente Eficazes',
        author: 'Stephen Covey',
        type: 'ebook',
        pages: 380,
        currentPage: 0,
        coverGradient: generateGradient(10),
        rating: 4.7,
        category: 'Desenvolvimento Pessoal',
        format: 'EPUB'
    },
]

export const ALL_ITEMS = [...DEMO_AUDIOBOOKS, ...DEMO_EBOOKS]

export const CATEGORIES = [
    'Todos',
    'Desenvolvimento Pessoal',
    'Finanças',
    'Psicologia',
    'História',
    'Filosofia',
    'Estratégia',
    'Comunicação',
]

export const SPEED_OPTIONS = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0, 2.5, 3.0]
