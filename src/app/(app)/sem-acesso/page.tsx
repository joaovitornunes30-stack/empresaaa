import { exigirSessaoPagina } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Destino de fallback para uma sessão autenticada sem nenhuma aba permitida
// (ex: um membro convidado sem nenhuma permissão marcada ainda) — evita um
// loop de redirecionamento tentando abrir a rota padrão do papel quando essa
// rota específica não é permitida para esta sessão.
export default async function SemAcessoPage() {
  await exigirSessaoPagina();

  return (
    <main className="mx-auto flex max-w-lg flex-col items-center px-6 py-24 text-center">
      <h1 className="font-display text-xl font-bold text-foreground">
        Sem acesso a nenhuma área ainda
      </h1>
      <p className="mt-2 text-sm text-foreground/60">
        Sua conta ainda não tem nenhuma permissão marcada. Fale com o
        responsável pela clínica para liberar o acesso às áreas que você vai
        usar.
      </p>
    </main>
  );
}
