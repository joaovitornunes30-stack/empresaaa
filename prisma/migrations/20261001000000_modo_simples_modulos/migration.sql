-- Modo Simples: módulos avançados opcionais por clínica (Planos, Protocolo
-- Personalizado, Ranking de Indicações), todos desligados por padrão.

-- AlterTable
ALTER TABLE "Clinica" ADD COLUMN     "modulosAtivos" JSONB NOT NULL DEFAULT '{"planos":false,"protocolo":false,"indicacoes":false}';
