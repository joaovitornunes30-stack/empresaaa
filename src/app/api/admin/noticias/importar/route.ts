import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { lerSessao } from "@/lib/auth";
import { noticiaInputSchema } from "@/lib/noticias";

/**
 * Prepara uma futura atualização semanal automática de notícias — mas
 * NUNCA publica sozinha: tudo entra como rascunho, sempre. Autenticação por
 * token de ambiente (NOTICIAS_IMPORT_TOKEN, para um job externo) OU sessão
 * de adminPlataforma (para importar manualmente colando a lista). Ver
 * README.md nesta mesma pasta para o formato esperado do JSON.
 */
async function autorizado(request: NextRequest): Promise<boolean> {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace(/^Bearer\s+/i, "").trim();
  const tokenConfigurado = process.env.NOTICIAS_IMPORT_TOKEN;
  if (token && tokenConfigurado && token === tokenConfigurado) return true;

  const sessao = await lerSessao();
  return sessao?.papel === "adminPlataforma";
}

export async function POST(request: NextRequest) {
  if (!(await autorizado(request))) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  let corpo: unknown;
  try {
    corpo = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  if (!Array.isArray(corpo)) {
    return NextResponse.json({ error: "Envie uma lista (array) de notícias." }, { status: 400 });
  }

  const falhas: { indice: number; motivo: string }[] = [];
  const validas: ReturnType<typeof noticiaInputSchema.parse>[] = [];

  corpo.forEach((item, indice) => {
    const parsed = noticiaInputSchema.safeParse(item);
    if (!parsed.success) {
      falhas.push({ indice, motivo: parsed.error.issues[0]?.message ?? "Dados inválidos." });
    } else {
      validas.push(parsed.data);
    }
  });

  if (validas.length > 0) {
    // Sempre rascunho — nunca publicado automaticamente pela importação.
    await prisma.noticia.createMany({
      data: validas.map((v) => ({ ...v, status: "rascunho" as const })),
    });
  }

  return NextResponse.json({ importadas: validas.length, total: corpo.length, falhas });
}
