import Link from 'next/link';
import SiteNav from '@/app/components/SiteNav';
import BotaoPreferenciasCookies from '@/app/components/BotaoPreferenciasCookies';

export const metadata = {
  title: 'Política de Privacidade | Intuitive Concept',
  description: 'Como a Intuitive Concept coleta, usa e protege seus dados pessoais, em conformidade com a LGPD.',
  alternates: { canonical: 'https://intuitiveconcept.com.br/politica-de-privacidade' },
  robots: { index: true, follow: true },
  openGraph: {
    title: 'Política de Privacidade | Intuitive Concept',
    description: 'Como a Intuitive Concept coleta, usa e protege seus dados pessoais, em conformidade com a LGPD.',
    url: 'https://intuitiveconcept.com.br/politica-de-privacidade',
    locale: 'pt_BR',
    type: 'website',
  },
};

const styles = {
  page: { minHeight: '100vh', background: '#0a0a12', color: '#e8e6f0', padding: '48px 20px 80px' },
  container: { maxWidth: 720, margin: '0 auto' },
  back: { display: 'inline-block', color: '#a78bfa', textDecoration: 'none', fontSize: 14, marginBottom: 24 },
  h1: { fontSize: 'clamp(28px, 5vw, 36px)', fontWeight: 800, margin: '0 0 8px' },
  updated: { color: '#9896a8', fontSize: 14, marginBottom: 32 },
  h2: { fontSize: 19, fontWeight: 700, margin: '32px 0 10px', color: '#f0eff4' },
  p: { fontSize: 15.5, lineHeight: 1.7, color: '#c9c7d6', margin: '0 0 14px' },
  ul: { margin: '0 0 16px', paddingLeft: 20 },
  li: { fontSize: 15.5, lineHeight: 1.7, color: '#c9c7d6', marginBottom: 8 },
  a: { color: '#a78bfa' },
  seeAlso: { marginTop: 40, paddingTop: 20, borderTop: '1px solid rgba(167,139,250,0.2)', fontSize: 14 },
};

export default function PoliticaDePrivacidadePage() {
  return (
    <>
    <SiteNav />
    <div style={styles.page}>
      <div style={styles.container}>
        <Link href="/" style={styles.back}>← Voltar para o início</Link>
        <h1 style={styles.h1}>Política de Privacidade</h1>
        <p style={styles.updated}>Última atualização: 24 de novembro de 2026</p>

        <p style={styles.p}>
          Esta política explica quais dados a <strong>Intuitive Concept</strong>{' '}
          (intuitiveconcept.com.br) coleta, para que os usa, com quem compartilha e quais direitos
          você tem sobre eles, em conformidade com a Lei Geral de Proteção de Dados (Lei nº
          13.709/2018 — LGPD).
        </p>

        <h2 style={styles.h2}>1. Quais dados coletamos</h2>
        <p style={styles.p}>Coletamos os seguintes dados quando você usa o site:</p>
        <ul style={styles.ul}>
          <li style={styles.li}><strong>Dados que você informa diretamente:</strong> nome completo, e-mail, data de nascimento e, se você preencher, hora e local de nascimento — usados para gerar sua análise de numerologia e astrologia.</li>
          <li style={styles.li}><strong>E-mail parcial:</strong> se você começar a preencher o formulário e sair antes de concluir, podemos registrar o e-mail digitado até aquele ponto, para eventualmente entrar em contato sobre a análise que ficou pela metade.</li>
          <li style={styles.li}><strong>Dados de pagamento:</strong> ao comprar o Manual do seu Mapa, o processamento é feito pelo Stripe ou pelo Mercado Pago — não armazenamos número de cartão de crédito completo em nossos servidores. No Pix gerado na página do seu Mapa, enviamos ao Mercado Pago o seu e-mail, o primeiro nome e o valor, e o código Pix fica só no seu navegador enquanto a aba estiver aberta.</li>
          <li style={styles.li}><strong>Minha Área e Seu Dia:</strong> e-mail, nome, data, hora e cidade de nascimento, os dias em que você abriu a Minha Área (para medir o uso) se você quer receber o seu dia por e-mail (e quando foi o último envio) e, se você ativar, a inscrição do aviso diário no seu aparelho. O código de entrada enviado por e-mail é guardado só em forma cifrada e apagado depois do uso ou em 15 minutos. Se você deixar marcada a opção &ldquo;Quero receber meu dia às 7h por e-mail&rdquo; no quiz do Mapa, criamos a sua Minha Área com o primeiro nome, a data, a hora e a cidade que você informou no quiz, e guardamos quando você marcou a opção.</li>
          <li style={styles.li}><strong>Avaliação do Manual:</strong> a sua resposta ao e-mail &ldquo;O seu Manual bate com você?&rdquo;, a frase que você escrever (se escrever) e se você autorizou publicar. Não guardamos nome nem signo junto: se você autorizar, o site mostra o primeiro nome e o signo da sua própria análise. Você pode retirar a autorização a qualquer momento pelo e-mail de contato.</li>
          <li style={styles.li}><strong>Assinatura:</strong> plano, forma de pagamento (cartão recorrente ou pré-pago), situação e datas de acesso, e os identificadores da cobrança no Mercado Pago. Não guardamos número de cartão.</li>
          <li style={styles.li}><strong>Comentários no nosso Instagram:</strong> se você comentar sua data de nascimento num post da nossa conta, um sistema automático usa essa data só para calcular o seu número de vida e responder ao comentário, uma vez. A data é usada na hora e descartada: não guardamos a data, o texto do comentário nem o seu usuário. Guardamos apenas o identificador do comentário, para não responder duas vezes. Comentários ofensivos ou sem data não são respondidos.</li>
          <li style={styles.li}><strong>Dados de navegação:</strong> endereço IP, tipo de navegador, páginas visitadas e interações no site, coletados automaticamente por ferramentas de análise.</li>
        </ul>

        <h2 style={styles.h2}>2. Para que usamos seus dados</h2>
        <ul style={styles.ul}>
          <li style={styles.li}>Gerar sua análise personalizada de numerologia e astrologia;</li>
          <li style={styles.li}>Processar pagamentos e liberar o acesso ao conteúdo comprado;</li>
          <li style={styles.li}>Enviar por e-mail o link de acesso ao seu manual e, quando aplicável, comunicações sobre sua análise;</li>
          <li style={styles.li}>Se você deixou marcada a opção no quiz do Mapa ou no cadastro da Minha Área, enviar o seu dia às 7h por e-mail (o botão do e-mail entra direto na sua Minha Área por até 3 dias) e, durante o teste grátis de 7 dias, os avisos de que ele está acabando. Todo e-mail tem um link para parar de receber;</li>
          <li style={styles.li}>Alguns dias depois da compra do Manual, perguntar por e-mail se ele bate com você; com a sua autorização, mostrar a sua frase no site com o primeiro nome e o signo. As respostas (sem nome) também viram o número &ldquo;X de cada 10 pessoas disseram que o Manual bate com elas&rdquo;;</li>
          <li style={styles.li}>Entender como o site é usado, para corrigir problemas e melhorar a experiência;</li>
          <li style={styles.li}>Medir a eficácia de campanhas de anúncios (Google, Meta/Instagram/Facebook e TikTok).</li>
        </ul>

        <h2 style={styles.h2}>3. Com quem compartilhamos dados</h2>
        <p style={styles.p}>Não vendemos seus dados pessoais. Compartilhamos dados apenas com prestadores de serviço necessários para operar o site:</p>
        <ul style={styles.ul}>
          <li style={styles.li}><strong>Stripe</strong> e <strong>Mercado Pago</strong> — processamento de pagamentos;</li>
          <li style={styles.li}><strong>Supabase</strong> — armazenamento do banco de dados;</li>
          <li style={styles.li}><strong>Resend</strong> — envio dos e-mails (acesso ao manual, o seu dia às 7h, avisos do teste e a avaliação do Manual);</li>
          <li style={styles.li}><strong>Google Analytics (GA4) e Google Ads</strong> — métricas de uso e de campanhas;</li>
          <li style={styles.li}><strong>Meta Pixel / Conversions API</strong> (Facebook e Instagram) — medição de campanhas no Meta Ads;</li>
          <li style={styles.li}><strong>TikTok Pixel</strong> — medição de campanhas no TikTok Ads.</li>
        </ul>
        <p style={styles.p}>
          Essas ferramentas de analytics e publicidade usam cookies e identificadores (como e-mail
          criptografado/hash e endereço IP) para associar uma visita ou compra ao anúncio que a
          originou. Alguns desses prestadores processam dados em servidores fora do Brasil — nesses
          casos, exigimos que sigam padrões de proteção de dados compatíveis com a LGPD.
        </p>
        <p style={styles.p}>
          Quando você chega por um anúncio, o identificador do clique (como o <code>gclid</code> do
          Google ou o <code>fbclid</code> da Meta) e a origem da campanha ficam guardados só no seu
          aparelho. Se você aceitar os cookies, ao fazer o mapa, começar o teste grátis do Seu Dia ou
          fazer uma compra, guardamos esse identificador e os identificadores do Google Analytics e do
          Pixel da Meta junto com a sua análise, e os enviamos à ferramenta de anúncio correspondente,
          para que o cadastro ou a compra sejam atribuídos ao anúncio certo. Sem o aceite, nada disso
          sai do seu aparelho.
        </p>
        <p style={styles.p}>
          Também registramos de qual campanha ou rede você veio (por exemplo, &ldquo;Instagram, link da
          bio&rdquo;), com ou sem o aceite de cookies: são só rótulos da campanha, que não identificam
          você. Contamos as visitas que chegam das redes e quantas pessoas passam por cada etapa do quiz
          sem guardar nada seu (só um código aleatório que vale para aquela aba do navegador), e
          guardamos esse rótulo junto com o seu mapa e com a sua conta do Seu Dia, para saber quais
          conteúdos ajudam as pessoas a chegar até aqui. Esse rótulo nunca é enviado a ferramentas de
          anúncio.
        </p>

        <h2 style={styles.h2}>4. Cookies</h2>
        <p style={styles.p}>
          Usamos cookies e tecnologias semelhantes para lembrar sua sessão, medir tráfego e
          personalizar anúncios. As ferramentas de análise e de anúncios (Google Analytics, Google
          Ads, Meta e TikTok) só gravam cookies depois que você aceita no aviso de cookies; se você
          escolher &ldquo;Só o essencial&rdquo;, ficam só os necessários pro site funcionar. Você pode
          mudar a escolha quando quiser: <BotaoPreferenciasCookies />.
        </p>
        <p style={styles.p}>
          <strong>Cookie de sessão:</strong> ao entrar na Minha Área, gravamos um cookie (<code>ic_sd</code>) que
          mantém você conectada por até 180 dias. Ele é necessário para o funcionamento da área logada.
        </p>
        <p style={styles.p}>
          <strong>Dados salvos só no seu aparelho:</strong> as ferramentas grátis (Anjo da Guarda, Kin Maia,
          Astrologia Chinesa, Céu do Nascimento e outras) são calculadas no seu navegador. Para você não
          digitar seus dados de novo, guardamos nome e dados de nascimento no armazenamento local do
          navegador (<code>localStorage</code>), só neste aparelho — eles não são enviados para os nossos
          servidores por essas ferramentas. Você pode apagar a qualquer momento pelo botão
          &ldquo;Apagar&rdquo; que aparece acima do resultado ou limpando os dados do site no navegador.
        </p>

        <h2 style={styles.h2}>5. Por quanto tempo guardamos seus dados</h2>
        <p style={styles.p}>
          Guardamos os dados da sua análise enquanto sua conta/registro estiver ativo em nosso
          banco de dados, ou até que você solicite a exclusão. Dados de pagamento seguem o prazo
          de retenção exigido pela legislação fiscal e pelos próprios processadores de pagamento.
        </p>

        <h2 style={styles.h2}>6. Seus direitos sob a LGPD</h2>
        <p style={styles.p}>Você tem direito a, mediante solicitação:</p>
        <ul style={styles.ul}>
          <li style={styles.li}>Confirmar se tratamos dados seus e acessar quais dados são;</li>
          <li style={styles.li}>Corrigir dados incompletos, inexatos ou desatualizados;</li>
          <li style={styles.li}>Solicitar a exclusão dos seus dados pessoais (exceto quando devermos mantê-los por obrigação legal, por exemplo fiscal);</li>
          <li style={styles.li}>Solicitar a portabilidade dos seus dados a outro fornecedor;</li>
          <li style={styles.li}>Revogar, a qualquer momento, o consentimento dado para uso dos seus dados;</li>
          <li style={styles.li}>Ser informado sobre com quem compartilhamos seus dados;</li>
          <li style={styles.li}>Se opor a um tratamento de dados feito em desacordo com a lei.</li>
        </ul>
        <p style={styles.p}>
          Para exercer qualquer um desses direitos, escreva para{' '}
          <a href="mailto:conceptintuitive@gmail.com" style={styles.a}>conceptintuitive@gmail.com</a>. Respondemos
          o mais rápido possível.
        </p>

        <h2 style={styles.h2}>7. Segurança</h2>
        <p style={styles.p}>
          Adotamos medidas técnicas razoáveis para proteger seus dados contra acesso não
          autorizado, perda ou vazamento — incluindo conexão criptografada (HTTPS) e controle de
          acesso ao banco de dados. Nenhum sistema é 100% imune a incidentes, e caso algum ocorra
          com risco relevante aos seus dados, você será notificado conforme exigido pela LGPD.
        </p>

        <h2 style={styles.h2}>8. Uso por menores de idade</h2>
        <p style={styles.p}>
          O site não é direcionado a crianças. Se você é responsável legal por um menor de idade e
          identificar que ele forneceu dados pessoais sem sua autorização, entre em contato para
          que possamos excluí-los.
        </p>

        <h2 style={styles.h2}>9. Alterações nesta política</h2>
        <p style={styles.p}>
          Podemos atualizar esta Política de Privacidade periodicamente. A versão vigente é sempre
          a publicada nesta página, com a data de atualização no topo.
        </p>

        <h2 style={styles.h2}>10. Contato</h2>
        <p style={styles.p}>
          Dúvidas sobre esta política ou sobre o tratamento dos seus dados podem ser enviadas para{' '}
          <a href="mailto:conceptintuitive@gmail.com" style={styles.a}>conceptintuitive@gmail.com</a>.
        </p>

        <p style={styles.seeAlso}>
          Veja também os nossos <a href="/termos-de-uso" style={styles.a}>Termos de Uso</a>.
        </p>
      </div>
    </div>
    </>
  );
}
