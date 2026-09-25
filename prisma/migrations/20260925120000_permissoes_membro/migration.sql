-- Ajuste no cadastro de Equipe: cargo livre + permissões granulares por
-- aba. O papel "equipe" passa a se chamar "membro" (mesmo significado —
-- acesso restrito, agora customizável), com uma PermissaoUsuario por
-- membro. Contas "equipe" existentes são migradas para "membro" e recebem
-- uma PermissaoUsuario equivalente ao acesso fixo que "equipe" tinha antes
-- (Produtos + Clientes, sem Financeiro/Análise/Equipe), para não perder
-- acesso no meio da migração.

-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN "cargo" TEXT;

-- CreateTable
CREATE TABLE "PermissaoUsuario" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "acessaProdutos" BOOLEAN NOT NULL DEFAULT false,
    "acessaClientes" BOOLEAN NOT NULL DEFAULT false,
    "acessaFinanceiro" BOOLEAN NOT NULL DEFAULT false,
    "acessaFinanceiroRetiradas" BOOLEAN NOT NULL DEFAULT false,
    "acessaAnalise" BOOLEAN NOT NULL DEFAULT false,
    "acessaEquipe" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "PermissaoUsuario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PermissaoUsuario_usuarioId_key" ON "PermissaoUsuario"("usuarioId");

-- AddForeignKey
ALTER TABLE "PermissaoUsuario" ADD CONSTRAINT "PermissaoUsuario_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Renomeia o papel "equipe" para "membro".
UPDATE "Usuario" SET "papel" = 'membro' WHERE "papel" = 'equipe';

-- Backfill: cada membro migrado recebe o equivalente ao acesso fixo que
-- "equipe" tinha (Produtos + Clientes), sem Financeiro/Análise/Equipe.
INSERT INTO "PermissaoUsuario" ("id", "usuarioId", "acessaProdutos", "acessaClientes")
SELECT 'perm-' || u."id", u."id", true, true
FROM "Usuario" u
WHERE u."papel" = 'membro'
  AND NOT EXISTS (SELECT 1 FROM "PermissaoUsuario" p WHERE p."usuarioId" = u."id");
