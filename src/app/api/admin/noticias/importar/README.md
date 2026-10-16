# Importar notícias — `POST /api/admin/noticias/importar`

Prepara uma futura atualização semanal automática de notícias. **Nunca
publica sozinha**: toda notícia importada entra como rascunho — alguém com
papel `adminPlataforma` precisa revisar e publicar manualmente em
`/noticias`.

## Autenticação

Uma das duas, em `Authorization: Bearer <valor>`:

- Token de ambiente: defina `NOTICIAS_IMPORT_TOKEN` e envie esse mesmo valor.
- Sessão de `adminPlataforma` (cookie de login) — útil para importar
  colando a lista manualmente, sem precisar do token.

Sem nenhuma das duas, a rota responde `401`.

## Corpo da requisição

Um array JSON de objetos, cada um com estes campos:

```json
[
  {
    "titulo": "Novas regras de parcelamento tributário",
    "resumo": "Resumo curto escrito por vocês — nunca cole o texto da matéria original. Até 280 caracteres.",
    "fonteNome": "Nome do veículo/fonte",
    "link": "https://exemplo.com/materia",
    "dataPublicacao": "2026-10-01T00:00:00.000Z",
    "categoria": "impostos_legislacao",
    "segmentos": ["todos"],
    "destaque": false
  }
]
```

| Campo            | Tipo                                                                              | Obrigatório | Observação                                   |
| ----------------- | ---------------------------------------------------------------------------------- | ----------- | --------------------------------------------- |
| `titulo`         | string                                                                            | sim         |                                                |
| `resumo`         | string, até 280 caracteres                                                       | sim         | Resumo próprio, nunca o texto da matéria.     |
| `fonteNome`      | string                                                                            | sim         |                                                |
| `link`           | string (URL válida)                                                              | sim         | Abre em nova aba com `rel="noopener noreferrer"`. |
| `dataPublicacao` | string de data (ISO 8601)                                                        | sim         |                                                |
| `categoria`      | `"gestao_financas"` \| `"impostos_legislacao"` \| `"regulacao"` \| `"mercado_tendencias"` | sim    |                                                |
| `segmentos`      | array de strings: `"todos"` ou tipo de clínica (`"estetica"`, `"odontologia"`, `"medicina"`, `"fisioterapia"`, `"psicologia"`, `"outra"`) | sim | Pelo menos 1 item. |
| `destaque`       | boolean                                                                           | não (padrão `false`) | Aparece primeiro na listagem.       |

## Resposta

```json
{ "importadas": 3, "total": 4, "falhas": [{ "indice": 2, "motivo": "Informe um link válido." }] }
```

- `importadas`: quantas entraram como rascunho.
- `falhas`: índice (posição no array enviado) e motivo de cada item que não passou na validação — os válidos ainda assim são importados.
