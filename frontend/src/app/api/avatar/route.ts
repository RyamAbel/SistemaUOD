import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return new NextResponse('URL requerida', { status: 400 });
  }

  // Validar que provenga de Google o de un dominio de avatares confiable
  try {
    const parsed = new URL(targetUrl);
    if (!parsed.hostname.endsWith('googleusercontent.com') && !parsed.hostname.endsWith('supabase.co')) {
      return new NextResponse('Dominio no permitido', { status: 403 });
    }

    const response = await fetch(targetUrl, {
      headers: {
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      next: { revalidate: 86400 } // Cachear por 24 horas
    });

    if (!response.ok) {
      return new NextResponse(null, { status: response.status });
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const arrayBuffer = await response.arrayBuffer();

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
      }
    });
  } catch (error) {
    return new NextResponse('Error al obtener avatar', { status: 500 });
  }
}
