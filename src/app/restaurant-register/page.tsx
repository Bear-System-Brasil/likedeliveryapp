"use client";

import { Footer } from "@/components/footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AnimatedBackground,
  GlassCard,
  GlassCardContent,
  GlassCardDescription,
  GlassCardHeader,
  GlassCardTitle,
  GradientButton,
} from "@/components/ui/custom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRestaurantRegistration } from "@/hooks";
import { formatCnpj, formatPhoneDisplay } from "@/utils";
import {
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle,
  Lock,
  Mail,
  Phone,
  Store,
  User,
} from "lucide-react";
import Link from "next/link";

export default function RestaurantRegisterPage() {
  const {
    registerData,
    handleInputChange,
    passwordErrors,
    passwordMatch,
    isFormValid,
    isLoading,
    submitMessage,
    handleSubmit,
  } = useRestaurantRegistration();

  return (
    <>
      <AnimatedBackground
        blobCount={4}
        showBlobs={true}
        className="flex items-center justify-center p-4"
      >
        <div className="w-full max-w-2xl relative z-10">
          <GlassCard variant="glass" className="rounded-2xl shadow-2xl">
            <GlassCardHeader className="space-y-4">
              <div className="flex items-center justify-between">
                <Link
                  href="/restaurant-landing-page"
                  className="cursor-pointer"
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2 hover:bg-orange-50 cursor-pointer"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Voltar
                  </Button>
                </Link>
                <Badge className="gap-1 bg-gradient-to-r from-orange-100 to-orange-100 text-orange-700 border-0">
                  <Store className="h-3 w-3" />
                  Restaurante
                </Badge>
              </div>
              <div className="space-y-2">
                <GlassCardTitle className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-orange-500 to-orange-500 flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-white" />
                  </div>
                  Cadastro de Restaurante
                </GlassCardTitle>
                <GlassCardDescription className="text-base text-gray-600">
                  Preencha os dados para cadastrar seu restaurante na plataforma
                </GlassCardDescription>
              </div>
            </GlassCardHeader>

            <GlassCardContent>
              <div className="mb-6 p-4 bg-gradient-to-r from-orange-50 to-orange-50 border border-orange-200/50 rounded-xl">
                <p className="text-sm text-gray-700">
                  <strong className="text-orange-600">
                    Processo de cadastro:
                  </strong>{" "}
                  Preencha os dados abaixo para criar sua conta e cadastrar seu
                  restaurante na plataforma. Após o cadastro, faça login para
                  acessar o painel de gerenciamento.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label
                    htmlFor="tradeName"
                    className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer"
                  >
                    <Store className="h-4 w-4 text-orange-500" />
                    Nome Fantasia
                  </Label>
                  <Input
                    id="tradeName"
                    type="text"
                    placeholder="Ex: Pizzaria do João"
                    value={registerData.tradeName}
                    onChange={(e) =>
                      handleInputChange("tradeName", e.target.value)
                    }
                    className="h-12 rounded-xl border-2 border-gray-200 focus:border-orange-400 transition-colors"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="legalName"
                    className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer"
                  >
                    <Building2 className="h-4 w-4 text-orange-500" />
                    Razão Social
                  </Label>
                  <Input
                    id="legalName"
                    type="text"
                    placeholder="Ex: Pizzaria do João LTDA"
                    value={registerData.legalName}
                    onChange={(e) =>
                      handleInputChange("legalName", e.target.value)
                    }
                    className="h-12 rounded-xl border-2 border-gray-200 focus:border-orange-400 transition-colors"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="cnpj"
                    className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer"
                  >
                    <Building2 className="h-4 w-4 text-orange-500" />
                    CNPJ
                  </Label>
                  <Input
                    id="cnpj"
                    type="text"
                    placeholder="00.000.000/0000-00"
                    value={registerData.cnpj}
                    onChange={(e) =>
                      handleInputChange("cnpj", formatCnpj(e.target.value))
                    }
                    maxLength={18}
                    className="h-12 rounded-xl border-2 border-gray-200 focus:border-orange-400 transition-colors"
                    required
                  />
                </div>


                <div className="space-y-2">
                  <Label
                    htmlFor="description"
                    className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer"
                  >
                    <Store className="h-4 w-4 text-orange-500" />
                    Descrição do Restaurante
                  </Label>
                  <Input
                    id="description"
                    type="text"
                    placeholder="Ex: Pizzaria especializada em massas artesanais"
                    value={registerData.description}
                    onChange={(e) =>
                      handleInputChange("description", e.target.value)
                    }
                    className="h-12 rounded-xl border-2 border-gray-200 focus:border-orange-400 transition-colors"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="email"
                      className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer"
                    >
                      <Mail className="h-4 w-4 text-orange-500" />
                      E-mail
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="restaurante@email.com"
                      value={registerData.email}
                      onChange={(e) =>
                        handleInputChange("email", e.target.value)
                      }
                      className="h-12 rounded-xl border-2 border-gray-200 focus:border-orange-400 transition-colors"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="phone"
                      className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer"
                    >
                      <Phone className="h-4 w-4 text-orange-500" />
                      Telefone
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="(00) 00000-0000"
                      value={registerData.phone}
                      onChange={(e) =>
                        handleInputChange(
                          "phone",
                          formatPhoneDisplay(e.target.value),
                        )
                      }
                      maxLength={15}
                      className="h-12 rounded-xl border-2 border-gray-200 focus:border-orange-400 transition-colors"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2 pt-4 border-t-2 border-gray-100">
                  <Label
                    htmlFor="password"
                    className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer"
                  >
                    <Lock className="h-4 w-4 text-orange-500" />
                    Senha
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Digite uma senha forte"
                    value={registerData.password}
                    onChange={(e) =>
                      handleInputChange("password", e.target.value)
                    }
                    className="h-12 rounded-xl border-2 border-gray-200 focus:border-orange-400 transition-colors"
                    required
                  />
                  {registerData.password && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {passwordErrors.length === 0 ? (
                        <Badge className="bg-green-500 hover:bg-green-600 gap-1 border-0">
                          <CheckCircle className="h-3 w-3" />
                          Senha forte
                        </Badge>
                      ) : (
                        passwordErrors.map((error, idx) => (
                          <p
                            key={idx}
                            className="text-destructive text-xs border-0"
                          >
                            {error}
                          </p>
                        ))
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="confirmPassword"
                    className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer"
                  >
                    <Lock className="h-4 w-4 text-orange-500" />
                    Confirmar Senha
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Digite a senha novamente"
                    value={registerData.confirmPassword}
                    onChange={(e) =>
                      handleInputChange("confirmPassword", e.target.value)
                    }
                    className="h-12 rounded-xl border-2 border-gray-200 focus:border-orange-400 transition-colors"
                    required
                  />
                  {registerData.confirmPassword && (
                    <div className="mt-2">
                      {passwordMatch ? (
                        <Badge className="bg-green-500 hover:bg-green-600 gap-1 border-0">
                          <CheckCircle className="h-3 w-3" />
                          Senhas coincidem
                        </Badge>
                      ) : (
                        <p className="border-0 text-destructive text-xs">
                          Senhas não coincidem
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {submitMessage && (
                  <div
                    className={`p-4 rounded-xl text-sm ${
                      submitMessage.type === "success"
                        ? "bg-green-50 text-green-800 border-2 border-green-200"
                        : "bg-red-50 text-red-800 border-2 border-red-200"
                    }`}
                  >
                    {submitMessage.text}
                  </div>
                )}

                <GradientButton
                  type="submit"
                  fullWidth
                  size="lg"
                  className="h-14 text-lg"
                  disabled={!isFormValid || isLoading}
                  isLoading={isLoading}
                  loadingText="Cadastrando..."
                >
                  Cadastrar Restaurante
                </GradientButton>

                <div className="text-center text-sm text-gray-600 pt-2">
                  Já possui cadastro?{" "}
                  <Link
                    href="/?auth=required"
                    className="text-orange-600 hover:text-orange-700 font-semibold transition-colors cursor-pointer"
                  >
                    Fazer login
                  </Link>
                </div>
              </form>
            </GlassCardContent>
          </GlassCard>
        </div>
      </AnimatedBackground>

      <Footer />
    </>
  );
}
