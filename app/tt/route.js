// Link curto da bio do TikTok: intuitiveconcept.com.br/tt → o site com
// utm_source=tiktok&utm_medium=bio (lib/utmSocial.js). Temporário (307)
// de propósito: o destino pode mudar sem trocar a bio.
import { NextResponse } from 'next/server';
import { destinoDaBio } from '@/lib/utmSocial';

export function GET(request) {
  return NextResponse.redirect(new URL(destinoDaBio('tiktok'), request.url), {
    status: 307, headers: { 'Cache-Control': 'public, max-age=300' },
  });
}
