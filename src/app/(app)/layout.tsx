import Link from "next/link";
import { exigirSessaoPagina } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { abasPermitidas } from "@/lib/permissoes";
import { Sidebar } from "@/components/sidebar";
import { AccountMenu } from "@/components/conta/account-menu";
import { ConsultorBanner } from "@/components/conta/consultor-banner";
import { ConsultorClinicSwitcher } from "@/components/conta/consultor-clinic-switcher";
import { bannerConsultorParaClinica, clinicasDoConsultor } from "./conta-actions";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const sessao = await exigirSessaoPagina();

  // adminPlataforma não pertence a nenhuma clínica — nada de Sidebar,
  // banner de consultor ou seletor de clínica faz sentido para ele. Só a
  // própria "Notícias" (gerenciar) e o botão de sair.
  if (sessao.papel === "adminPlataforma") {
    return (
      <div className="flex min-h-screen flex-col">
        <header className="flex items-center justify-between border-b border-border bg-surface px-6 py-3">
          <span className="font-display text-xl font-bold text-primary-dark">Aivy</span>
          <AccountMenu nome={sessao.nome} papel={sessao.papel} podeAcessarEquipe={false} />
        </header>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    );
  }

  const banner =
    sessao.papel !== "consultor" ? await bannerConsultorParaClinica(sessao.clinicaId) : null;

  const clinicasConsultor =
    sessao.papel === "consultor" ? await clinicasDoConsultor() : [];

  const abas = await abasPermitidas(sessao);

  // Clinica não é isolada pela extensão do Prisma (ver MODELOS_COM_CLINICA
  // em lib/prisma.ts) — consulta direta, sem precisar de runWithTenant.
  const clinicaAtiva = await prisma.clinica.findUnique({
    where: { id: sessao.clinicaId },
    select: { logoUrl: true },
  });

  return (
    <div className="flex min-h-screen">
      <Sidebar abasPermitidas={abas} />
      <div className="flex min-w-0 flex-1 flex-col">
        {banner && (
          <ConsultorBanner
            nomeConsultor={banner.usuario.nome}
            dataAcesso={banner.dataAcesso}
          />
        )}
        <header className="flex items-center justify-between border-b border-border bg-surface px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {clinicaAtiva?.logoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={clinicaAtiva.logoUrl}
                  alt=""
                  className="h-7 w-7 shrink-0 rounded-md object-contain"
                />
              )}
              <span className="font-display text-sm font-semibold text-foreground">
                {sessao.clinicaNome}
              </span>
            </div>
            {sessao.papel === "consultor" && (
              <>
                <Link
                  href="/central-consultor"
                  className="text-sm font-medium text-foreground/70 hover:text-primary-dark"
                >
                  &larr; Central do Consultor
                </Link>
                <ConsultorClinicSwitcher
                  clinicas={clinicasConsultor}
                  clinicaAtivaId={sessao.clinicaId}
                />
              </>
            )}
          </div>
          <AccountMenu
            nome={sessao.nome}
            papel={sessao.papel}
            podeAcessarEquipe={abas.includes("equipe")}
          />
        </header>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
