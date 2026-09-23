export function ResumoDoMes({ linhas }: { linhas: string[] }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <ul className="flex flex-col gap-2.5 text-sm text-foreground/80">
        {linhas.map((linha, index) => (
          <li key={index} className="flex gap-2.5">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            <span>{linha}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
