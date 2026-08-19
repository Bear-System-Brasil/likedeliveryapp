import { NextResponse } from "next/server";
import { decodeJwt, isExpired } from "@/lib/jwt";
import { getSessionToken } from "@/lib/session";

export const dynamic = "force-dynamic";

/**
 * O socket.io conecta direto no NestJS (WS nao passa pelo proxy HTTP do
 * Next), entao precisa do JWT cru pra autenticar o handshake. Este endpoint
 * le o cookie httpOnly no servidor e devolve o token só pra esse uso - ele
 * nao fica em localStorage nem no Zustand, so em memoria no componente que
 * abre o socket.
 */
export async function GET() {
  const token = await getSessionToken();
  const payload = token ? decodeJwt(token) : null;

  if (!token || !payload || isExpired(payload)) {
    return NextResponse.json({ token: null }, { status: 401 });
  }

  return NextResponse.json({ token });
}
