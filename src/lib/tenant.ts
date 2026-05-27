/**
 * Extrai o slug do tenant a partir do hostname.
 *
 * Exemplos:
 *   sopinha.lavaapp.com.br  → "sopinha"
 *   localhost               → "demo"   (desenvolvimento)
 *   lavaapp.com.br          → null     (landing / admin)
 */
export function getTenantSlug(hostname: string): string | null {
  // remove porta se houver
  const host = hostname.split(":")[0];

  // localhost ou domínio raiz — sem tenant
  if (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "lavaapp.com.br" ||
    host === "www.lavaapp.com.br"
  ) {
    return null;
  }

  const parts = host.split(".");
  // precisa ter pelo menos subdomínio.domínio.tld
  if (parts.length >= 3) {
    return parts[0];
  }

  // Vercel preview: slug-lavaapp-xxx.vercel.app → trata como demo
  if (host.endsWith(".vercel.app")) {
    return null;
  }

  return null;
}
