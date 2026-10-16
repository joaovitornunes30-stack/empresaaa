import Link from "next/link";

export const metadata = { title: "Termos de Uso — Aivy" };

export default function TermosPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <p className="mb-4 inline-block rounded-full bg-warn-bg px-3 py-1 text-xs font-semibold text-warn">
        Rascunho — revisar com advogado antes de publicar
      </p>
      <h1 className="mb-6 font-display text-2xl font-bold text-foreground">Termos de Uso</h1>

      <div className="flex flex-col gap-4 text-sm leading-relaxed text-foreground/80">
        <p>
          Este é um texto provisório, preparado para a fase de testes do Aivy com usuários reais.
          Ele ainda não foi revisado por um advogado e não deve ser considerado um termo de uso
          juridicamente válido até essa revisão acontecer.
        </p>
        <p>
          Ao usar o Aivy, você concorda em fornecer informações verdadeiras sobre sua clínica e
          sua equipe, em manter sua senha em sigilo e em usar o sistema apenas para a gestão
          legítima do seu próprio negócio.
        </p>
        <p>
          O Aivy está em fase de testes (&ldquo;versão de teste&rdquo;). Podem ocorrer instabilidades, perda
          de dados ou mudanças de funcionalidade sem aviso prévio durante esse período.
        </p>
        <p>
          O dono da clínica é responsável pelos dados inseridos no sistema e pelo controle de
          acesso da sua equipe (quem convida, quais permissões concede).
        </p>
        <p>
          Reservamo-nos o direito de suspender contas que usem o sistema de forma abusiva ou que
          comprometam a segurança de outras clínicas.
        </p>
      </div>

      <Link href="/login" className="mt-8 inline-block text-sm font-medium text-primary hover:text-primary-dark">
        &larr; Voltar
      </Link>
    </main>
  );
}
