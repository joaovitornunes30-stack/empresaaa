import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Padrão do Next.js é 1 MB — exatamente o limite que lib/clinica-cadastro.ts
      // (LOGO_TAMANHO_MAXIMO_BYTES) já valida com uma mensagem amigável. Sem
      // esta folga, o próprio Next.js rejeitaria o upload antes da nossa
      // validação rodar, com um erro genérico em vez da mensagem clara.
      bodySizeLimit: "2mb",
    },
  },
};

export default nextConfig;
