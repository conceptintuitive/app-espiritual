// Link curto da bio do Instagram: intuitiveconcept.com.br/ig → o site com
// utm_source=instagram&utm_medium=bio (lib/utmSocial.js). Temporário (307)
// de propósito: o destino pode mudar sem trocar a bio.
import { NextResponse } from 'next/server';
import { destinoDaBio } from '@/lib/utmSocial';

export function GET(request) {
  return NextResponse.redirect(new URL(destinoDaBio('instagram'), request.url), {
    status: 307, headers: { 'Cache-Control': 'public, max-age=300' },
  });
}
