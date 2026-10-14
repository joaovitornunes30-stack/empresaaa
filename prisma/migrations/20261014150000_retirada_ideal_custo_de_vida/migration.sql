-- Retirada ideal (Partes 1-5): horizonte/reserva de caixa configuráveis,
-- custo de vida privado por dono, e atribuição de cada retirada a um dono.

-- AlterTable: config de Caixa livre
ALTER TABLE "Clinica" ADD COLUMN     "horizonteDiasCompromissos" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN     "reservaMesesCustoFixo" DOUBLE PRECISION NOT NULL DEFAULT 1;

-- AlterTable: a qual dono uma retirada pertence
ALTER TABLE "Retirada" ADD COLUMN     "usuarioId" TEXT;

-- CreateTable: custo de vida privado de um dono
CREATE TABLE "CustoDeVida" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "clinicaId" TEXT NOT NULL,
    "preciso" DOUBLE PRECISION,
    "quero" DOUBLE PRECISION,
    "moradia" DOUBLE PRECISION,
    "gastosBasicos" DOUBLE PRECISION,
    "cartao" DOUBLE PRECISION,
    "outros" DOUBLE PRECISION,
    "ativo" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustoDeVida_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CustoDeVida_usuarioId_key" ON "CustoDeVida"("usuarioId");

-- AddForeignKey
ALTER TABLE "Retirada" ADD CONSTRAINT "Retirada_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustoDeVida" ADD CONSTRAINT "CustoDeVida_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustoDeVida" ADD CONSTRAINT "CustoDeVida_clinicaId_fkey" FOREIGN KEY ("clinicaId") REFERENCES "Clinica"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Backfill: toda Retirada antiga sem dono vai para o dono principal da sua
-- clínica (o dono mais antigo, por createdAt) — nunca apaga nada, só
-- atribui a quem já tinha acesso total à clínica desde sempre.
UPDATE "Retirada" r
SET "usuarioId" = sub.usuario_id
FROM (
    SELECT DISTINCT ON (u."clinicaId") u."clinicaId" AS clinica_id, u.id AS usuario_id
    FROM "Usuario" u
    WHERE u.papel = 'dono' AND u."clinicaId" IS NOT NULL
    ORDER BY u."clinicaId", u."createdAt" ASC
) sub
WHERE r."clinicaId" = sub.clinica_id AND r."usuarioId" IS NULL;
