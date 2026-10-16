// Textos puros, sem nenhum import de Node/Prisma/next-headers — seguro para
// importar tanto de Server Actions (lib/recuperacao-senha.ts) quanto de
// Client Components (components/conta/esqueci-senha-form.tsx). Fica fora de
// actions.ts de propósito: um arquivo "use server" só pode exportar Server
// Actions — uma constante comum ali quebra a análise de exports do módulo.
export const MENSAGEM_GENERICA_RECUPERACAO =
  "Se este e-mail estiver cadastrado, enviamos um link de redefinição de senha para ele.";
