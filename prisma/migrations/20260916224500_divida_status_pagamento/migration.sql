-- AlterTable
ALTER TABLE "Divida" ADD COLUMN     "entradaSaidaId" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'nao_estruturada',
ADD COLUMN     "valorParcela" DOUBLE PRECISION;

-- CreateIndex
CREATE UNIQUE INDEX "Divida_entradaSaidaId_key" ON "Divida"("entradaSaidaId");

-- AddForeignKey
ALTER TABLE "Divida" ADD CONSTRAINT "Divida_entradaSaidaId_fkey" FOREIGN KEY ("entradaSaidaId") REFERENCES "EntradaSaida"("id") ON DELETE SET NULL ON UPDATE CASCADE;
