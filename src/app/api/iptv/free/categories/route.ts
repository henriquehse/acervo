import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json([
        { category_id: "TV Aberta SP", category_name: "📺 TV Aberta SP" },
        { category_id: "Pluto TV", category_name: "🪐 Pluto TV" },
        { category_id: "Notícias", category_name: "📰 Notícias" },
        { category_id: "Esportes", category_name: "⚽ Esportes" },
        { category_id: "Filmes", category_name: "🎬 Filmes" },
        { category_id: "Séries", category_name: "📺 Séries" },
        { category_id: "Infantil", category_name: "🧸 Infantil" },
        { category_id: "Documentários", category_name: "🎓 Documentários" },
        { category_id: "Música", category_name: "🎵 Música" },
        { category_id: "Variedades", category_name: "⭐ Variedades" },
        { category_id: "Entretenimento", category_name: "🎭 Entretenimento" },
        { category_id: "Desenhos & Animação", category_name: "🎨 Desenhos & Animação" },
        { category_id: "Educação", category_name: "📚 Educação" },
        { category_id: "Religioso", category_name: "⛪ Religioso" },
    ]);
}
