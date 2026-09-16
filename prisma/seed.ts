import { prisma } from "../src/lib/prisma";

async function main() {
  const simples = await prisma.perfilTributario.upsert({
    where: { id: "perfil-simples-nacional" },
    update: {},
    create: {
      id: "perfil-simples-nacional",
      nome: "Simples Nacional",
      aliquota: 6,
    },
  });

  const presumido = await prisma.perfilTributario.upsert({
    where: { id: "perfil-lucro-presumido" },
    update: {},
    create: {
      id: "perfil-lucro-presumido",
      nome: "Lucro Presumido",
      aliquota: 11.33,
    },
  });

  await prisma.produto.upsert({
    where: { id: "produto-limpeza-pele" },
    update: {},
    create: {
      id: "produto-limpeza-pele",
      nome: "Limpeza de Pele",
      precoVenda: 180,
      custoMedioMaterial: 25,
      perfilTributarioId: simples.id,
    },
  });

  await prisma.produto.upsert({
    where: { id: "produto-botox" },
    update: {},
    create: {
      id: "produto-botox",
      nome: "Aplicação de Botox",
      precoVenda: 1200,
      custoMedioMaterial: 480,
      perfilTributarioId: presumido.id,
    },
  });

  await prisma.produto.upsert({
    where: { id: "produto-peeling" },
    update: {},
    create: {
      id: "produto-peeling",
      nome: "Peeling Químico",
      precoVenda: 350,
      custoMedioMaterial: 210,
      perfilTributarioId: simples.id,
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
