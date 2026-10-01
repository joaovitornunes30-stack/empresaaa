function formatarDataHora(data: Date) {
  return data.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export function ConsultorBanner({
  nomeConsultor,
  dataAcesso,
}: {
  nomeConsultor: string;
  dataAcesso: Date;
}) {
  return (
    <div className="flex items-center gap-2 border-b border-warn/30 bg-warn-bg px-6 py-2 text-sm font-medium text-warn">
      <span
        className="h-2 w-2 shrink-0 rounded-full bg-warn"
        aria-hidden="true"
      />
      Consultor {nomeConsultor} visualizou em {formatarDataHora(dataAcesso)}
    </div>
  );
}
