-- Protocolo Personalizado: um Produto pode ser um produto composto
-- ("protocolo") que consome outros Produtos como material, cada um com sua
-- própria quantidade.

-- CreateTable
CREATE TABLE "ProtocoloItem" (
    "id" TEXT NOT NULL,
    "produtoPaiId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "quantidade" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "ProtocoloItem_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ProtocoloItem" ADD CONSTRAINT "ProtocoloItem_produtoPaiId_fkey" FOREIGN KEY ("produtoPaiId") REFERENCES "Produto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProtocoloItem" ADD CONSTRAINT "ProtocoloItem_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Produto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
