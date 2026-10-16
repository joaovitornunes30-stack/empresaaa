-- CreateTable
CREATE TABLE "MetaLucroMensal" (
    "id" TEXT NOT NULL,
    "mes" TEXT NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "MetaLucroMensal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MetaLucroMensal_mes_key" ON "MetaLucroMensal"("mes");
