import Link from "next/link";

export const metadata = { title: "Política de Privacidade — Aivy" };

export default function PrivacidadePage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <p className="mb-4 inline-block rounded-full bg-warn-bg px-3 py-1 text-xs font-semibold text-warn">
        Rascunho — revisar com advogado antes de publicar
      </p>
      <h1 className="mb-6 font-display text-2xl font-bold text-foreground">Política de Privacidade</h1>

      <div className="flex flex-col gap-4 text-sm leading-relaxed text-foreground/80">
        <p>
          Este é um texto provisório, preparado para a fase de testes do Aivy com usuários reais.
          Ele ainda não foi revisado por um advogado e não deve ser considerado uma política de
          privacidade juridicamente válida (ex: conforme a LGPD) até essa revisão acontecer.
        </p>
        <p>
          <strong className="text-foreground">Dados de conta:</strong> nome, e-mail e senha
          (guardada só como hash, nunca em texto puro) de cada pessoa que acessa o sistema.
        </p>
        <p>
          <strong className="text-foreground">Dados de clientes/pacientes da clínica:</strong> nome,
          contato, e-mail, CPF, data de nascimento, data do primeiro procedimento, origem (ex:
          &ldquo;Instagram&rdquo;, &ldquo;Indicação&rdquo;) e observações de atendimento — preenchidos pela própria
          clínica. O Aivy não coleta nenhum dado de saúde ou prontuário clínico.
        </p>
        <p>
          <strong className="text-foreground">Isolamento entre clínicas:</strong> os dados de uma
          clínica nunca são acessíveis por outra clínica. Consultores só veem as clínicas às quais
          foram explicitamente autorizados, e esse acesso fica registrado.
        </p>
        <p>
          <strong className="text-foreground">Retenção:</strong> os dados ficam armazenados enquanto
          a conta estiver ativa. Para solicitar a exclusão de dados, entre em contato com quem
          administra o Aivy na sua organização.
        </p>
        <p>
          <strong className="text-foreground">Terceiros:</strong> nesta versão de testes, nenhum
          dado é compartilhado com terceiros além do necessário para o funcionamento do serviço
          (ex: provedor de hospedagem e, quando configurado, envio de e-mail de recuperação de
          senha).
        </p>
      </div>

      <Link href="/login" className="mt-8 inline-block text-sm font-medium text-primary hover:text-primary-dark">
        &larr; Voltar
      </Link>
    </main>
  );
}
