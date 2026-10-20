import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');

  if (error) {
    // Si Supabase o Google rechazó la autenticación (ej: trigger rechazó usuario no invitado)
    const redirectUrl = new URL('/', requestUrl.origin);
    redirectUrl.searchParams.set('auth_error', errorDescription || error);
    return NextResponse.redirect(redirectUrl);
  }

  if (code) {
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (exchangeError) {
      const redirectUrl = new URL('/', requestUrl.origin);
      redirectUrl.searchParams.set('auth_error', exchangeError.message);
      return NextResponse.redirect(redirectUrl);
    }
  }

  // Redirigir al panel principal tras autenticación exitosa
  return NextResponse.redirect(new URL('/', requestUrl.origin));
}
