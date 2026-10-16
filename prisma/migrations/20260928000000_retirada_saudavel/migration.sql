-- Evolução da aba Retiradas: retirada saudável, semáforo, pró-labore
-- combinado e motivo.

-- AlterTable
ALTER TABLE "Retirada" ADD COLUMN     "motivo" TEXT NOT NULL DEFAULT 'rotina',
ADD COLUMN     "observacao" TEXT;

-- AlterTable
ALTER TABLE "Clinica" ADD COLUMN     "percentualReservaRetirada" DOUBLE PRECISION NOT NULL DEFAULT 20,
ADD COLUMN     "proLaboreCombinado" DOUBLE PRECISION;
