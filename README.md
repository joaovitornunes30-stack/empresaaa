# Aivy — Gestão Financeira para Clínicas

MVP de sistema de gestão financeira para clínicas. Stack: Next.js (TypeScript,
App Router) + Tailwind CSS v4 + Prisma ORM + PostgreSQL.

Nesta primeira etapa está implementada a aba **Produtos**: cadastro de
produtos, cálculo automático de margem de contribuição e gerenciamento de
Perfis Tributários. A navegação já reserva espaço para as próximas abas
(Análise, Clientes, Financeiro, Retiradas).

## Pré-requisitos

- Node.js 20+
- PostgreSQL (local, Docker, ou um serviço gerenciado)

## Rodando o projeto localmente

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Configure a variável de ambiente `DATABASE_URL`. Copie o arquivo de
   exemplo:

   ```bash
   cp .env.example .env
   ```

   Se preferir subir um PostgreSQL local via Docker (recomendado), rode:

   ```bash
   docker compose up -d
   ```

   Isso sobe um Postgres em `localhost:5432` com usuário/senha/banco `aivy`,
   já compatível com o `DATABASE_URL` padrão do `.env.example`.

3. Rode as migrations e (opcionalmente) popule o banco com dados de exemplo:

   ```bash
   npm run db:migrate
   npm run db:seed
   ```

4. Inicie o servidor de desenvolvimento:

   ```bash
   npm run dev
   ```

5. Acesse [http://localhost:3000](http://localhost:3000) (a rota `/` redireciona
   para `/produtos`).

## Scripts disponíveis

| Script              | Descrição                                         |
| ------------------- | -------------------------------------------------- |
| `npm run dev`        | Sobe o servidor de desenvolvimento (Turbopack)      |
| `npm run build`      | Build de produção                                   |
| `npm run start`      | Sobe o servidor de produção (após `build`)          |
| `npm run lint`       | Roda o ESLint                                       |
| `npm run db:migrate` | Cria/aplica migrations do Prisma (`migrate dev`)    |
| `npm run db:seed`    | Popula o banco com perfis e produtos de exemplo     |
| `npm run db:studio`  | Abre o Prisma Studio para inspecionar os dados       |
| `npm run db:generate`| Regenera o Prisma Client após alterar o schema      |

## Modelo de dados

O schema Prisma (`prisma/schema.prisma`) define:

- `PerfilTributario`: perfis com nome e alíquota (%).
- `Produto`: nome, preço de venda, custo médio de material e o perfil
  tributário vinculado.

A margem de contribuição é calculada em `src/lib/calculos.ts`:

```
margem = precoVenda - custoMedioMaterial - (precoVenda * aliquota / 100)
```

## Estrutura do projeto

```
prisma/               schema, migrations e seed
src/app/produtos/      página de Produtos + Server Actions
src/components/        Sidebar, tabela de produtos, modais de cadastro
src/lib/                cliente Prisma e cálculo de margem
```

## Notas técnicas

- Este projeto usa **Prisma 7**, que move a `DATABASE_URL` para
  `prisma.config.ts` e usa driver adapters (`@prisma/adapter-pg`) em vez do
  `url` dentro do `schema.prisma`.
- Mutações (criar produto, criar/editar perfil tributário) são feitas via
  Server Actions (`src/app/produtos/actions.ts`), sem necessidade de uma API
  REST separada.
