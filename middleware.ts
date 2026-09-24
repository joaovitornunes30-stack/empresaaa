import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verificarTokenSessao } from "@/lib/session-edge";
import { rotaPadraoParaPapel } from "@/lib/rotas";

const ROTAS_PUBLICAS = ["/login", "/cadastro"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const publica = ROTAS_PUBLICAS.some(
    (rota) => pathname === rota || pathname.startsWith(`${rota}/`),
  );

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const sessao = token ? await verificarTokenSessao(token) : null;

  if (!publica && !sessao) {
    const destino = new URL("/login", request.url);
    destino.searchParams.set("next", pathname);
    return NextResponse.redirect(destino);
  }

  if (publica && sessao) {
    return NextResponse.redirect(new URL(rotaPadraoParaPapel(sessao.papel), request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Todas as rotas exceto assets estáticos do Next e a API de imagem.
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
