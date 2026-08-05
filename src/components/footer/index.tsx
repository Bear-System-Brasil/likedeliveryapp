import {
  Facebook,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  Twitter,
} from "lucide-react";
import Link from "next/link";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 py-12 border-b border-gray-700">
          {/* Company Info */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-amber-500 bg-clip-text text-transparent">
              Like Delivery
            </h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Conectando você aos melhores restaurantes da cidade com entrega
              rápida e qualidade garantida.
            </p>

            {/* Social Links */}
            <div className="flex space-x-4">
              <Link
                href="https://facebook.com"
                target="_blank"
                className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-800 hover:bg-orange-500 hover:text-white transition-all duration-300 cursor-pointer"
                aria-label="Facebook"
              >
                <Facebook className="w-4 h-4" />
              </Link>

              <Link
                href="https://instagram.com"
                target="_blank"
                className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-800 hover:bg-orange-500 hover:text-white transition-all duration-300 cursor-pointer"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </Link>

              <Link
                href="https://twitter.com"
                target="_blank"
                className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-800 hover:bg-orange-500 hover:text-white transition-all duration-300 cursor-pointer"
                aria-label="Twitter"
              >
                <Twitter className="w-4 h-4" />
              </Link>

              <Link
                href="https://linkedin.com"
                target="_blank"
                className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-800 hover:bg-orange-500 hover:text-white transition-all duration-300 cursor-pointer"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold text-lg mb-4">
              Links Rápidos
            </h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/"
                  className="text-gray-400 hover:text-orange-400 transition-colors duration-200 text-sm"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/restaurants"
                  className="text-gray-400 hover:text-orange-400 transition-colors duration-200 text-sm"
                >
                  Restaurantes
                </Link>
              </li>
              <li>
                <Link
                  href="/orders"
                  className="text-gray-400 hover:text-orange-400 transition-colors duration-200 text-sm"
                >
                  Meus Pedidos
                </Link>
              </li>
              <li>
                <Link
                  href="/profile"
                  className="text-gray-400 hover:text-orange-400 transition-colors duration-200 text-sm"
                >
                  Minha Conta
                </Link>
              </li>
            </ul>
          </div>

          {/* For Business */}
          <div>
            <h4 className="text-white font-semibold text-lg mb-4">
              Para Empresas
            </h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/restaurant-register"
                  className="text-gray-400 hover:text-orange-400 transition-colors duration-200 text-sm"
                >
                  Cadastre seu Restaurante
                </Link>
              </li>
              <li>
                <Link
                  href="/company-profile"
                  className="text-gray-400 hover:text-orange-400 transition-colors duration-200 text-sm"
                >
                  Painel do Parceiro
                </Link>
              </li>
              <li>
                <Link
                  href="/menu-management"
                  className="text-gray-400 hover:text-orange-400 transition-colors duration-200 text-sm"
                >
                  Gerenciar Cardápio
                </Link>
              </li>
              <li>
                <Link
                  href="/order-management"
                  className="text-gray-400 hover:text-orange-400 transition-colors duration-200 text-sm"
                >
                  Gerenciar Pedidos
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold text-lg mb-4">Contato</h4>
            <ul className="space-y-3">
              <li className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
                <span className="text-sm text-gray-400">
                  Av. Principal, 123
                  <br />
                  Centro, SP - Brasil
                </span>
              </li>
              <li className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-orange-400 shrink-0" />
                <span className="text-sm text-gray-400">(11) 1234-5678</span>
              </li>
              <li className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-orange-400 shrink-0" />
                <span className="text-sm text-gray-400">
                  contato@likedelivery.com
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-sm text-gray-500 text-center md:text-left">
              © {currentYear} Like Delivery. Todos os direitos reservados.
            </p>

            <div className="flex flex-wrap justify-center md:justify-end gap-x-6 gap-y-2">
              <Link
                href="/terms"
                className="text-sm text-gray-500 hover:text-orange-400 transition-colors duration-200"
              >
                Termos de Uso
              </Link>
              <Link
                href="/privacy"
                className="text-sm text-gray-500 hover:text-orange-400 transition-colors duration-200"
              >
                Política de Privacidade
              </Link>
              <Link
                href="/cookies"
                className="text-sm text-gray-500 hover:text-orange-400 transition-colors duration-200"
              >
                Cookies
              </Link>
              <Link
                href="/help"
                className="text-sm text-gray-500 hover:text-orange-400 transition-colors duration-200"
              >
                Ajuda
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
