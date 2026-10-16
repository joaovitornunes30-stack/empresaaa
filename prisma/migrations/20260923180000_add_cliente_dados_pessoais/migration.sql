-- AlterTable
ALTER TABLE "Cliente" ADD COLUMN     "cpf" TEXT,
ADD COLUMN     "dataNascimento" TIMESTAMP(3),
ADD COLUMN     "dataPrimeiroProcedimento" TIMESTAMP(3),
ADD COLUMN     "email" TEXT;
