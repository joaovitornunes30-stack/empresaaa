-- DropForeignKey
ALTER TABLE "Divida" DROP CONSTRAINT IF EXISTS "Divida_entradaSaidaId_fkey";

-- DropIndex
DROP INDEX IF EXISTS "Divida_entradaSaidaId_key";

-- AlterTable
ALTER TABLE "Divida" DROP COLUMN IF EXISTS "entradaSaidaId";

-- AlterTable
ALTER TABLE "EntradaSaida" ADD COLUMN     "dividaId" TEXT;

-- AddForeignKey
ALTER TABLE "EntradaSaida" ADD CONSTRAINT "EntradaSaida_dividaId_fkey" FOREIGN KEY ("dividaId") REFERENCES "Divida"("id") ON DELETE SET NULL ON UPDATE CASCADE;
