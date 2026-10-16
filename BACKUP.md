# Backup e restauração do banco de dados

## Situação atual (16/10/2026)

Hoje o projeto **não está hospedado em nenhum provedor** e o banco Postgres
roda **localmente**, neste ambiente de desenvolvimento (`docker-compose.yml`
sobe um Postgres 16 em `localhost:5432`). Não existe backup automático
configurado porque não existe, ainda, um banco de produção — só o banco de
desenvolvimento, que qualquer pessoa pode recriar do zero com
`docker compose up -d` + `npx prisma migrate deploy`.

**Antes de receber usuários reais em novembro, é obrigatório escolher um
provedor de Postgres gerenciado com backup automático** — a decisão de qual
provedor usar é sua. Abaixo estão as opções mais simples e baratas.

## Opções recomendadas (decisão do usuário)

| Provedor | Backup automático | Retenção | Custo aproximado* |
|---|---|---|---|
| **Neon** | Sim (point-in-time restore) | Varia por plano — confirmar na página de preços atual | Tem plano gratuito; planos pagos a partir de poucos dólares/mês |
| **Supabase** | Sim (backups diários no plano Pro) | Normalmente configurável; plano Pro costuma cobrir a janela de 14 dias pedida aqui | Plano Pro gira em torno de US$ 25/mês |
| **Render (Postgres gerenciado)** | Sim, nos planos pagos | Depende do plano | Planos pagos a partir de poucos dólares/mês |

\* **Preços e janelas de retenção mudam com frequência — confirme o valor
exato e a retenção de 14 dias na página de preços atual do provedor antes de
decidir.** Não tome esta tabela como cotação final.

Se o plano escolhido **não** oferecer 14 dias de retenção nativamente, a
alternativa mais simples e barata é manter o backup automático diário do
próprio provedor (mesmo que com retenção menor) **e** adicionar um job
agendado (ex.: GitHub Actions com cron, 1x/dia) que roda `pg_dump` e sobe o
arquivo para um storage separado (ex.: S3/R2, few cents/mês para poucos MB)
com uma rotina simples de apagar arquivos com mais de 14 dias.

## Como restaurar um backup

### Se o provedor oferece restauração própria (Neon/Supabase/Render)
Use o botão/comando de restore do painel do provedor, apontando para o
snapshot do dia desejado. Siga a documentação do provedor — normalmente é
"point-and-click" e não precisa de `pg_dump` manual.

### Restauração manual via `pg_dump`/`pg_restore` (backup próprio ou archive baixado)

```bash
# 1. Gerar o dump (backup) a partir do banco de produção:
pg_dump "$DATABASE_URL" -Fc -f aivy-backup.dump

# 2. Criar um banco NOVO e separado para restaurar (nunca restaure por
#    cima do banco de produção sem necessidade):
createdb -h <host> -U <usuario> aivy_restaurado

# 3. Restaurar o dump nesse banco novo:
pg_restore -d "<url-do-banco-aivy_restaurado>" --no-owner --no-privileges aivy-backup.dump

# 4. Conferir os dados (contagem de linhas nas tabelas principais) antes de
#    apontar a aplicação para o banco restaurado:
psql "<url>" -c 'SELECT count(*) FROM "Usuario";'
psql "<url>" -c 'SELECT count(*) FROM "Clinica";'

# 5. Só depois de validar, trocar a variável DATABASE_URL da aplicação para
#    o banco restaurado (ou renomear os bancos no servidor).
```

## Teste real de restauração (feito nesta sessão, ambiente de desenvolvimento)

Para provar que o processo funciona de ponta a ponta, foi feito um teste real:

1. `pg_dump` do banco de desenvolvimento atual (`aivy`) → arquivo de 68 KB.
2. Criado um banco **separado** (`aivy_restore_drill`), sem nenhuma relação
   com o banco original.
3. `pg_restore` do dump nesse banco novo.
4. Comparação de integridade entre o banco original e o restaurado:

   | Verificação | Original | Restaurado |
   |---|---|---|
   | Linhas em `Usuario` | 26 | 26 |
   | Linhas em `Clinica` | 14 | 14 |
   | Linhas em `Cliente` | 10 | 10 |
   | Linhas em `ConsultorAcesso` | 3 | 3 |
   | Linhas em `CustoDeVida` | 1 | 1 |
   | Checksum MD5 de nome+e-mail de todos os usuários | `a8f0743bb7e164154e54939d7a678d69` | `a8f0743bb7e164154e54939d7a678d69` (idêntico) |
   | Valores sentinela de teste (`preciso`/`quero`) | `12345` / `15000` | `12345` / `15000` (idêntico) |

   **Resultado: restauração 100% íntegra — nenhum dado perdido ou alterado.**
5. O banco de teste (`aivy_restore_drill`) foi apagado ao final do teste,
   por ser só um banco descartável de verificação.

## Pendência para antes de novembro

- [ ] Escolher o provedor de Postgres de produção (decisão do usuário).
- [ ] Confirmar que o plano escolhido tem backup diário com retenção de
      pelo menos 14 dias (ou montar o job alternativo descrito acima).
- [ ] Repetir este mesmo teste de restauração contra o banco de produção
      real, uma vez que ele existir.
