-- DropIndex
DROP INDEX "MetaDoMes_mesReferencia_key";

-- DropIndex
DROP INDEX "MetaLucroMensal_mes_key";

-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "mapaRecolhido" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "MapaEstacaoConquistada" (
    "id" TEXT NOT NULL,
    "clinicaId" TEXT NOT NULL,
    "estacaoId" TEXT NOT NULL,
    "conquistadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MapaEstacaoConquistada_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MapaEstacaoConquistada_clinicaId_estacaoId_key" ON "MapaEstacaoConquistada"("clinicaId", "estacaoId");

-- AddForeignKey
ALTER TABLE "MapaEstacaoConquistada" ADD CONSTRAINT "MapaEstacaoConquistada_clinicaId_fkey" FOREIGN KEY ("clinicaId") REFERENCES "Clinica"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
