import { Facebook, Instagram, Linkedin, Twitter } from "lucide-react";
import Link from "next/link";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-5 border-b border-gray-700 py-5 md:grid-cols-[1.5fr_1fr_1fr] md:gap-10">
          <div className="space-y-3">
            <h3 className="bg-gradient-to-r from-orange-400 to-amber-500 bg-clip-text text-xl font-bold text-transparent">
              Like Delivery
            </h3>
            <p className="max-w-sm text-sm leading-normal text-gray-400">
              Encontre os melhores restaurantes e receba seu pedido com rapidez
              e praticidade.
            </p>
            <div className="flex gap-2.5">
              <Link
                href="https://facebook.com"
                target="_blank"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-800 transition-colors hover:bg-orange-500 hover:text-white"
                aria-label="Facebook"
              >
                <Facebook className="h-4 w-4" />
              </Link>
              <Link
                href="https://instagram.com"
                target="_blank"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-800 transition-colors hover:bg-orange-500 hover:text-white"
                aria-label="Instagram"
              >
                <Instagram className="h-4 w-4" />
              </Link>
              <Link
                href="https://twitter.com"
                target="_blank"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-800 transition-colors hover:bg-orange-500 hover:text-white"
                aria-label="Twitter"
              >
                <Twitter className="h-4 w-4" />
              </Link>
              <Link
                href="https://linkedin.com"
                target="_blank"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-800 transition-colors hover:bg-orange-500 hover:text-white"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div>
            <h4 className="mb-3 text-base font-semibold text-white">Navegue</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/"
                  className="text-sm text-gray-400 transition-colors hover:text-orange-400"
                >
                  Inicio
                </Link>
              </li>
              <li>
                <Link
                  href="/#lojas"
                  className="text-sm text-gray-400 transition-colors hover:text-orange-400"
                >
                  Lojas
                </Link>
              </li>
              <li>
                <Link
                  href="/orders"
                  className="text-sm text-gray-400 transition-colors hover:text-orange-400"
                >
                  Meus pedidos
                </Link>
              </li>
              <li>
                <Link
                  href="/profile"
                  className="text-sm text-gray-400 transition-colors hover:text-orange-400"
                >
                  Minha conta
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-base font-semibold text-white">Ajuda</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/help"
                  className="text-sm text-gray-400 transition-colors hover:text-orange-400"
                >
                  Central de ajuda
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-sm text-gray-400 transition-colors hover:text-orange-400"
                >
                  Termos de uso
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-sm text-gray-400 transition-colors hover:text-orange-400"
                >
                  Privacidade
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="py-3">
          <p className="text-center text-sm text-gray-500">
            © {currentYear} Like Delivery. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
