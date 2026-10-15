"use client";

import { useActionState, useState, useTransition } from "react";
import {
  salvarNoticia,
  alternarPublicacaoNoticia,
  excluirNoticia,
  type ActionState,
} from "@/app/(app)/noticias/actions";
import { Modal } from "@/components/ui/modal";
import { CATEGORIA_LABEL, CATEGORIAS, RESUMO_NOTICIA_MAX, type NoticiaResumo } from "@/lib/noticias";
import { TIPOS_CLINICA, TIPO_CLINICA_LABEL } from "@/lib/clinica-cadastro";

const initialState: ActionState = { error: null };
const inputClass =
  "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";
const labelClass = "mb-1.5 block text-sm font-medium text-foreground/80";

function dataParaInput(data: Date) {
  return new Date(data).toISOString().slice(0, 10);
}

function FormularioNoticia({ noticia, onFechar }: { noticia: NoticiaResumo | null; onFechar: () => void }) {
  const [state, formAction, pending] = useActionState(salvarNoticia, initialState);
  const [resumo, setResumo] = useState(noticia?.resumo ?? "");
  const [segmentosSelecionados, setSegmentosSelecionados] = useState<string[]>(noticia?.segmentos ?? ["todos"]);

  function alternarSegmento(valor: string) {
    setSegmentosSelecionados((atual) => {
      if (valor === "todos") return ["todos"];
      const semTodos = atual.filter((s) => s !== "todos");
      return semTodos.includes(valor) ? semTodos.filter((s) => s !== valor) : [...semTodos, valor];
    });
  }

  return (
    <Modal title={noticia ? "Editar notícia" : "Nova notícia"} onClose={onFechar}>
      <form
        action={(formData) => {
          formData.set("segmentos", "");
          segmentosSelecionados.forEach((s) => formData.append("segmentos", s));
          formAction(formData);
        }}
        className="flex flex-col gap-4"
      >
        {noticia && <input type="hidden" name="id" value={noticia.id} />}

        <div>
          <label htmlFor="titulo" className={labelClass}>
            Título
          </label>
          <input id="titulo" name="titulo" type="text" required defaultValue={noticia?.titulo} className={inputClass} />
        </div>

        <div>
          <label htmlFor="resumo" className={labelClass}>
            Resumo (escrito por vocês — nunca cole o texto da matéria)
          </label>
          <textarea
            id="resumo"
            name="resumo"
            required
            rows={3}
            value={resumo}
            onChange={(event) => setResumo(event.target.value.slice(0, RESUMO_NOTICIA_MAX))}
            maxLength={RESUMO_NOTICIA_MAX}
            className={inputClass}
          />
          <p className="mt-1 text-right text-xs text-foreground/40">
            {resumo.length}/{RESUMO_NOTICIA_MAX}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="fonteNome" className={labelClass}>
              Nome da fonte
            </label>
            <input id="fonteNome" name="fonteNome" type="text" required defaultValue={noticia?.fonteNome} className={inputClass} />
          </div>
          <div>
            <label htmlFor="dataPublicacao" className={labelClass}>
              Data de publicação
            </label>
            <input
              id="dataPublicacao"
              name="dataPublicacao"
              type="date"
              required
              defaultValue={noticia ? dataParaInput(noticia.dataPublicacao) : dataParaInput(new Date())}
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label htmlFor="link" className={labelClass}>
            Link externo
          </label>
          <input id="link" name="link" type="url" required defaultValue={noticia?.link} placeholder="https://..." className={inputClass} />
        </div>

        <div>
          <label htmlFor="categoria" className={labelClass}>
            Categoria
          </label>
          <select id="categoria" name="categoria" required defaultValue={noticia?.categoria ?? ""} className={inputClass}>
            <option value="" disabled>
              Selecione
            </option>
            {CATEGORIAS.map((categoria) => (
              <option key={categoria} value={categoria}>
                {CATEGORIA_LABEL[categoria]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <p className={labelClass}>Segmentos (tipos de clínica que veem esta notícia)</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => alternarSegmento("todos")}
              className={`rounded-full border px-3 py-1 text-xs font-medium ${
                segmentosSelecionados.includes("todos")
                  ? "border-primary bg-primary/10 text-primary-dark"
                  : "border-border text-foreground/60"
              }`}
            >
              Todos
            </button>
            {TIPOS_CLINICA.map((tipo) => (
              <button
                key={tipo}
                type="button"
                onClick={() => alternarSegmento(tipo)}
                className={`rounded-full border px-3 py-1 text-xs font-medium ${
                  segmentosSelecionados.includes(tipo)
                    ? "border-primary bg-primary/10 text-primary-dark"
                    : "border-border text-foreground/60"
                }`}
              >
                {TIPO_CLINICA_LABEL[tipo]}
              </button>
            ))}
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-foreground/80">
          <input type="checkbox" name="destaque" defaultChecked={noticia?.destaque} className="h-4 w-4" />
          Destaque (aparece primeiro na listagem)
        </label>

        {state.error && <p className="rounded-xl bg-warn-bg px-3 py-2 text-sm text-warn">{state.error}</p>}

        <div className="flex justify-end gap-3">
          <button type="button" onClick={onFechar} className="rounded-xl px-4 py-2 text-sm font-medium text-foreground/60 hover:bg-foreground/5">
            Cancelar
          </button>
          <button
            type="submit"
            disabled={pending}
            className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-dark disabled:opacity-60"
          >
            {pending ? "Salvando..." : "Salvar como rascunho"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function ImportarJsonBloco() {
  const [texto, setTexto] = useState("");
  const [resultado, setResultado] = useState<{ importadas: number; total: number; falhas: { indice: number; motivo: string }[] } | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function importar() {
    setErro(null);
    setResultado(null);
    let lista: unknown;
    try {
      lista = JSON.parse(texto);
    } catch {
      setErro("JSON inválido — confira a sintaxe.");
      return;
    }
    setEnviando(true);
    try {
      const resposta = await fetch("/api/admin/noticias/importar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(lista),
      });
      const dados = await resposta.json();
      if (!resposta.ok) {
        setErro(dados.error ?? "Falha ao importar.");
        return;
      }
      setResultado(dados);
    } catch {
      setErro("Não foi possível conectar à rota de importação.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <h3 className="font-display text-sm font-semibold text-foreground">Importar JSON</h3>
      <p className="mt-1 text-xs text-foreground/60">
        Cole uma lista de notícias — todas entram como rascunho. Ver formato em{" "}
        <code className="rounded bg-foreground/5 px-1">src/app/api/admin/noticias/importar/README.md</code>.
      </p>
      <textarea
        value={texto}
        onChange={(event) => setTexto(event.target.value)}
        rows={6}
        placeholder="[ { &quot;titulo&quot;: ..., &quot;resumo&quot;: ..., ... } ]"
        className="mt-3 w-full rounded-xl border border-border bg-background px-3 py-2 font-mono text-xs text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
      {erro && <p className="mt-2 rounded-xl bg-warn-bg px-3 py-2 text-sm text-warn">{erro}</p>}
      {resultado && (
        <div className="mt-2 rounded-xl bg-good-bg px-3 py-2 text-sm text-good">
          {resultado.importadas} de {resultado.total} importadas como rascunho.
          {resultado.falhas.length > 0 && (
            <ul className="mt-1 list-disc pl-5 text-xs text-foreground/70">
              {resultado.falhas.map((f) => (
                <li key={f.indice}>
                  Item {f.indice}: {f.motivo}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      <div className="mt-3 flex justify-end">
        <button
          type="button"
          onClick={importar}
          disabled={enviando || !texto.trim()}
          className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-dark disabled:opacity-60"
        >
          {enviando ? "Importando..." : "Importar"}
        </button>
      </div>
    </div>
  );
}

export function GerenciarNoticias({ noticias }: { noticias: NoticiaResumo[] }) {
  const [editando, setEditando] = useState<NoticiaResumo | null | "nova">(null);
  const [pending, startTransition] = useTransition();

  return (
    <main className="mx-auto max-w-4xl px-6 py-10 sm:px-10">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Gerenciar notícias</h1>
          <p className="mt-1 text-sm text-foreground/60">Visível só para o papel adminPlataforma.</p>
        </div>
        <button
          type="button"
          onClick={() => setEditando("nova")}
          className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-dark"
        >
          Nova notícia
        </button>
      </header>

      <div className="mb-8 flex flex-col gap-3">
        {noticias.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border bg-surface p-8 text-center text-sm text-foreground/60">
            Nenhuma notícia cadastrada ainda.
          </p>
        ) : (
          noticias.map((noticia) => (
            <div key={noticia.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-4">
              <div className="min-w-0">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
                      noticia.status === "publicado" ? "bg-good-bg text-good" : "bg-foreground/10 text-foreground/60"
                    }`}
                  >
                    {noticia.status === "publicado" ? "Publicado" : "Rascunho"}
                  </span>
                  {noticia.destaque && (
                    <span className="rounded-full bg-accent-bg px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-accent">
                      Destaque
                    </span>
                  )}
                  {noticia.exemplo && (
                    <span className="rounded-full bg-foreground/10 px-2.5 py-0.5 text-[11px] font-semibold text-foreground/60">
                      Exemplo — dado fictício
                    </span>
                  )}
                </div>
                <p className="truncate font-medium text-foreground">{noticia.titulo}</p>
                <p className="truncate text-xs text-foreground/50">{noticia.fonteNome}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button type="button" onClick={() => setEditando(noticia)} className="rounded-xl px-3 py-1.5 text-xs font-medium text-foreground/70 hover:bg-foreground/5">
                  Editar
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => startTransition(() => alternarPublicacaoNoticia(noticia.id))}
                  className="rounded-xl px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10 disabled:opacity-60"
                >
                  {noticia.status === "publicado" ? "Despublicar" : "Publicar"}
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => startTransition(() => excluirNoticia(noticia.id))}
                  className="rounded-xl px-3 py-1.5 text-xs font-medium text-warn hover:bg-warn-bg disabled:opacity-60"
                >
                  Excluir
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <ImportarJsonBloco />

      {editando && (
        <FormularioNoticia noticia={editando === "nova" ? null : editando} onFechar={() => setEditando(null)} />
      )}
    </main>
  );
}
