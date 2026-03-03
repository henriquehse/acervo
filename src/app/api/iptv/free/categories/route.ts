import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json([
        { category_id: "free", category_name: "Canais Livres" }
    ]);
}
