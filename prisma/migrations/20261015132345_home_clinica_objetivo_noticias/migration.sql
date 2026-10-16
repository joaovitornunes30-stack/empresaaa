-- Complemento à Home: cadastro da clínica (Parte A), objetivo principal e
-- checklist (Parte B), notícias (Parte C). Tudo aditivo e não-destrutivo.

-- Parte A + B: campos novos em Clinica, todos opcionais.
ALTER TABLE "Clinica"
  ADD COLUMN "logoUrl" TEXT,
  ADD COLUMN "tipoClinica" TEXT,
  ADD COLUMN "cnpj" TEXT,
  ADD COLUMN "cep" TEXT,
  ADD COLUMN "logradouro" TEXT,
  ADD COLUMN "numero" TEXT,
  ADD COLUMN "complemento" TEXT,
  ADD COLUMN "bairro" TEXT,
  ADD COLUMN "cidade" TEXT,
  ADD COLUMN "uf" TEXT,
  ADD COLUMN "objetivoPrincipal" TEXT,
  ADD COLUMN "objetivoTexto" TEXT,
  ADD COLUMN "checklistDispensada" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "abriuMargemProduto" BOOLEAN NOT NULL DEFAULT false;

-- Parte C: tabela global de notícias — sem clinicaId, não é isolada por
-- clínica (ver MODELOS_COM_CLINICA em lib/prisma.ts).
CREATE TABLE "Noticia" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "resumo" TEXT NOT NULL,
    "fonteNome" TEXT NOT NULL,
    "link" TEXT NOT NULL,
    "dataPublicacao" TIMESTAMP(3) NOT NULL,
    "categoria" TEXT NOT NULL,
    "segmentos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "destaque" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'rascunho',
    "exemplo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Noticia_pkey" PRIMARY KEY ("id")
);

-- Conta de plataforma para administrar notícias — papel "adminPlataforma",
-- sem clínica (clinicaId nulo, mesmo mecanismo já usado por "consultor").
-- E-mail distinto do admin@aivy.local existente (esse continua dono da
-- Clínica Padrão) para não quebrar o login de demonstração já em uso.
INSERT INTO "Usuario" ("id", "nome", "email", "senhaHash", "papel", "ativo", "clinicaId", "createdAt")
VALUES (
  'usuario-admin-plataforma',
  'Administrador da Plataforma',
  'admin-plataforma@aivy.local',
  -- bcrypt de "aivy1234" (mesma senha de demonstração usada no resto do preview)
  '$2b$10$PSv4hfa1mQmzwYYqJPBLJuCLbTnuaR6tkftrT9fUczeZPdGzwa1Ea',
  'adminPlataforma',
  true,
  NULL,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("email") DO NOTHING;

-- 4 notícias de exemplo (exemplo=true, sempre com o selo "Exemplo — dado
-- fictício" na tela) — publicadas para já demonstrar o feed e os filtros.
INSERT INTO "Noticia" ("id", "titulo", "resumo", "fonteNome", "link", "dataPublicacao", "categoria", "segmentos", "destaque", "status", "exemplo", "createdAt", "updatedAt")
VALUES
(
  'noticia-exemplo-1',
  'Novas regras de parcelamento de dívidas tributárias entram em vigor',
  'Mudança afeta como clínicas podem renegociar débitos fiscais em atraso, com prazos mais longos para quem fatura até determinado teto anual.',
  'Jornal Fictício de Negócios',
  'https://exemplo.invalid/noticia-1',
  CURRENT_TIMESTAMP - INTERVAL '2 days',
  'impostos_legislacao',
  ARRAY['todos']::TEXT[],
  true,
  'publicado',
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
),
(
  'noticia-exemplo-2',
  'Conselho Federal de Odontologia atualiza normas de prontuário eletrônico',
  'Nova resolução (fictícia) exige adaptações no registro digital de atendimentos odontológicos a partir do próximo ano.',
  'Gazeta Fictícia da Saúde',
  'https://exemplo.invalid/noticia-2',
  CURRENT_TIMESTAMP - INTERVAL '5 days',
  'regulacao',
  ARRAY['odontologia']::TEXT[],
  false,
  'publicado',
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
),
(
  'noticia-exemplo-3',
  'Procura por procedimentos estéticos não invasivos cresce entre clínicas pequenas',
  'Levantamento fictício aponta aumento na busca por protocolos de manutenção, com clínicas ajustando pacotes de fidelização.',
  'Revista Fictícia de Estética',
  'https://exemplo.invalid/noticia-3',
  CURRENT_TIMESTAMP - INTERVAL '1 days',
  'mercado_tendencias',
  ARRAY['estetica']::TEXT[],
  false,
  'publicado',
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
),
(
  'noticia-exemplo-4',
  'Como separar o caixa da clínica das finanças pessoais do sócio',
  'Guia fictício reúne práticas de gestão para evitar que retiradas informais comprometam o capital de giro do negócio.',
  'Portal Fictício de Gestão',
  'https://exemplo.invalid/noticia-4',
  CURRENT_TIMESTAMP - INTERVAL '8 days',
  'gestao_financas',
  ARRAY['todos']::TEXT[],
  false,
  'publicado',
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("id") DO NOTHING;
