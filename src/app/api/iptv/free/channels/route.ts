import { NextResponse } from 'next/server';

export async function GET() {
    // Mock free channels list to avoid errors
    return NextResponse.json([
        {
            id: "free_1",
            name: "Câmera ao Vivo - Praia",
            stream_url: "https://rtmp.globo.com/live/camera1/playlist.m3u8", // Example
            category_id: "free",
            stream_icon: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e"
        }
    ]);
}
