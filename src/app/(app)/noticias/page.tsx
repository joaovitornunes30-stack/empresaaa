import { redirect } from "next/navigation";
import { lerSessao } from "@/lib/auth";
import { exigirSessaoAba } from "@/lib/permissoes";
import { runWithTenant } from "@/lib/tenant-context";
import { prisma } from "@/lib/prisma";
import { buscarNoticiasPublicadasParaClinica, buscarTodasNoticiasAdmin } from "@/lib/noticias-calculo";
import { GerenciarNoticias } from "@/components/noticias/gerenciar-noticias";
import { NoticiasFeed } from "@/components/noticias/noticias-feed";

export const dynamic = "force-dynamic";

export default async function NoticiasPage() {
  const sessao = await lerSessao();
  if (!sessao) redirect("/login");

  // adminPlataforma não pertence a nenhuma clínica — gerencia a tabela
  // global diretamente, sem passar por exigirSessaoAba/runWithTenant.
  if (sessao.papel === "adminPlataforma") {
    const noticias = await buscarTodasNoticiasAdmin();
    return <GerenciarNoticias noticias={noticias} />;
  }

  const sessaoClinica = await exigirSessaoAba("noticias");
  return runWithTenant(sessaoClinica, async () => {
    const clinica = await prisma.clinica.findUniqueOrThrow({
      where: { id: sessaoClinica.clinicaId },
      select: { tipoClinica: true },
    });
    const noticias = await buscarNoticiasPublicadasParaClinica(clinica.tipoClinica);
    return <NoticiasFeed noticias={noticias} />;
  });
}
