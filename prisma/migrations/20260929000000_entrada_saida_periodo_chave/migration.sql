-- Ajuste de robustez: lançamentos automáticos deixam de deduplicar pela
-- `data` (editável pontualmente) e passam a deduplicar por `periodoChave`
-- ("AAAA-MM" para salário de Funcionario, "AAAA-MM-DD" para a ocorrência
-- original de uma DespesaAdministrativa recorrente). O preenchimento de
-- periodoChave para lançamentos já existentes acontece em aplicação, na
-- primeira sincronização após o deploy — não aqui, para reaproveitar a
-- mesma lógica de formatação usada na geração de novos lançamentos.

-- DropIndex
DROP INDEX "EntradaSaida_funcionarioId_data_key";

-- DropIndex
DROP INDEX "EntradaSaida_despesaAdministrativaId_data_key";

-- AlterTable
ALTER TABLE "EntradaSaida" ADD COLUMN     "periodoChave" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "EntradaSaida_funcionarioId_periodoChave_key" ON "EntradaSaida"("funcionarioId", "periodoChave");

-- CreateIndex
CREATE UNIQUE INDEX "EntradaSaida_despesaAdministrativaId_periodoChave_key" ON "EntradaSaida"("despesaAdministrativaId", "periodoChave");
