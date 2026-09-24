import { prisma } from "../src/lib/prisma";

async function main() {
  // Nomes de exemplo genéricos, de propósito: o nome do perfil é texto livre
  // definido pelo usuário (não um regime fixo), já que a Reforma Tributária
  // pode mudar essas nomenclaturas a qualquer momento.
  const perfilPadrao = await prisma.perfilTributario.upsert({
    where: { id: "perfil-exemplo-padrao" },
    update: {},
    create: {
      id: "perfil-exemplo-padrao",
      nome: "Perfil Padrão",
      aliquota: 6,
    },
  });

  const perfilAvancado = await prisma.perfilTributario.upsert({
    where: { id: "perfil-exemplo-avancado" },
    update: {},
    create: {
      id: "perfil-exemplo-avancado",
      nome: "Perfil Avançado",
      aliquota: 11.33,
    },
  });

  await prisma.produto.upsert({
    where: { id: "produto-limpeza-pele" },
    update: {},
    create: {
      id: "produto-limpeza-pele",
      nome: "Limpeza de Pele",
      precoVenda: 240, // R$/hora (procedimento de 45 min = R$ 180 no total)
      custoMedioMaterial: 25,
      duracaoMinutos: 45,
      comissaoTipo: "percentual",
      comissaoValor: 10,
      divisorCustoEspaco: 1,
      perfilTributarioId: perfilPadrao.id,
    },
  });

  await prisma.produto.upsert({
    where: { id: "produto-botox" },
    update: {},
    create: {
      id: "produto-botox",
      nome: "Aplicação de Botox",
      precoVenda: 2400, // R$/hora (procedimento de 30 min = R$ 1.200 no total)
      custoMedioMaterial: 480,
      duracaoMinutos: 30,
      comissaoTipo: "fixo",
      comissaoValor: 100,
      divisorCustoEspaco: 1,
      perfilTributarioId: perfilAvancado.id,
    },
  });

  await prisma.produto.upsert({
    where: { id: "produto-peeling" },
    update: {},
    create: {
      id: "produto-peeling",
      nome: "Peeling Químico",
      precoVenda: 350, // R$/hora (procedimento de 60 min = R$ 350 no total)
      custoMedioMaterial: 210,
      duracaoMinutos: 60,
      comissaoTipo: "percentual",
      comissaoValor: 15,
      divisorCustoEspaco: 2,
      perfilTributarioId: perfilPadrao.id,
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
