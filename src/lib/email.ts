/**
 * ÚNICO módulo que sabe enviar e-mail — todo o resto do app (ex:
 * lib/recuperacao-senha.ts, Relatar problema) chama só `enviarEmail`, nunca
 * fala com um provedor diretamente. Trocar de provedor no futuro é mudar só
 * este arquivo.
 *
 * Provedor atual: Resend (https://resend.com), via chamada HTTP direta à
 * API REST — sem SDK, zero dependência nova no projeto. Escolhido por ser a
 * opção mais simples e barata para um app Next.js pequeno: tem um plano
 * gratuito (3.000 e-mails/mês, 100/dia) que cobre uma clínica em testes
 * folgadamente, e o setup é só criar a conta, verificar o domínio (ou usar
 * o domínio de testes deles) e colocar a chave em RESEND_API_KEY.
 *
 * Sem RESEND_API_KEY configurada (ex: neste ambiente de desenvolvimento),
 * o e-mail não é enviado de verdade — o conteúdo é só registrado no
 * console, prefixado com "[email de teste]", e a função devolve
 * enviado:false. Nenhuma rota do app deve se comportar diferente para o
 * usuário final com base nesse retorno (ver lib/recuperacao-senha.ts: a
 * resposta ao usuário é sempre a mesma, exista ou não o e-mail e tenha ou
 * não sido enviado de verdade).
 */

export type ResultadoEnvioEmail = { enviado: boolean; erro?: string };

export async function enviarEmail(params: {
  para: string;
  assunto: string;
  textoPlano: string;
  html: string;
}): Promise<ResultadoEnvioEmail> {
  const apiKey = process.env.RESEND_API_KEY;
  const remetente = process.env.EMAIL_REMETENTE || "Aivy <onboarding@resend.dev>";

  if (!apiKey) {
    console.log(
      `[email de teste] Para: ${params.para} | Assunto: ${params.assunto}\n${params.textoPlano}`,
    );
    return { enviado: false, erro: "RESEND_API_KEY não configurada — e-mail não enviado de verdade." };
  }

  try {
    const resposta = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: remetente,
        to: [params.para],
        subject: params.assunto,
        text: params.textoPlano,
        html: params.html,
      }),
    });

    if (!resposta.ok) {
      const corpo = await resposta.text().catch(() => "");
      console.error(`[email] Falha ao enviar (${resposta.status}): ${corpo}`);
      return { enviado: false, erro: `Provedor de e-mail respondeu ${resposta.status}.` };
    }

    return { enviado: true };
  } catch (erro) {
    console.error("[email] Erro de rede ao enviar:", erro);
    return { enviado: false, erro: "Falha de rede ao enviar e-mail." };
  }
}
