// Tipos e funções puras (sem Prisma) — seguras para importar de Client
// Components. Cadastro complementar da clínica (Complemento à Home, Parte
// A): tipo de clínica, validação/máscara de CNPJ, opções de logo.

export type TipoClinica = "estetica" | "odontologia" | "medicina" | "fisioterapia" | "psicologia" | "outra";

export const TIPO_CLINICA_LABEL: Record<TipoClinica, string> = {
  estetica: "Estética",
  odontologia: "Odontologia",
  medicina: "Medicina",
  fisioterapia: "Fisioterapia/Reabilitação",
  psicologia: "Psicologia/Terapias",
  outra: "Outra",
};

export const TIPOS_CLINICA: TipoClinica[] = [
  "estetica",
  "odontologia",
  "medicina",
  "fisioterapia",
  "psicologia",
  "outra",
];

export function ehTipoClinica(valor: string): valor is TipoClinica {
  return (TIPOS_CLINICA as string[]).includes(valor);
}

export function somenteDigitos(valor: string) {
  return valor.replace(/\D/g, "");
}

/** Máscara visual "00.000.000/0000-00" — aceita dígitos parciais (digitando). */
export function formatarCnpj(valor: string) {
  const digitos = somenteDigitos(valor).slice(0, 14);
  const partes = [
    digitos.slice(0, 2),
    digitos.slice(2, 5),
    digitos.slice(5, 8),
    digitos.slice(8, 12),
    digitos.slice(12, 14),
  ];
  let resultado = partes[0];
  if (partes[1]) resultado += "." + partes[1];
  if (partes[2]) resultado += "." + partes[2];
  if (partes[3]) resultado += "/" + partes[3];
  if (partes[4]) resultado += "-" + partes[4];
  return resultado;
}

function digitoVerificadorCnpj(digitos: string, pesos: number[]) {
  const soma = pesos.reduce((total, peso, i) => total + peso * Number(digitos[i]), 0);
  const resto = soma % 11;
  return resto < 2 ? 0 : 11 - resto;
}

/**
 * Valida os dígitos verificadores do CNPJ (não consulta nenhuma base
 * externa — só a matemática do próprio número). Rejeita sequências de um
 * único dígito repetido (00000000000000 etc.), que passariam no cálculo
 * dos dígitos mas nunca são CNPJs reais.
 */
export function cnpjValido(valor: string): boolean {
  const digitos = somenteDigitos(valor);
  if (digitos.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(digitos)) return false;

  const d1 = digitoVerificadorCnpj(digitos, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  if (d1 !== Number(digitos[12])) return false;

  const d2 = digitoVerificadorCnpj(digitos, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  if (d2 !== Number(digitos[13])) return false;

  return true;
}

export const LOGO_TAMANHO_MAXIMO_BYTES = 1 * 1024 * 1024; // 1 MB
export const LOGO_TIPOS_ACEITOS = ["image/png", "image/jpeg", "image/svg+xml"] as const;
export const LOGO_EXTENSOES_ACEITAS = [".png", ".jpg", ".jpeg", ".svg"];
