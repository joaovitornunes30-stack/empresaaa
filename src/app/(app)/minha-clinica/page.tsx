import { prisma } from "@/lib/prisma";
import { exigirSessaoPagina } from "@/lib/auth";
import { runWithTenant } from "@/lib/tenant-context";
import { EditarClinicaForm } from "@/components/equipe/editar-clinica-form";

export const dynamic = "force-dynamic";

export default async function MinhaClinicaPage() {
  const sessao = await exigirSessaoPagina(["dono"]);
  return runWithTenant(sessao, () => MinhaClinicaPageConteudo(sessao.clinicaId));
}

async function MinhaClinicaPageConteudo(clinicaId: string) {
  const clinica = await prisma.clinica.findUniqueOrThrow({ where: { id: clinicaId } });

  return (
    <main className="mx-auto max-w-xl px-6 py-10 sm:px-10">
      <header className="mb-8">
        <h1 className="font-display text-2xl font-bold text-foreground">Minha Clínica</h1>
        <p className="mt-1 text-sm text-foreground/60">
          Dados gerais da sua clínica no Aivy.
        </p>
      </header>

      <EditarClinicaForm nomeAtual={clinica.nome} />
    </main>
  );
}
