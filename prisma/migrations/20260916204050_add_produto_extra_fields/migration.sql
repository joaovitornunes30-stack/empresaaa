-- CreateEnum
CREATE TYPE "ComissaoTipo" AS ENUM ('percentual', 'fixo');

-- AlterTable: add nullable first so existing rows aren't rejected
ALTER TABLE "Produto" ADD COLUMN     "comissaoTipo" "ComissaoTipo",
ADD COLUMN     "comissaoValor" DOUBLE PRECISION,
ADD COLUMN     "divisorCustoEspaco" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "duracaoMinutos" INTEGER;

-- Backfill pre-existing rows with a neutral default (no commission, 30 min)
UPDATE "Produto" SET
  "comissaoTipo" = 'percentual',
  "comissaoValor" = 0,
  "duracaoMinutos" = 30
WHERE "comissaoTipo" IS NULL;

-- Now that every row has a value, enforce NOT NULL
ALTER TABLE "Produto" ALTER COLUMN "comissaoTipo" SET NOT NULL,
ALTER COLUMN "comissaoValor" SET NOT NULL,
ALTER COLUMN "duracaoMinutos" SET NOT NULL;
