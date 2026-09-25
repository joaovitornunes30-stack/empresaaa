import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { tenantAtual } from "@/lib/tenant-context";

// Modelos com coluna clinicaId própria — toda query nesses modelos é
// automaticamente restrita à clínica do contexto ativo (ver
// lib/tenant-context.ts). Modelos que isolam por clínica apenas de forma
// transitiva via um relacionamento (PlanoItem, Sessao, PlanoModeloItem,
// ProtocoloItem) ficam de fora de propósito — eles não têm existência
// independente do pai já isolado. Clinica/Usuario/ConsultorAcesso também
// ficam de fora: precisam ser consultados sem filtro (ex: login por e-mail,
// troca de clínica ativa do consultor).
const MODELOS_COM_CLINICA = new Set([
  "PerfilTributario",
  "Produto",
  "EntradaSaida",
  "Parcela",
  "Divida",
  "EstoqueMovimento",
  "Cliente",
  "Plano",
  "PlanoModelo",
  "MetaDoMes",
  "MetaLucroMensal",
  "Retirada",
  "Funcionario",
  "DespesaAdministrativa",
]);

// Operações cujo filtro de leitura/alvo fica em `where`.
const OPERACOES_COM_WHERE = new Set([
  "findUnique",
  "findUniqueOrThrow",
  "findFirst",
  "findFirstOrThrow",
  "findMany",
  "update",
  "updateMany",
  "upsert",
  "delete",
  "deleteMany",
  "count",
  "aggregate",
  "groupBy",
]);

function comClinicaId(valor: unknown, clinicaId: string): Record<string, unknown> {
  return { ...((valor as Record<string, unknown>) ?? {}), clinicaId };
}

function criarPrismaClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const client = new PrismaClient({ adapter });

  return client.$extends({
    name: "isolamento-por-clinica",
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          if (!MODELOS_COM_CLINICA.has(model)) return query(args);

          // Lança se não houver contexto — ver tenantAtual(). Uma query a um
          // modelo isolado por clínica fora de uma sessão autenticada é um
          // bug (esqueceu de chamar exigirSessaoPagina/comSessao), nunca um
          // caminho válido a ser silenciosamente ignorado.
          const { clinicaId } = tenantAtual();

          const a = args as Record<string, unknown>;

          if (operation === "create") {
            a.data = comClinicaId(a.data as Record<string, unknown>, clinicaId);
          } else if (operation === "createMany" || operation === "createManyAndReturn") {
            const data = a.data;
            a.data = Array.isArray(data)
              ? data.map((item) => comClinicaId(item as Record<string, unknown>, clinicaId))
              : comClinicaId(data as Record<string, unknown>, clinicaId);
          }

          if (OPERACOES_COM_WHERE.has(operation)) {
            a.where = comClinicaId(a.where as Record<string, unknown>, clinicaId);
          }

          if (operation === "upsert") {
            a.create = comClinicaId(a.create as Record<string, unknown>, clinicaId);
          }

          return query(a as typeof args);
        },
      },
    },
  });
}

type PrismaClientExtended = ReturnType<typeof criarPrismaClient>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientExtended | undefined;
};

export const prisma = globalForPrisma.prisma ?? criarPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
