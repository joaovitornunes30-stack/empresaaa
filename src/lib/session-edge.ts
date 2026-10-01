// Peças da sessão seguras para rodar no Edge runtime (middleware.ts) — sem
// bcryptjs nem next/headers, só jose (puro JS) e Web Crypto. lib/auth.ts
// reexporta tudo isso e adiciona as partes Node-only (hash de senha, cookie
// via next/headers) por cima.
import { SignJWT, jwtVerify } from "jose";
import type { Papel } from "@/lib/tenant-context";

export const SESSION_COOKIE = "aivy_session";
export const SESSION_DURATION_SEGUNDOS = 60 * 60 * 24 * 30; // 30 dias

export function segredoSessao() {
  const valor = process.env.AUTH_SECRET;
  if (!valor) throw new Error("AUTH_SECRET não configurado.");
  return new TextEncoder().encode(valor);
}

export type SessionPayload = {
  usuarioId: string;
  nome: string;
  email: string;
  papel: Papel;
  clinicaId: string;
  clinicaNome: string;
};

export async function assinarSessao(payload: SessionPayload) {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SEGUNDOS}s`)
    .sign(segredoSessao());
}

export async function verificarTokenSessao(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, segredoSessao());
    if (
      typeof payload.usuarioId !== "string" ||
      typeof payload.nome !== "string" ||
      typeof payload.email !== "string" ||
      typeof payload.papel !== "string" ||
      typeof payload.clinicaId !== "string" ||
      typeof payload.clinicaNome !== "string"
    ) {
      return null;
    }
    return {
      usuarioId: payload.usuarioId,
      nome: payload.nome,
      email: payload.email,
      papel: payload.papel as Papel,
      clinicaId: payload.clinicaId,
      clinicaNome: payload.clinicaNome,
    };
  } catch {
    return null;
  }
}
