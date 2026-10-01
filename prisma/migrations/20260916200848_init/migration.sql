-- CreateTable
CREATE TABLE "PerfilTributario" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "aliquota" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "PerfilTributario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Produto" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "precoVenda" DOUBLE PRECISION NOT NULL,
    "custoMedioMaterial" DOUBLE PRECISION NOT NULL,
    "perfilTributarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Produto_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Produto" ADD CONSTRAINT "Produto_perfilTributarioId_fkey" FOREIGN KEY ("perfilTributarioId") REFERENCES "PerfilTributario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
