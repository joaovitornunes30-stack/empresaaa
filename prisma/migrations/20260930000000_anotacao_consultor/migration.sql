-- Central do Consultor: anotações que um consultor deixa sobre uma clínica,
-- visíveis para o consultor e para o dono daquela clínica.

-- CreateTable
CREATE TABLE "AnotacaoConsultor" (
    "id" TEXT NOT NULL,
    "clinicaId" TEXT NOT NULL,
    "autorId" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "resolvida" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnotacaoConsultor_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AnotacaoConsultor" ADD CONSTRAINT "AnotacaoConsultor_clinicaId_fkey" FOREIGN KEY ("clinicaId") REFERENCES "Clinica"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
