import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req) {
  try {
    const { email, manualId } = await req.json();

    const link = `https://intuitiveconcept.com.br/manual/${manualId}`;

    const data = await resend.emails.send({
      from: "acesso@intuitiveconcept.com.br",
      to: email,
      subject: "Seu acesso ao Manual dos Poderes Ocultos 🔮",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.5;">
          <h2 style="margin:0 0 12px;">Seu acesso está liberado ✨</h2>
          <p style="margin:0 0 16px;">Aqui está seu link pessoal de acesso:</p>

          <p style="margin:0 0 20px;">
            <a href="${link}" style="background:#111; color:#fff; padding:12px 16px; text-decoration:none; border-radius:10px; display:inline-block;">
              Acessar meu Manual
            </a>
          </p>

          <p style="margin:0; font-size:12px; color:#666;">
            Se o botão não abrir, copie e cole no navegador:<br/>
            ${link}
          </p>

          <p style="margin:18px 0 0;">Com carinho,<br/>Equipe Intuitive ✨</p>
        </div>
      `,
    });

    return Response.json({ success: true, data, link });
  } catch (error) {
    return Response.json({ success: false, error: String(error) }, { status: 500 });
  }
}