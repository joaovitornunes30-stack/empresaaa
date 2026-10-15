import { prisma } from "@/lib/prisma";
import { exigirSessaoPagina } from "@/lib/auth";
import { runWithTenant, type TenantContext } from "@/lib/tenant-context";
import { lerModulosAtivos } from "@/lib/modulos";
import { EditarClinicaForm } from "@/components/equipe/editar-clinica-form";
import { LogoClinicaForm } from "@/components/equipe/logo-clinica-form";
import { ModulosAvancadosForm } from "@/components/equipe/modulos-avancados-form";

export const dynamic = "force-dynamic";

export default async function MinhaClinicaPage() {
  // Dono edita tudo; consultor vê tudo em modo leitura; membro vê só nome e
  // logo (ver Complemento à Home, Parte A).
  const sessao = await exigirSessaoPagina(["dono", "membro", "consultor"]);
  return runWithTenant(sessao, () => MinhaClinicaPageConteudo(sessao));
}

async function MinhaClinicaPageConteudo(sessao: TenantContext) {
  const clinica = await prisma.clinica.findUniqueOrThrow({ where: { id: sessao.clinicaId } });
  const somenteLeitura = sessao.papel !== "dono";

  if (sessao.papel === "membro") {
    return (
      <main className="mx-auto max-w-xl px-6 py-10 sm:px-10">
        <header className="mb-8">
          <h1 className="font-display text-2xl font-bold text-foreground">Minha Clínica</h1>
          <p className="mt-1 text-sm text-foreground/60">Dados gerais da sua clínica no Aivy.</p>
        </header>
        <div className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-6">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-background">
            {clinica.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={clinica.logoUrl} alt="Logo da clínica" className="h-full w-full object-contain" />
            ) : (
              <span className="text-xs text-foreground/40">Sem logo</span>
            )}
          </div>
          <p className="font-display text-lg font-semibold text-foreground">{clinica.nome}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-xl px-6 py-10 sm:px-10">
      <header className="mb-8">
        <h1 className="font-display text-2xl font-bold text-foreground">Minha Clínica</h1>
        <p className="mt-1 text-sm text-foreground/60">
          Dados gerais da sua clínica no Aivy.
        </p>
      </header>

      <div className="flex flex-col gap-6">
        {!somenteLeitura && <LogoClinicaForm logoUrlAtual={clinica.logoUrl} />}
        <EditarClinicaForm
          somenteLeitura={somenteLeitura}
          nomeAtual={clinica.nome}
          tipoClinicaAtual={clinica.tipoClinica}
          cnpjAtual={clinica.cnpj}
          enderecoAtual={{
            cep: clinica.cep,
            logradouro: clinica.logradouro,
            numero: clinica.numero,
            complemento: clinica.complemento,
            bairro: clinica.bairro,
            cidade: clinica.cidade,
            uf: clinica.uf,
          }}
        />
        {!somenteLeitura && <ModulosAvancadosForm modulosAtuais={lerModulosAtivos(clinica.modulosAtivos)} />}
      </div>
    </main>
  );
}
