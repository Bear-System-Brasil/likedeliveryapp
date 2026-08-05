"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useUnauthorizedPage } from "@/hooks";
import { ROLE_DESCRIPTIONS, ROLE_LABELS } from "@/utils/permissions";
import { AlertTriangle, Home, Shield } from "lucide-react";

export default function UnauthorizedPage() {
  const { user, isAuthenticated, isMounted, handleGoHome, handleLogin } =
    useUnauthorizedPage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-50 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-10 h-10 text-orange-600" />
          </div>
          <CardTitle className="text-3xl font-bold text-gray-900 flex items-center justify-center gap-2">
            <AlertTriangle className="w-8 h-8 text-orange-500" />
            Acesso Negado
          </CardTitle>
          <CardDescription className="text-lg mt-2">
            Você não tem permissão para acessar esta página
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {!isMounted ? (
            <div className="animate-pulse space-y-4">
              <div className="h-24 bg-gray-200 rounded-lg"></div>
              <div className="h-24 bg-gray-200 rounded-lg"></div>
            </div>
          ) : isAuthenticated && user ? (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">
                  Seu Perfil Atual:
                </h3>
                <div className="space-y-1">
                  <p className="text-blue-800">
                    <span className="font-medium">Nome:</span> {user.name}
                  </p>
                  <p className="text-blue-800">
                    <span className="font-medium">Tipo de Conta:</span>{" "}
                    {ROLE_LABELS[user.role] || user.role}
                  </p>
                  <p className="text-sm text-blue-600 mt-2">
                    {ROLE_DESCRIPTIONS[user.role] || "Usuário do sistema"}
                  </p>
                </div>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h3 className="font-semibold text-orange-900 mb-2">
                  Por que não posso acessar?
                </h3>
                <p className="text-orange-800 text-sm">
                  Esta página é restrita a determinados tipos de conta. Seu
                  perfil atual (<strong>{ROLE_LABELS[user.role]}</strong>) não
                  possui as permissões necessárias para acessar este conteúdo.
                </p>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">
                  Tipos de Conta:
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <span className="font-medium text-gray-700 min-w-[100px]">
                      👑 Dono:
                    </span>
                    <span className="text-gray-600">
                      Acesso total ao sistema
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-medium text-gray-700 min-w-[100px]">
                      ⚙️ Admin:
                    </span>
                    <span className="text-gray-600">
                      Gestão completa do restaurante
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-medium text-gray-700 min-w-[100px]">
                      📊 Gerente:
                    </span>
                    <span className="text-gray-600">Gestão operacional</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-medium text-gray-700 min-w-[100px]">
                      👨‍🍳 Cozinheiro:
                    </span>
                    <span className="text-gray-600">Gestão de pedidos</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-medium text-gray-700 min-w-[100px]">
                      🚚 Entregador:
                    </span>
                    <span className="text-gray-600">
                      Acompanhamento de entregas
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-medium text-gray-700 min-w-[100px]">
                      👤 Cliente:
                    </span>
                    <span className="text-gray-600">Realizar pedidos</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800">
                Você precisa estar autenticado para acessar esta página. Por
                favor, faça login para continuar.
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleGoHome}
              className="flex-1 bg-gradient-to-r from-orange-500 to-orange-500 hover:from-orange-600 hover:to-orange-600 cursor-pointer"
            >
              <Home className="w-4 h-4 mr-2" />
              Voltar para Home
            </Button>
            {!isAuthenticated && (
              <Button
                onClick={handleLogin}
                variant="outline"
                className="flex-1 cursor-pointer"
              >
                Fazer Login
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
