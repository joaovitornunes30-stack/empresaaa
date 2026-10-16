import { redirect } from "next/navigation";
import { lerSessao, rotaPadraoParaPapel } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function Home() {
  const sessao = await lerSessao();
  redirect(sessao ? rotaPadraoParaPapel(sessao.papel) : "/login");
}
