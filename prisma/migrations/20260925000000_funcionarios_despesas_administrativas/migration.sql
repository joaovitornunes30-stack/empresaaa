-- CreateTable
CREATE TABLE "Funcionario" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipoContrato" TEXT NOT NULL,
    "valorMensal" DOUBLE PRECISION NOT NULL,
    "usuarioId" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "clinicaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Funcionario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DespesaAdministrativa" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "recorrente" BOOLEAN NOT NULL DEFAULT false,
    "frequencia" TEXT,
    "valor" DOUBLE PRECISION NOT NULL,
    "dataInicio" TIMESTAMP(3),
    "data" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'pendente',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "clinicaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DespesaAdministrativa_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "EntradaSaida" ADD COLUMN     "funcionarioId" TEXT,
ADD COLUMN     "despesaAdministrativaId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Funcionario_usuarioId_key" ON "Funcionario"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "EntradaSaida_funcionarioId_data_key" ON "EntradaSaida"("funcionarioId", "data");

-- CreateIndex
CREATE UNIQUE INDEX "EntradaSaida_despesaAdministrativaId_data_key" ON "EntradaSaida"("despesaAdministrativaId", "data");

-- AddForeignKey
ALTER TABLE "Funcionario" ADD CONSTRAINT "Funcionario_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Funcionario" ADD CONSTRAINT "Funcionario_clinicaId_fkey" FOREIGN KEY ("clinicaId") REFERENCES "Clinica"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DespesaAdministrativa" ADD CONSTRAINT "DespesaAdministrativa_clinicaId_fkey" FOREIGN KEY ("clinicaId") REFERENCES "Clinica"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntradaSaida" ADD CONSTRAINT "EntradaSaida_funcionarioId_fkey" FOREIGN KEY ("funcionarioId") REFERENCES "Funcionario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntradaSaida" ADD CONSTRAINT "EntradaSaida_despesaAdministrativaId_fkey" FOREIGN KEY ("despesaAdministrativaId") REFERENCES "DespesaAdministrativa"("id") ON DELETE SET NULL ON UPDATE CASCADE;
