import Link from 'next/link';
import SiteNav from '@/app/components/SiteNav';
import { PRECO_ASSINATURA_MENSAL, PRECO_ASSINATURA_ANUAL } from '@/lib/preco';

const brl = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export const metadata = {
  title: 'Termos de Uso | Intuitive Concept',
  description: 'Termos de Uso da plataforma Intuitive Concept — numerologia, astrologia e conteúdo espiritual personalizado.',
  alternates: { canonical: 'https://intuitiveconcept.com.br/termos-de-uso' },
  robots: { index: true, follow: true },
  openGraph: {
    title: 'Termos de Uso | Intuitive Concept',
    description: 'Termos de Uso da plataforma Intuitive Concept.',
    url: 'https://intuitiveconcept.com.br/termos-de-uso',
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
  a: { color: '#a78bfa' },
  seeAlso: { marginTop: 40, paddingTop: 20, borderTop: '1px solid rgba(167,139,250,0.2)', fontSize: 14 },
};

export default function TermosDeUsoPage() {
  return (
    <>
    <SiteNav />
    <div style={styles.page}>
      <div style={styles.container}>
        <Link href="/" style={styles.back}>← Voltar para o início</Link>
        <h1 style={styles.h1}>Termos de Uso</h1>
        <p style={styles.updated}>Última atualização: 19 de novembro de 2026</p>

        <p style={styles.p}>
          Estes Termos de Uso regem o acesso e uso do site <strong>Intuitive Concept</strong>
          {' '}(intuitiveconcept.com.br), que oferece análises personalizadas de numerologia e
          astrologia. Ao usar o site, gerar o seu Mapa grátis ou comprar o Manual do seu Mapa,
          você concorda com os termos abaixo.
        </p>

        <h2 style={styles.h2}>1. O que é o serviço</h2>
        <p style={styles.p}>
          A Intuitive Concept gera conteúdo personalizado (relatórios, mapas e previsões) a partir
          de dados que você informa — nome, data de nascimento e, opcionalmente, hora e local de
          nascimento — combinando numerologia pitagórica, astrologia clássica e outras referências
          simbólicas. Uma prévia é gratuita; o relatório completo ("Manual do seu Mapa") e alguns
          bônus são pagos.
        </p>

        <h2 style={styles.h2}>2. Natureza do conteúdo — leia com atenção</h2>
        <p style={styles.p}>
          O conteúdo gerado tem finalidade de <strong>autoconhecimento, entretenimento e reflexão
          pessoal</strong>. Numerologia e astrologia não são ciências com comprovação empírica, e
          nada do que é gerado aqui constitui aconselhamento médico, psicológico, financeiro,
          jurídico ou de qualquer natureza profissional. Decisões importantes de vida, saúde,
          dinheiro ou relacionamentos não devem ser tomadas com base apenas neste conteúdo — para
          isso, procure um profissional qualificado na área correspondente.
        </p>

        <h2 style={styles.h2}>3. Cadastro e idade mínima</h2>
        <p style={styles.p}>
          O serviço é destinado a maiores de 18 anos. Menores de idade só podem usar o site com
          autorização e supervisão de um responsável legal. Ao informar seus dados, você declara
          que eles são verdadeiros e que tem capacidade legal para contratar.
        </p>
        <p style={styles.p}>
          <strong>Minha Área.</strong> Para entrar na Minha Área você informa seu e-mail e recebe um
          código de 6 dígitos (ou um link) — não há senha. O código vale por 15 minutos e uma única vez.
          Depois de entrar, o acesso fica salvo no aparelho por até 180 dias. Como o acesso depende do
          seu e-mail, mantenha sua caixa de entrada protegida e não compartilhe os códigos recebidos.
        </p>

        <h2 style={styles.h2}>4. Pagamento, preços e reembolso</h2>
        <p style={styles.p}>
          Os preços exibidos no momento da compra são os válidos para aquela transação. Promoções
          por tempo limitado (como o preço de lançamento exibido nas primeiras 24 horas após gerar
          sua análise) só valem dentro do prazo informado na própria página. Os pagamentos são
          processados por parceiros externos (Stripe e Mercado Pago) — não armazenamos dados
          completos de cartão de crédito em nossos servidores.
        </p>
        <p style={styles.p}>
          Oferecemos <strong>garantia de 7 dias</strong>: se o Manual do seu Mapa não trouxer clareza
          real sobre o seu padrão, devolvemos 100% do valor pago mediante solicitação simples pelo
          e-mail de contato abaixo, sem burocracia.
        </p>

        <h2 style={styles.h2}>5. Assinatura Intuitive Completo</h2>
        <p style={styles.p}>
          A assinatura <strong>Intuitive Completo</strong> custa {brl(PRECO_ASSINATURA_MENSAL)} por mês (plano
          mensal) ou {brl(PRECO_ASSINATURA_ANUAL)} por ano (plano anual). Ela libera, enquanto estiver ativa: o
          Seu Dia completo, a Previsão do Ano, o Human Design e a Compatibilidade Completa sem limites e o
          Oráculo ilimitado. O plano anual também libera o Manual do seu Mapa da análise mais recente feita com
          o mesmo e-mail.
        </p>
        <p style={styles.p}>
          <strong>Cartão com renovação automática:</strong> a cobrança se repete a cada período (mês ou ano)
          no mesmo cartão, processada pelo Mercado Pago, até você cancelar. Se uma cobrança falhar, o acesso
          continua por até 3 dias depois da data prevista; sem pagamento, ele é suspenso.
        </p>
        <p style={styles.p}>
          <strong>Pix ou cartão à vista (pré-pago):</strong> você paga um período de cada vez — 31 dias no
          mensal, 366 dias no anual — e <strong>não há renovação automática</strong>. Avisamos por e-mail 3
          dias antes do vencimento, com um link para renovar se você quiser.
        </p>
        <p style={styles.p}>
          <strong>Cancelamento:</strong> você pode cancelar a renovação a qualquer momento na Minha Área
          (aba Conta → &ldquo;Cancelar renovação&rdquo;) ou pelo e-mail de contato. Depois de cancelar, não há
          novas cobranças e o acesso continua até o fim do período já pago.
        </p>
        <p style={styles.p}>
          <strong>Direito de arrependimento:</strong> você pode desistir da assinatura em até 7 dias da
          contratação (art. 49 do Código de Defesa do Consumidor) e recebe de volta o valor pago, pelo mesmo
          meio de pagamento. Basta pedir pelo e-mail de contato.
        </p>
        <p style={styles.p}>
          <strong>Cortesia para quem comprou o Manual:</strong> quem compra o Manual do seu Mapa ganha 30 dias
          de acesso aos recursos da assinatura, sem cobrança e sem renovação automática.
        </p>
        <p style={styles.p}>
          <strong>Mudança de preço:</strong> se o preço mudar, avisamos por e-mail com pelo menos 30 dias de
          antecedência da próxima cobrança. Um período já pago nunca é alterado.
        </p>

        <h2 style={styles.h2}>6. Uso aceitável</h2>
        <p style={styles.p}>
          Você concorda em não: (a) usar o site para fins ilegais; (b) tentar acessar dados de
          outras pessoas ou áreas restritas do sistema sem autorização; (c) copiar, revender ou
          redistribuir o conteúdo gerado para terceiros com fins comerciais sem autorização prévia;
          (d) enviar dados falsos de terceiros sem consentimento deles (por exemplo, ao presentear
          um manual).
        </p>

        <h2 style={styles.h2}>7. Propriedade intelectual</h2>
        <p style={styles.p}>
          O layout, a marca, os textos institucionais e o método de geração de conteúdo da
          Intuitive Concept são de propriedade da plataforma. O relatório personalizado gerado
          para você é de uso pessoal — você pode lê-lo, salvá-lo e compartilhá-lo para uso próprio,
          mas não revendê-lo.
        </p>

        <h2 style={styles.h2}>8. Limitação de responsabilidade</h2>
        <p style={styles.p}>
          Fazemos o possível para manter o site disponível e funcionando corretamente, mas não
          garantimos disponibilidade ininterrupta. Não nos responsabilizamos por decisões tomadas
          com base no conteúdo gerado, nem por danos indiretos decorrentes do uso do site, na
          máxima extensão permitida pela lei brasileira.
        </p>

        <h2 style={styles.h2}>9. Alterações nestes termos</h2>
        <p style={styles.p}>
          Podemos atualizar estes Termos de Uso periodicamente. A versão vigente é sempre a
          publicada nesta página, com a data de atualização no topo.
        </p>

        <h2 style={styles.h2}>10. Lei aplicável</h2>
        <p style={styles.p}>
          Estes termos são regidos pelas leis da República Federativa do Brasil. Fica eleito o
          foro do domicílio do consumidor para dirimir eventuais controvérsias, conforme o Código
          de Defesa do Consumidor.
        </p>

        <h2 style={styles.h2}>11. Contato</h2>
        <p style={styles.p}>
          Dúvidas sobre estes Termos de Uso podem ser enviadas para{' '}
          <a href="mailto:conceptintuitive@gmail.com" style={styles.a}>conceptintuitive@gmail.com</a>.
        </p>

        <p style={styles.seeAlso}>
          Veja também a nossa <a href="/politica-de-privacidade" style={styles.a}>Política de Privacidade</a>.
        </p>
      </div>
    </div>
    </>
  );
}
