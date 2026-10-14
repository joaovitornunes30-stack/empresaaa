-- Pausar um mês: um mês marcado pelo dono como "pausado" continua com todo
-- o lançamento visível, só sai das médias/comparações históricas.

-- CreateTable
CREATE TABLE "MesPausado" (
    "id" TEXT NOT NULL,
    "clinicaId" TEXT NOT NULL,
    "mesISO" TEXT NOT NULL,
    "motivo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MesPausado_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MesPausado_clinicaId_mesISO_key" ON "MesPausado"("clinicaId", "mesISO");

-- AddForeignKey
ALTER TABLE "MesPausado" ADD CONSTRAINT "MesPausado_clinicaId_fkey" FOREIGN KEY ("clinicaId") REFERENCES "Clinica"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
