import { RedefinirSenhaForm } from "@/components/conta/redefinir-senha-form";

export const dynamic = "force-dynamic";

export default async function RedefinirSenhaPage(props: PageProps<"/redefinir-senha">) {
  const searchParams = await props.searchParams;
  const token = typeof searchParams.token === "string" ? searchParams.token : "";
  return <RedefinirSenhaForm token={token} />;
}
