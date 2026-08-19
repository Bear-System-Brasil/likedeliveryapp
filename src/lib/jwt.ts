export interface JwtPayload {
  sub: string;
  role: string;
  companyId: string | null;
  exp?: number;
}

/**
 * Decodifica o payload do JWT SEM validar assinatura.
 * Serve só para UX (redirect no middleware, companyId no store).
 * A autorização real continua no NestJS. Usa atob — funciona no edge
 * (middleware) e no node.
 */
export function decodeJwt(token: string): JwtPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64.padEnd(b64.length + ((4 - (b64.length % 4)) % 4), "=");

    return JSON.parse(atob(padded)) as JwtPayload;
  } catch {
    return null;
  }
}

export function isExpired(payload: JwtPayload | null): boolean {
  if (!payload?.exp) return false; // token do fluxo por telefone não tem exp
  return payload.exp * 1000 < Date.now();
}
