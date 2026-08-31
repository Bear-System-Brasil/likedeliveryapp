import { NextRequest, NextResponse } from "next/server";
import { decodeJwt, isExpired } from "@/lib/jwt";

const SESSION_COOKIE = "like_session";

/** Config central: rota nova entra aqui e já fica coberta. */
const PROTECTED: { prefix: string; roles?: string[] }[] = [
  // Pedidos do cliente logado: GET /order/customer/me é exclusivo de role
  // client no backend, então abrir esta rota pra outras roles não resolveria
  // nada — elas continuam usando o carrinho/checkout normalmente, só o
  // histórico de pedidos é que é uma tela de cliente de verdade.
  { prefix: "/orders", roles: ["client"] },
  { prefix: "/profile" },
  { prefix: "/menu-management", roles: ["owner", "admin", "manager"] },
  { prefix: "/category-management", roles: ["owner", "admin", "manager"] },
  {
    prefix: "/order-management",
    roles: ["owner", "admin", "manager", "cook"],
  },
  { prefix: "/kitchen", roles: ["owner", "admin", "manager", "cook"] },
  { prefix: "/company-profile", roles: ["owner", "admin"] },
  { prefix: "/financial-management", roles: ["owner", "admin", "financial"] },
  { prefix: "/team-management", roles: ["owner", "admin", "manager"] },
  { prefix: "/delivery-dashboard", roles: ["delivery"] },
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const rule = PROTECTED.find(
    (r) => pathname === r.prefix || pathname.startsWith(`${r.prefix}/`),
  );
  if (!rule) return NextResponse.next();

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const payload = token ? decodeJwt(token) : null;

  if (!payload || isExpired(payload)) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    url.searchParams.set("openAuth", "true");
    return NextResponse.redirect(url);
  }

  if (rule.roles && !rule.roles.includes(payload.role)) {
    const url = request.nextUrl.clone();
    url.pathname = "/unauthorized";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/orders/:path*",
    "/profile/:path*",
    "/menu-management/:path*",
    "/category-management/:path*",
    "/order-management/:path*",
    "/kitchen/:path*",
    "/company-profile/:path*",
    "/financial-management/:path*",
    "/team-management/:path*",
    "/delivery-dashboard/:path*",
  ],
};
