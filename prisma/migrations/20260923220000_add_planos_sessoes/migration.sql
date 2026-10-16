-- CreateTable
CREATE TABLE "Plano" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT,
    "produtoId" TEXT NOT NULL,
    "valorTotal" DOUBLE PRECISION NOT NULL,
    "numeroSessoes" INTEGER NOT NULL,
    "intervaloDias" INTEGER NOT NULL,
    "dataVenda" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Plano_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sessao" (
    "id" TEXT NOT NULL,
    "planoId" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "dataPrevista" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "dataEntregue" TIMESTAMP(3),

    CONSTRAINT "Sessao_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Plano" ADD CONSTRAINT "Plano_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Plano" ADD CONSTRAINT "Plano_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "Produto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sessao" ADD CONSTRAINT "Sessao_planoId_fkey" FOREIGN KEY ("planoId") REFERENCES "Plano"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
