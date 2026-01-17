import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req) {
  try {
    const { email, nome, linkCheckout } = await req.json();

    await resend.emails.send({
      from: 'Bianca <contato@seudominio.com>',
      to: email,
      subject: 'Bianca, seu próximo passo está aqui',
      html: `
        <p>Oi, ${nome} ✨</p>

        <p>
          O seu mapa já mostrou o padrão.<br/>
          O próximo passo é transformar isso em direção prática.
        </p>

        <p>
          Se fizer sentido pra você agora, o acesso ao Manual Completo
          está disponível aqui:
        </p>

        <p>
          👉 <a href="${linkCheckout}"><b>Quero continuar agora</b></a>
        </p>

        <p style="opacity:0.7">
          Se não for o momento, tudo bem. Guarde esse link.
        </p>
      `,
    });

    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
