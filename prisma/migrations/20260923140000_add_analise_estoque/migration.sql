-- AlterTable
ALTER TABLE "EntradaSaida" ADD COLUMN     "produtoId" TEXT;

-- CreateTable
CREATE TABLE "MetaDoMes" (
    "id" TEXT NOT NULL,
    "mesReferencia" TEXT NOT NULL,
    "valorMeta" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "MetaDoMes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EstoqueMovimento" (
    "id" TEXT NOT NULL,
    "produtoId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "descricao" TEXT,

    CONSTRAINT "EstoqueMovimento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MetaDoMes_mesReferencia_key" ON "MetaDoMes"("mesReferencia");

-- AddForeignKey
ALTER TABLE "EntradaSaida" ADD CONSTRAINT "EntradaSaida_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "Produto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstoqueMovimento" ADD CONSTRAINT "EstoqueMovimento_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "Produto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
