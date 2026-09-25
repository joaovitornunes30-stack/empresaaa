import { prisma } from "@/lib/prisma";
import { runWithTenant } from "@/lib/tenant-context";
import { exigirSessaoAba } from "@/lib/permissoes";
import { ConvidarUsuarioButton } from "@/components/equipe/convidar-usuario-button";
import { EquipeTable } from "@/components/equipe/equipe-table";

export const dynamic = "force-dynamic";

export default async function EquipePage() {
  const sessao = await exigirSessaoAba("equipe");
  return runWithTenant(sessao, () =>
    EquipePageConteudo(sessao.clinicaId, sessao.usuarioId, sessao.papel === "dono"),
  );
}

async function EquipePageConteudo(clinicaId: string, usuarioAtualId: string, souDono: boolean) {
  // Usuario não é isolado automaticamente pela extensão do Prisma (seu
  // clinicaId é opcional — nulo para "consultor") — filtra explicitamente.
  const [equipe, consultoresAcesso] = await Promise.all([
    prisma.usuario.findMany({
      where: { clinicaId },
      orderBy: { createdAt: "asc" },
      include: { permissoes: true },
    }),
    prisma.consultorAcesso.findMany({
      where: { clinicaId },
      distinct: ["usuarioId"],
      orderBy: { dataAcesso: "desc" },
      include: { usuario: { select: { id: true, nome: true, email: true, ativo: true } } },
    }),
  ]);

  return (
    <main className="mx-auto max-w-4xl px-6 py-10 sm:px-10">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Equipe</h1>
          <p className="mt-1 text-sm text-foreground/60">
            Gerencie quem tem acesso à sua clínica no Aivy.
          </p>
        </div>
        {souDono && <ConvidarUsuarioButton />}
      </header>

      <div className="mb-8">
        <h2 className="mb-3 font-display text-base font-semibold text-foreground">
          Equipe da clínica
        </h2>
        <EquipeTable usuarios={equipe} usuarioAtualId={usuarioAtualId} podeGerenciar={souDono} />
      </div>

      {consultoresAcesso.length > 0 && (
        <div>
          <h2 className="mb-3 font-display text-base font-semibold text-foreground">
            Consultores com acesso
          </h2>
          <div className="overflow-hidden rounded-2xl border border-border bg-surface">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-background/60 text-xs uppercase tracking-wide text-foreground/50">
                  <th className="px-5 py-3 font-medium">Nome</th>
                  <th className="px-5 py-3 font-medium">E-mail</th>
                  <th className="px-5 py-3 font-medium">Último acesso</th>
                </tr>
              </thead>
              <tbody>
                {consultoresAcesso.map((acesso) => (
                  <tr key={acesso.usuario.id} className="border-b border-border last:border-0">
                    <td className="px-5 py-3 font-medium text-foreground">{acesso.usuario.nome}</td>
                    <td className="px-5 py-3 text-foreground/70">{acesso.usuario.email}</td>
                    <td className="px-5 py-3 text-foreground/70">
                      {acesso.dataAcesso.toLocaleString("pt-BR", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  );
}
