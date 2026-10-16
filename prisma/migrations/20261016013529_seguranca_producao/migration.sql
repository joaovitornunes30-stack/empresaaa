-- Segurança antes de usuários reais: sessão/senha (sessionVersion, aceite
-- de termos), recuperação de senha, limite de tentativas de login, e
-- "Relatar problema". Nenhuma coluna/tabela existente é alterada ou
-- removida; tudo opcional/nullable ou com default seguro.

ALTER TABLE "Usuario"
  ADD COLUMN "sessionVersion" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "termosAceitosEm" TIMESTAMP(3);

CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiraEm" TIMESTAMP(3) NOT NULL,
    "usadoEm" TIMESTAMP(3),

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");
CREATE INDEX "PasswordResetToken_usuarioId_idx" ON "PasswordResetToken"("usuarioId");

ALTER TABLE "PasswordResetToken"
  ADD CONSTRAINT "PasswordResetToken_usuarioId_fkey"
  FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "TentativaLoginFalha" (
    "id" TEXT NOT NULL,
    "chave" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TentativaLoginFalha_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TentativaLoginFalha_chave_criadoEm_idx" ON "TentativaLoginFalha"("chave", "criadoEm");

CREATE TABLE "RelatoProblema" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT,
    "usuarioNome" TEXT,
    "usuarioEmail" TEXT,
    "clinicaId" TEXT,
    "clinicaNome" TEXT,
    "tela" TEXT,
    "mensagem" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RelatoProblema_pkey" PRIMARY KEY ("id")
);
