export type ModulosAtivos = {
  planos: boolean;
  protocolo: boolean;
  indicacoes: boolean;
};

export const MODULOS_PADRAO: ModulosAtivos = {
  planos: false,
  protocolo: false,
  indicacoes: false,
};

/**
 * Lê Clinica.modulosAtivos (campo Json, sem garantia de formato em tempo de
 * compilação) de forma defensiva — qualquer chave ausente ou de tipo
 * inesperado cai no padrão (desligado), nunca inventa um módulo ligado.
 */
export function lerModulosAtivos(valor: unknown): ModulosAtivos {
  if (!valor || typeof valor !== "object" || Array.isArray(valor)) {
    return { ...MODULOS_PADRAO };
  }
  const v = valor as Record<string, unknown>;
  return {
    planos: typeof v.planos === "boolean" ? v.planos : MODULOS_PADRAO.planos,
    protocolo: typeof v.protocolo === "boolean" ? v.protocolo : MODULOS_PADRAO.protocolo,
    indicacoes: typeof v.indicacoes === "boolean" ? v.indicacoes : MODULOS_PADRAO.indicacoes,
  };
}
