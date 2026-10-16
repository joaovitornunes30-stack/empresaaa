"use client";

import { Fragment, useState } from "react";
import {
  calcularSaldoDevedor,
  contarParcelasPagas,
  formatarData,
  formatarMoeda,
  listarParcelasDaDivida,
  parcelaVencida,
  type DividaComParcelas,
} from "@/lib/financeiro";

type Divida = DividaComParcelas & {
  id: string;
  dataVencimento: Date;
  descricao: string | null;
};

export function TodasDividasTable({ dividas }: { dividas: Divida[] }) {
  const [expandidas, setExpandidas] = useState<Set<string>>(new Set());

  function alternarExpandida(id: string) {
    setExpandidas((atual) => {
      const proximo = new Set(atual);
      if (proximo.has(id)) proximo.delete(id);
      else proximo.add(id);
      return proximo;
    });
  }

  if (dividas.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-surface p-10 text-center">
        <p className="text-sm text-foreground/60">
          Nenhuma dívida cadastrada ainda.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-background/60 text-xs uppercase tracking-wide text-foreground/50">
              <th className="px-5 py-3 font-medium">Descrição</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Valor total</th>
              <th className="px-5 py-3 font-medium">Saldo devedor</th>
              <th className="px-5 py-3 font-medium">Parcelas</th>
            </tr>
          </thead>
          <tbody>
            {dividas.map((divida) => {
              const saldoDevedor = calcularSaldoDevedor(divida);
              const { pagas, total } = contarParcelasPagas(divida);
              const emPagamento = divida.status === "em_pagamento";
              const expandida = expandidas.has(divida.id);

              return (
                <Fragment key={divida.id}>
                  <tr className="border-b border-border last:border-0">
                    <td className="px-5 py-4 font-medium text-foreground">
                      {divida.descricao ?? "—"}
                      <p className="text-xs font-normal text-foreground/50">
                        Vencimento {formatarData(divida.dataVencimento)}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          emPagamento
                            ? "bg-good-bg text-good"
                            : "bg-foreground/5 text-foreground/70"
                        }`}
                      >
                        {emPagamento ? "Em pagamento" : "Não estruturada"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-foreground/70">
                      {formatarMoeda(divida.valor)}
                    </td>
                    <td className="px-5 py-4 font-medium text-foreground">
                      {formatarMoeda(saldoDevedor)}
                    </td>
                    <td className="px-5 py-4 text-foreground/70">
                      {emPagamento ? (
                        <button
                          type="button"
                          onClick={() => alternarExpandida(divida.id)}
                          className="font-medium text-primary hover:text-primary-dark"
                        >
                          {pagas}/{total} {expandida ? "▲" : "▼"}
                        </button>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                  {emPagamento && expandida && (
                    <tr className="border-b border-border last:border-0">
                      <td colSpan={5} className="bg-background/60 px-5 py-4">
                        <ParcelasDaDivida divida={divida} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ParcelasDaDivida({ divida }: { divida: Divida }) {
  const parcelas = listarParcelasDaDivida(divida);

  return (
    <ul className="flex flex-col gap-2">
      {parcelas.map((parcela) => {
        const vencida = parcelaVencida(parcela);
        return (
          <li
            key={parcela.numeroParcela}
            className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-2"
          >
            <span className="text-foreground/80">
              Parcela {parcela.numeroParcela} · {formatarData(parcela.dataVencimento)}
            </span>
            <span className="flex items-center gap-2">
              <span className="font-medium text-foreground">
                {formatarMoeda(parcela.valor)}
              </span>
              {parcela.status === "pago" ? (
                <span className="rounded-full bg-good-bg px-2 py-0.5 text-xs font-semibold text-good">
                  Paga
                </span>
              ) : vencida ? (
                <span className="rounded-full bg-warn-bg px-2 py-0.5 text-xs font-semibold text-warn">
                  Vencida
                </span>
              ) : (
                <span className="rounded-full bg-foreground/5 px-2 py-0.5 text-xs font-semibold text-foreground/70">
                  Pendente
                </span>
              )}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
