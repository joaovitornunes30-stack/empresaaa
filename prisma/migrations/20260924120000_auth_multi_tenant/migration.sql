-- Autenticação + Multi-tenant (isolamento por clínica) + Cadastro de
-- Profissionais.
--
-- Cria Clinica/Usuario/ConsultorAcesso e adiciona clinicaId a toda tabela de
-- negócio existente. Para não quebrar os dados já existentes (mockados/de
-- teste), esta migration cria uma "Clínica Padrão" e associa a ela TODO dado
-- pré-existente antes de tornar clinicaId obrigatório.
--
-- Login inicial de teste criado nesta migration (papel "dono" da Clínica
-- Padrão): admin@aivy.local / aivy1234 — troque a senha após o primeiro
-- login em produção.

-- CreateTable
CREATE TABLE "Clinica" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Clinica_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "papel" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "clinicaId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateTable
CREATE TABLE "ConsultorAcesso" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "clinicaId" TEXT NOT NULL,
    "dataAcesso" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConsultorAcesso_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_clinicaId_fkey" FOREIGN KEY ("clinicaId") REFERENCES "Clinica"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsultorAcesso" ADD CONSTRAINT "ConsultorAcesso_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsultorAcesso" ADD CONSTRAINT "ConsultorAcesso_clinicaId_fkey" FOREIGN KEY ("clinicaId") REFERENCES "Clinica"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Clínica padrão + usuário dono, para não quebrar dados pré-existentes e
-- deixar o ambiente utilizável logo após a migration.
INSERT INTO "Clinica" ("id", "nome") VALUES ('clinica-padrao', 'Clínica Padrão');

INSERT INTO "Usuario" ("id", "nome", "email", "senhaHash", "papel", "clinicaId")
VALUES ('usuario-dono-padrao', 'Administrador', 'admin@aivy.local', '$2b$10$dFeIuaIr/l1X/rFcvTd4uO9oawH4Dlglf9qCNTypjkwJfdl1DbCpC', 'dono', 'clinica-padrao');

-- ===== PerfilTributario =====
ALTER TABLE "PerfilTributario" ADD COLUMN "clinicaId" TEXT;
UPDATE "PerfilTributario" SET "clinicaId" = 'clinica-padrao' WHERE "clinicaId" IS NULL;
ALTER TABLE "PerfilTributario" ALTER COLUMN "clinicaId" SET NOT NULL;
ALTER TABLE "PerfilTributario" ADD CONSTRAINT "PerfilTributario_clinicaId_fkey" FOREIGN KEY ("clinicaId") REFERENCES "Clinica"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ===== Produto =====
ALTER TABLE "Produto" ADD COLUMN "clinicaId" TEXT;
UPDATE "Produto" SET "clinicaId" = 'clinica-padrao' WHERE "clinicaId" IS NULL;
ALTER TABLE "Produto" ALTER COLUMN "clinicaId" SET NOT NULL;
ALTER TABLE "Produto" ADD CONSTRAINT "Produto_clinicaId_fkey" FOREIGN KEY ("clinicaId") REFERENCES "Clinica"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ===== EntradaSaida =====
ALTER TABLE "EntradaSaida" ADD COLUMN "clinicaId" TEXT;
ALTER TABLE "EntradaSaida" ADD COLUMN "fechadoPorUsuarioId" TEXT;
UPDATE "EntradaSaida" SET "clinicaId" = 'clinica-padrao' WHERE "clinicaId" IS NULL;
ALTER TABLE "EntradaSaida" ALTER COLUMN "clinicaId" SET NOT NULL;
ALTER TABLE "EntradaSaida" ADD CONSTRAINT "EntradaSaida_clinicaId_fkey" FOREIGN KEY ("clinicaId") REFERENCES "Clinica"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "EntradaSaida" ADD CONSTRAINT "EntradaSaida_fechadoPorUsuarioId_fkey" FOREIGN KEY ("fechadoPorUsuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ===== Cliente =====
ALTER TABLE "Cliente" ADD COLUMN "clinicaId" TEXT;
UPDATE "Cliente" SET "clinicaId" = 'clinica-padrao' WHERE "clinicaId" IS NULL;
ALTER TABLE "Cliente" ALTER COLUMN "clinicaId" SET NOT NULL;
ALTER TABLE "Cliente" ADD CONSTRAINT "Cliente_clinicaId_fkey" FOREIGN KEY ("clinicaId") REFERENCES "Clinica"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ===== PlanoModelo =====
ALTER TABLE "PlanoModelo" ADD COLUMN "clinicaId" TEXT;
UPDATE "PlanoModelo" SET "clinicaId" = 'clinica-padrao' WHERE "clinicaId" IS NULL;
ALTER TABLE "PlanoModelo" ALTER COLUMN "clinicaId" SET NOT NULL;
ALTER TABLE "PlanoModelo" ADD CONSTRAINT "PlanoModelo_clinicaId_fkey" FOREIGN KEY ("clinicaId") REFERENCES "Clinica"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ===== Plano =====
ALTER TABLE "Plano" ADD COLUMN "clinicaId" TEXT;
UPDATE "Plano" SET "clinicaId" = 'clinica-padrao' WHERE "clinicaId" IS NULL;
ALTER TABLE "Plano" ALTER COLUMN "clinicaId" SET NOT NULL;
ALTER TABLE "Plano" ADD CONSTRAINT "Plano_clinicaId_fkey" FOREIGN KEY ("clinicaId") REFERENCES "Clinica"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ===== Parcela =====
ALTER TABLE "Parcela" ADD COLUMN "clinicaId" TEXT;
UPDATE "Parcela" SET "clinicaId" = 'clinica-padrao' WHERE "clinicaId" IS NULL;
ALTER TABLE "Parcela" ALTER COLUMN "clinicaId" SET NOT NULL;
ALTER TABLE "Parcela" ADD CONSTRAINT "Parcela_clinicaId_fkey" FOREIGN KEY ("clinicaId") REFERENCES "Clinica"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ===== MetaLucroMensal (unique mes -> unique [clinicaId, mes]) =====
ALTER TABLE "MetaLucroMensal" DROP CONSTRAINT IF EXISTS "MetaLucroMensal_mes_key";
ALTER TABLE "MetaLucroMensal" ADD COLUMN "clinicaId" TEXT;
UPDATE "MetaLucroMensal" SET "clinicaId" = 'clinica-padrao' WHERE "clinicaId" IS NULL;
ALTER TABLE "MetaLucroMensal" ALTER COLUMN "clinicaId" SET NOT NULL;
ALTER TABLE "MetaLucroMensal" ADD CONSTRAINT "MetaLucroMensal_clinicaId_fkey" FOREIGN KEY ("clinicaId") REFERENCES "Clinica"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE UNIQUE INDEX "MetaLucroMensal_clinicaId_mes_key" ON "MetaLucroMensal"("clinicaId", "mes");

-- ===== MetaDoMes (unique mesReferencia -> unique [clinicaId, mesReferencia]) =====
ALTER TABLE "MetaDoMes" DROP CONSTRAINT IF EXISTS "MetaDoMes_mesReferencia_key";
ALTER TABLE "MetaDoMes" ADD COLUMN "clinicaId" TEXT;
UPDATE "MetaDoMes" SET "clinicaId" = 'clinica-padrao' WHERE "clinicaId" IS NULL;
ALTER TABLE "MetaDoMes" ALTER COLUMN "clinicaId" SET NOT NULL;
ALTER TABLE "MetaDoMes" ADD CONSTRAINT "MetaDoMes_clinicaId_fkey" FOREIGN KEY ("clinicaId") REFERENCES "Clinica"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE UNIQUE INDEX "MetaDoMes_clinicaId_mesReferencia_key" ON "MetaDoMes"("clinicaId", "mesReferencia");

-- ===== EstoqueMovimento =====
ALTER TABLE "EstoqueMovimento" ADD COLUMN "clinicaId" TEXT;
UPDATE "EstoqueMovimento" SET "clinicaId" = 'clinica-padrao' WHERE "clinicaId" IS NULL;
ALTER TABLE "EstoqueMovimento" ALTER COLUMN "clinicaId" SET NOT NULL;
ALTER TABLE "EstoqueMovimento" ADD CONSTRAINT "EstoqueMovimento_clinicaId_fkey" FOREIGN KEY ("clinicaId") REFERENCES "Clinica"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ===== Retirada =====
ALTER TABLE "Retirada" ADD COLUMN "clinicaId" TEXT;
UPDATE "Retirada" SET "clinicaId" = 'clinica-padrao' WHERE "clinicaId" IS NULL;
ALTER TABLE "Retirada" ALTER COLUMN "clinicaId" SET NOT NULL;
ALTER TABLE "Retirada" ADD CONSTRAINT "Retirada_clinicaId_fkey" FOREIGN KEY ("clinicaId") REFERENCES "Clinica"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ===== Divida =====
ALTER TABLE "Divida" ADD COLUMN "clinicaId" TEXT;
UPDATE "Divida" SET "clinicaId" = 'clinica-padrao' WHERE "clinicaId" IS NULL;
ALTER TABLE "Divida" ALTER COLUMN "clinicaId" SET NOT NULL;
ALTER TABLE "Divida" ADD CONSTRAINT "Divida_clinicaId_fkey" FOREIGN KEY ("clinicaId") REFERENCES "Clinica"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
