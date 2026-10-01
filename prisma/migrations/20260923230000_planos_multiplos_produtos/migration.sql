-- Evolução do modelo de Planos: um Plano passa a ter múltiplos itens
-- (PlanoItem), cada um com seu próprio produto/quantidade/valor/intervalo,
-- e ganha moldes reutilizáveis (PlanoModelo/PlanoModeloItem). Sessao passa a
-- se relacionar com PlanoItem em vez de Plano diretamente.
--
-- Não há dados em Plano/Sessao para preservar neste ambiente, então as
-- tabelas antigas são recriadas do zero.

-- DropForeignKey
ALTER TABLE "Sessao" DROP CONSTRAINT "Sessao_planoId_fkey";

-- DropForeignKey
ALTER TABLE "Plano" DROP CONSTRAINT "Plano_produtoId_fkey";

-- DropForeignKey
ALTER TABLE "Plano" DROP CONSTRAINT "Plano_clienteId_fkey";

-- DropTable
DROP TABLE "Sessao";

-- DropTable
DROP TABLE "Plano";

-- CreateTable
CREATE TABLE "PlanoModelo" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlanoModelo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanoModeloItem" (
    "id" TEXT NOT NULL,
    "planoModeloId" TEXT NOT NULL,
    "produtoId" TEXT NOT NULL,
    "quantidadeSessoes" INTEGER NOT NULL,
    "valorItem" DOUBLE PRECISION NOT NULL,
    "intervaloDias" INTEGER NOT NULL,

    CONSTRAINT "PlanoModeloItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Plano" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT,
    "nome" TEXT NOT NULL,
    "valorTotal" DOUBLE PRECISION NOT NULL,
    "dataVenda" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Plano_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanoItem" (
    "id" TEXT NOT NULL,
    "planoId" TEXT NOT NULL,
    "produtoId" TEXT NOT NULL,
    "quantidadeSessoes" INTEGER NOT NULL,
    "valorItem" DOUBLE PRECISION NOT NULL,
    "intervaloDias" INTEGER NOT NULL,

    CONSTRAINT "PlanoItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sessao" (
    "id" TEXT NOT NULL,
    "planoItemId" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "dataPrevista" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "dataEntregue" TIMESTAMP(3),

    CONSTRAINT "Sessao_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PlanoModeloItem" ADD CONSTRAINT "PlanoModeloItem_planoModeloId_fkey" FOREIGN KEY ("planoModeloId") REFERENCES "PlanoModelo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanoModeloItem" ADD CONSTRAINT "PlanoModeloItem_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "Produto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Plano" ADD CONSTRAINT "Plano_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanoItem" ADD CONSTRAINT "PlanoItem_planoId_fkey" FOREIGN KEY ("planoId") REFERENCES "Plano"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanoItem" ADD CONSTRAINT "PlanoItem_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "Produto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sessao" ADD CONSTRAINT "Sessao_planoItemId_fkey" FOREIGN KEY ("planoItemId") REFERENCES "PlanoItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
