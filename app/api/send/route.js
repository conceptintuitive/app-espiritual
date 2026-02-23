import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req) {
  try {
    const { email, manualId } = await req.json();
    const link = `https://intuitiveconcept.com.br/manual/${manualId}`;

    const html = `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background:#0f0f14; padding:40px 20px;">
  <div style="max-width:520px; margin:0 auto; background:#1a1a24; border-radius:18px; padding:32px; color:#fff; text-align:center;">
    <h1 style="margin:0 0 12px; font-size:22px; font-weight:600;">Seu acesso está liberado ✨</h1>
    <p style="color:#bbb; font-size:14px; margin:0 0 24px;">O seu Manual dos Poderes Ocultos já está disponível.</p>
    <a href="${link}" style="display:inline-block; padding:14px 24px; background:linear-gradient(135deg,#7c3aed,#a855f7); color:#fff; text-decoration:none; border-radius:12px; font-weight:600; font-size:14px;">
      Acessar meu Manual
    </a>
    <p style="margin:28px 0 0; font-size:12px; color:#777;">
      Se o botão não funcionar, copie e cole no navegador:<br/>
      <span style="color:#a855f7;">${link}</span>
    </p>
  </div>
  <p style="text-align:center; font-size:12px; color:#666; margin-top:24px;">Com carinho,<br/>Equipe Intuitive ✨</p>
</div>
`;

    const data = await resend.emails.send({
      from: "acesso@intuitiveconcept.com.br",
      to: email,
      subject: "Seu acesso ao Manual dos Poderes Ocultos 🔮",
      html,
      text: `Seu acesso está liberado! Link: ${link}`,
    });

    return Response.json({ success: true, data });
  } catch (error) {
    return Response.json({ success: false, error: String(error) }, { status: 500 });
  }
}