import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req) {
  try {
    const { email } = await req.json();

    const data = await resend.emails.send({
      from: "acesso@intuitiveconcept.com.br",
      to: email,
      subject: "Seu acesso ao Manual 🔮",
      html: `
        <h1>Seu acesso está liberado</h1>
        <p>Bem-vinda ao Manual dos Poderes Ocultos.</p>
      `,
    });

    return Response.json({ success: true, data });
  } catch (error) {
    return Response.json({ error });
  }
}