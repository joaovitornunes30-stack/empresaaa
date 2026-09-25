import { exigirSessaoPagina } from "@/lib/auth";
import { abasPermitidas } from "@/lib/permissoes";
import { Sidebar } from "@/components/sidebar";
import { AccountMenu } from "@/components/conta/account-menu";
import { ConsultorBanner } from "@/components/conta/consultor-banner";
import { ConsultorClinicSwitcher } from "@/components/conta/consultor-clinic-switcher";
import { bannerConsultorParaClinica, clinicasDoConsultor } from "./conta-actions";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const sessao = await exigirSessaoPagina();

  const banner =
    sessao.papel !== "consultor" ? await bannerConsultorParaClinica(sessao.clinicaId) : null;

  const clinicasConsultor =
    sessao.papel === "consultor" ? await clinicasDoConsultor() : [];

  const abas = await abasPermitidas(sessao);

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
          <div>
            {sessao.papel === "consultor" && (
              <ConsultorClinicSwitcher
                clinicas={clinicasConsultor}
                clinicaAtivaId={sessao.clinicaId}
              />
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
