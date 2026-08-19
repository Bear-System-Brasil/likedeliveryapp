"use client";

// import ContextSelectorModal from "@/components/context-selector-modal"
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiService } from "@/services/api";
import { useAuthStore } from "@/stores";
import {
  ArrowRight,
  Calendar,
  CheckCircle,
  CreditCard,
  Lock,
  LogIn,
  Mail,
  Phone,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess?: (userData?: any) => void;
  defaultTab?: "login" | "register";
}

export default function AuthModal({
  isOpen,
  onClose,
  onAuthSuccess,
  defaultTab = "login",
}: AuthModalProps) {
  const { login: zustandLogin } = useAuthStore();
  const [activeTab, setActiveTab] = useState<"login" | "register">(defaultTab);

  // Atualiza a aba quando defaultTab mudar ou modal abrir
  useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab);
    }
  }, [isOpen, defaultTab]);
  const [step, setStep] = useState<
    "form" | "otp" | "forgot-password" | "reset-password"
  >("form");
  const [isLoading, setIsLoading] = useState(false);
  // const [showContextSelector, setShowContextSelector] = useState(false)
  // const [loggedUserName, setLoggedUserName] = useState("")

  // Login form state
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  // Forgot password state
  const [forgotPasswordData, setForgotPasswordData] = useState({
    email: "",
  });

  // Reset password state
  const [resetPasswordData, setResetPasswordData] = useState({
    email: "",
    code: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Register form state
  const [registerData, setRegisterData] = useState({
    name: "",
    email: "",
    cpf: "",
    phone: "",
    password: "",
    confirmPassword: "",
    birthDate: "",
    role: "client",
  });

  // OTP state
  const [otpData, setOtpData] = useState({
    phone: "",
    code: "",
  });

  // Validation states
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [passwordMatch, setPasswordMatch] = useState(true);
  const [submitMessage, setSubmitMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    return numbers.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  };

  const formatDate = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    return numbers.replace(/(\d{2})(\d{2})(\d{4})/, "$1/$2/$3");
  };

  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];

    if (password.length < 6) {
      errors.push("mínimo 6 caracteres");
    }
    if (!/[A-Z]/.test(password)) {
      errors.push("1 letra maiúscula");
    }
    if (!/[a-z]/.test(password)) {
      errors.push("1 letra minúscula");
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      errors.push("1 símbolo");
    }

    return errors;
  };

  const handleInputChange = (field: string, value: string) => {
    const normalizedValue = field === "email" ? value.toLowerCase() : value;

    if (activeTab === "login") {
      setLoginData((prev) => ({ ...prev, [field]: normalizedValue }));
      return;
    }

    let formattedValue = normalizedValue;
    if (field === "cpf") formattedValue = formatCPF(value);
    if (field === "phone") formattedValue = formatPhone(value);
    if (field === "birthDate") formattedValue = formatDate(value);

    setRegisterData((prev) => {
      const newData = { ...prev, [field]: formattedValue };

      if (field === "password") {
        setPasswordErrors(validatePassword(formattedValue));
        setPasswordMatch(formattedValue === prev.confirmPassword);
      }

      if (field === "confirmPassword") {
        setPasswordMatch(formattedValue === prev.password);
      }

      return newData;
    });
  };

  const isFormValid = () => {
    if (activeTab === "login") {
      return loginData.email && loginData.password;
    } else {
      return (
        registerData.name &&
        registerData.email &&
        registerData.cpf &&
        registerData.phone &&
        registerData.password &&
        registerData.confirmPassword &&
        registerData.birthDate &&
        passwordErrors.length === 0 &&
        passwordMatch
      );
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setSubmitMessage(null);

    try {
      if (activeTab === "login") {
        const loginResponse = await apiService.login(loginData);

        if (loginResponse.success && loginResponse.data?.data?.user) {
          const user = loginResponse.data.data.user;

          // companyId já vem resolvido pelo BFF (decodificado do JWT no
          // servidor) - o client nunca ve o token.
          const companyId: string | null = (user as any).companyId ?? null;

          const userRole = (user as any).role || "client";
          const isCompanyUser = [
            "owner",
            "admin",
            "manager",
            "cook",
            "delivery",
          ].includes(userRole);

          // Criar objeto User compatível para ambos os casos
          const userForStore = isCompanyUser
            ? {
                id: user.id,
                name:
                  (user as any).tradeName ||
                  (user as any).legalName ||
                  (user as any).name ||
                  "Empresa",
                email: user.email,
                cpf: (user as any).cnpj || (user as any).cpf || "",
                phone: user.phone || "",
                birthDate: (user as any).birthDate || "",
                role: userRole as string,
                companyId: companyId || undefined,
                photoUrl: (user as any).photoUrl || (user as any).logo_url,
                tradeName: (user as any).tradeName,
                legalName: (user as any).legalName,
              }
            : {
                id: user.id,
                name: (user as any).name || "",
                email: user.email,
                cpf: (user as any).cpf || "",
                phone: user.phone || "",
                birthDate: (user as any).birthDate || "",
                role: userRole,
                companyId: companyId || undefined,
                photoUrl: (user as any).photoUrl,
              };

          // userWithRole mantido para callback de compatibilidade
          const userWithRole = { ...user, role: userRole, companyId };

          // Save to Zustand store (que automaticamente persiste no localStorage via middleware)
          zustandLogin(userForStore);

          setSubmitMessage({
            type: "success",
            text: "Login realizado com sucesso! Bem-vindo de volta!",
          });

          // COMMENTED: Context selector removed to separate user/company entities
          // IMPORTANT: Only OWNER sees the context selector
          // Admin, manager, cook, delivery, client don't need to choose
          // if ((userWithRole as any).role === 'owner') {
          //   setTimeout(() => {
          //     onClose()
          //     setLoggedUserName((userWithRole as any).name || (userWithRole as any).tradeName || 'Usuário')
          //     setShowContextSelector(true)
          //     resetForm()
          //   }, 1500)
          // } else {
          // All roles: just close and update
          setTimeout(() => {
            if (userWithRole) {
              onAuthSuccess?.(userWithRole);
            } else {
              onAuthSuccess?.();
            }
            onClose();
            resetForm();
          }, 2000);
          // }
        } else {
          setSubmitMessage({
            type: "error",
            text:
              loginResponse.message ||
              "Email ou senha incorretos. Tente novamente.",
          });
        }
      } else {
        const apiData = {
          name: registerData.name,
          email: registerData.email,
          cpf: registerData.cpf.replace(/\D/g, ""),
          phone: registerData.phone.replace(/\D/g, ""),
          password: registerData.password,
          birthDate: registerData.birthDate,
          role: registerData.role,
        };

        const response = await apiService.createUser(apiData);

        if (response.success) {
          setOtpData((prev) => ({
            ...prev,
            phone: registerData.phone.replace(/\D/g, ""),
          }));
          setStep("otp");
          setSubmitMessage({
            type: "success",
            text: "Código de verificação enviado para seu telefone!",
          });
        } else {
          setSubmitMessage({
            type: "error",
            text: response.message || "Erro ao criar conta. Tente novamente.",
          });
        }
      }
    } catch (error) {
      setSubmitMessage({
        type: "error",
        text: "Erro de conexão. Verifique sua internet e tente novamente.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPSubmit = async () => {
    setIsLoading(true);
    setSubmitMessage(null);

    try {
      const response = await apiService.verifyOtp({
        phone: otpData.phone.replace(/\D/g, ""),
        code: otpData.code,
      });

      if (response.success) {
        setSubmitMessage({
          type: "success",
          text: "Conta verificada com sucesso!",
        });

        setTimeout(() => {
          onAuthSuccess?.();
          onClose();
          resetForm();
        }, 2000);
      } else {
        setSubmitMessage({
          type: "error",
          text: response.message || "Código inválido. Tente novamente.",
        });
        setOtpData((prev) => ({ ...prev, code: "" }));
      }
    } catch (error) {
      setSubmitMessage({
        type: "error",
        text: "Erro de conexão. Tente novamente.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async () => {
    setIsLoading(true);
    setSubmitMessage(null);

    try {
      const response = await apiService.forgotPassword({
        email: forgotPasswordData.email,
      });

      if (response.success) {
        setResetPasswordData((prev) => ({
          ...prev,
          email: forgotPasswordData.email,
        }));
        setStep("reset-password");
        setSubmitMessage({
          type: "success",
          text: "Código de recuperação enviado para seu email!",
        });
      } else {
        setSubmitMessage({
          type: "error",
          text:
            response.message ||
            "Email não encontrado. Verifique e tente novamente.",
        });
      }
    } catch (error) {
      setSubmitMessage({
        type: "error",
        text: "Erro de conexão. Tente novamente.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPasswordSubmit = async () => {
    setIsLoading(true);
    setSubmitMessage(null);

    // Validar senhas
    const errors = validatePassword(resetPasswordData.newPassword);
    if (errors.length > 0) {
      setSubmitMessage({
        type: "error",
        text: `Senha inválida: ${errors.join(", ")}`,
      });
      setIsLoading(false);
      return;
    }

    if (resetPasswordData.newPassword !== resetPasswordData.confirmPassword) {
      setSubmitMessage({
        type: "error",
        text: "As senhas não coincidem.",
      });
      setIsLoading(false);
      return;
    }

    try {
      const response = await apiService.resetPassword({
        email: resetPasswordData.email,
        code: resetPasswordData.code,
        newPassword: resetPasswordData.newPassword,
      });

      if (response.success) {
        setSubmitMessage({
          type: "success",
          text: "Senha redefinida com sucesso! Você já pode fazer login.",
        });

        setTimeout(() => {
          resetForm();
          setActiveTab("login");
        }, 2000);
      } else {
        setSubmitMessage({
          type: "error",
          text:
            response.message || "Código inválido. Verifique e tente novamente.",
        });
      }
    } catch (error) {
      setSubmitMessage({
        type: "error",
        text: "Erro de conexão. Tente novamente.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setStep("form");
    setLoginData({ email: "", password: "" });
    setRegisterData({
      name: "",
      email: "",
      cpf: "",
      phone: "",
      password: "",
      confirmPassword: "",
      birthDate: "",
      role: "client",
    });
    setOtpData({ phone: "", code: "" });
    setForgotPasswordData({ email: "" });
    setResetPasswordData({
      email: "",
      code: "",
      newPassword: "",
      confirmPassword: "",
    });
    setSubmitMessage(null); // Limpar mensagens
    setPasswordErrors([]);
    setPasswordMatch(true);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md border-0 bg-white/95 backdrop-blur-xl shadow-2xl max-h-[90vh] p-0 flex flex-col">
          <DialogHeader className="px-4 sm:px-6 pt-3 sm:pt-4 pb-2 sm:pb-3 border-b border-gray-100 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-linear-to-r from-orange-500 to-orange-500 rounded-lg flex items-center justify-center">
                  <LogIn className="w-5 h-5 text-white" />
                </div>
                <DialogTitle className="text-lg sm:text-xl font-bold text-gray-900">
                  {step === "otp" ? "Verificação SMS" : "Autenticação"}
                </DialogTitle>
              </div>
            </div>
          </DialogHeader>

          <div className="overflow-y-auto px-4 sm:px-6 py-3 sm:py-4 flex-1">
            {step === "form" ? (
              <div className="space-y-3 sm:space-y-4">
                <Tabs
                  value={activeTab}
                  onValueChange={(value) =>
                    setActiveTab(value as "login" | "register")
                  }
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-2 bg-gray-200 rounded-xl">
                    <TabsTrigger
                      value="login"
                      className="data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=active]:shadow-sm
                              data-[state=inactive]:text-gray-600 data-[state=inactive]:hover:text-orange-500 data-[state=inactive]:hover:bg-gray-50 
                                transition-all duration-200 font-medium"
                    >
                      Entrar
                    </TabsTrigger>
                    <TabsTrigger
                      value="register"
                      className="data-[state=active]:bg-white data-[state=active]:text-orange-600 
                                data-[state=active]:shadow-sm data-[state=inactive]:text-gray-600 data-[state=inactive]:hover:text-orange-500 
                              data-[state=inactive]:hover:bg-gray-50 transition-all duration-200 font-medium"
                    >
                      Registrar
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent
                    value="login"
                    className="space-y-2.5 sm:space-y-3 mt-3 sm:mt-4"
                  >
                    <div className="space-y-1 sm:space-y-1.5">
                      <Label
                        htmlFor="email"
                        className="text-xs sm:text-sm font-semibold text-gray-700"
                      >
                        Email
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="email@email.com"
                          value={loginData.email}
                          onChange={(e) =>
                            handleInputChange("email", e.target.value)
                          }
                          className="pl-10 rounded-xl border-2 border-gray-200 focus:border-orange-400 h-9 sm:h-10 text-xs sm:text-sm"
                        />
                      </div>
                    </div>

                    <div className="space-y-1 sm:space-y-1.5">
                      <Label
                        htmlFor="password"
                        className="text-xs sm:text-sm font-semibold text-gray-700"
                      >
                        Senha
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          id="password"
                          type="password"
                          placeholder="Sua senha"
                          value={loginData.password}
                          onChange={(e) =>
                            handleInputChange("password", e.target.value)
                          }
                          className="pl-10 rounded-xl border-2 border-gray-200 focus:border-orange-400 h-9 sm:h-10 text-xs sm:text-sm"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => setStep("forgot-password")}
                        className="text-sm text-orange-600 hover:text-orange-700 font-medium transition-colors cursor-pointer"
                      >
                        Esqueci minha senha
                      </button>
                    </div>
                  </TabsContent>

                  <TabsContent
                    value="register"
                    className="space-y-2.5 sm:space-y-3 mt-3 sm:mt-4"
                  >
                    <div className="mb-2 sm:mb-3 p-2 sm:p-3 bg-linear-to-r from-orange-50 to-orange-50 border border-orange-200/50 rounded-xl">
                      <p className="text-[10px] sm:text-xs text-gray-700">
                        <strong className="text-orange-600">Cadastro:</strong>{" "}
                        Você receberá um código no WhatsApp. Use-o na tela de
                        login.
                      </p>
                    </div>
                    <div className="space-y-1 sm:space-y-1.5">
                      <Label
                        htmlFor="name"
                        className="text-xs sm:text-sm font-semibold text-gray-700"
                      >
                        Nome Completo
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          id="name"
                          placeholder="Nome completo"
                          value={registerData.name}
                          onChange={(e) =>
                            handleInputChange("name", e.target.value)
                          }
                          className="pl-10 rounded-xl border-2 border-gray-200 focus:border-orange-400 h-9 sm:h-10 text-xs sm:text-sm"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                      <div className="space-y-1 sm:space-y-1.5">
                        <Label
                          htmlFor="email"
                          className="text-xs sm:text-sm font-semibold text-gray-700"
                        >
                          Email
                        </Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                          <Input
                            id="email"
                            type="email"
                            placeholder="email@email.com"
                            value={registerData.email}
                            onChange={(e) =>
                              handleInputChange("email", e.target.value)
                            }
                            className="pl-10 rounded-xl border-2 border-gray-200 focus:border-orange-400 h-9 sm:h-10 text-xs sm:text-sm"
                          />
                        </div>
                      </div>

                      <div className="space-y-1 sm:space-y-1.5">
                        <Label
                          htmlFor="cpf"
                          className="text-xs sm:text-sm font-semibold text-gray-700"
                        >
                          CPF
                        </Label>
                        <div className="relative">
                          <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                          <Input
                            id="cpf"
                            placeholder="000.000.000-00"
                            value={registerData.cpf}
                            onChange={(e) =>
                              handleInputChange("cpf", e.target.value)
                            }
                            maxLength={14}
                            className="pl-10 rounded-xl border-2 border-gray-200 focus:border-orange-400 h-9 sm:h-10 text-xs sm:text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                      <div className="space-y-1 sm:space-y-1.5">
                        <Label
                          htmlFor="phone"
                          className="text-xs sm:text-sm font-semibold text-gray-700"
                        >
                          Telefone
                        </Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                          <Input
                            id="phone"
                            placeholder="(11) 99999-9999"
                            value={registerData.phone}
                            onChange={(e) =>
                              handleInputChange("phone", e.target.value)
                            }
                            maxLength={15}
                            className="pl-10 rounded-xl border-2 border-gray-200 focus:border-orange-400 h-9 sm:h-10 text-xs sm:text-sm"
                          />
                        </div>
                      </div>

                      <div className="space-y-1 sm:space-y-1.5">
                        <Label
                          htmlFor="birthDate"
                          className="text-xs sm:text-sm font-semibold text-gray-700"
                        >
                          Nascimento
                        </Label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                          <Input
                            id="birthDate"
                            placeholder="DD/MM/AAAA"
                            value={registerData.birthDate}
                            onChange={(e) =>
                              handleInputChange("birthDate", e.target.value)
                            }
                            maxLength={10}
                            className="pl-10 rounded-xl border-2 border-gray-200 focus:border-orange-400 h-9 sm:h-10 text-xs sm:text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1 sm:space-y-1.5">
                      <Label
                        htmlFor="password"
                        className="text-xs sm:text-sm font-semibold text-gray-700"
                      >
                        Senha
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          id="password"
                          type="password"
                          placeholder="Crie uma senha forte"
                          value={registerData.password}
                          onChange={(e) =>
                            handleInputChange("password", e.target.value)
                          }
                          className={`pl-10 rounded-xl border-2 h-9 sm:h-10 text-xs sm:text-sm ${
                            passwordErrors.length > 0 && registerData.password
                              ? "border-red-300 focus:border-red-400"
                              : "border-gray-200 focus:border-orange-400"
                          }`}
                        />
                      </div>
                      {passwordErrors.length > 0 && registerData.password && (
                        <p className="text-xs text-red-600 mt-1">
                          Senha inválida, esperado: {passwordErrors.join(", ")}
                        </p>
                      )}
                      {passwordErrors.length === 0 && registerData.password && (
                        <p className="text-xs text-green-600 mt-1">
                          ✓ Senha válida
                        </p>
                      )}
                    </div>

                    <div className="space-y-1 sm:space-y-1.5">
                      <Label
                        htmlFor="confirmPassword"
                        className="text-xs sm:text-sm font-semibold text-gray-700"
                      >
                        Confirmar Senha
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          id="confirmPassword"
                          type="password"
                          placeholder="Confirme sua senha"
                          value={registerData.confirmPassword}
                          onChange={(e) =>
                            handleInputChange("confirmPassword", e.target.value)
                          }
                          className={`pl-10 rounded-xl border-2 h-9 sm:h-10 text-xs sm:text-sm ${
                            !passwordMatch && registerData.confirmPassword
                              ? "border-red-300 focus:border-red-400"
                              : "border-gray-200 focus:border-orange-400"
                          }`}
                        />
                      </div>
                      {!passwordMatch && registerData.confirmPassword && (
                        <p className="text-xs text-red-600 mt-1">
                          As senhas não coincidem
                        </p>
                      )}
                      {passwordMatch &&
                        registerData.confirmPassword &&
                        registerData.password && (
                          <p className="text-xs text-green-600 mt-1">
                            ✓ Senhas coincidem
                          </p>
                        )}
                    </div>
                  </TabsContent>
                </Tabs>

                {/* Mensagem de feedback */}
                {submitMessage && (
                  <div
                    className={`p-2 sm:p-3 rounded-xl text-xs sm:text-sm font-medium ${
                      submitMessage.type === "success"
                        ? "bg-green-50 text-green-700 border border-green-200"
                        : "bg-red-50 text-red-700 border border-red-200"
                    }`}
                  >
                    {submitMessage.text}
                  </div>
                )}

                <Button
                  onClick={handleSubmit}
                  disabled={isLoading || !isFormValid()}
                  className="relative w-full h-10 sm:h-12 rounded-xl bg-linear-to-r from-orange-500 to-orange-500 text-white 
                          font-semibold shadow-lg hover:shadow-xl transition-all overflow-hidden group transform
                          disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-sm sm:text-base"
                >
                  <span
                    className="absolute inset-0 bg-white opacity-30 rotate-45 -translate-x-full group-hover:translate-x-full
                                  blur-sm transition-transform duration-500"
                  ></span>
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Processando...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <span>
                        {activeTab === "login" ? "Entrar" : "Criar Conta"}
                      </span>
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  )}
                </Button>
              </div>
            ) : step === "otp" ? (
              /* OTP Verification */
              <div className="space-y-4 sm:space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Phone className="h-8 w-8 text-green-600" />
                  </div>
                  <p className="text-gray-600">
                    Enviamos um código de verificação para
                  </p>
                  <p className="font-semibold text-gray-900">{otpData.phone}</p>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="code"
                    className="text-sm font-semibold text-gray-700"
                  >
                    Código de Verificação
                  </Label>
                  <Input
                    id="code"
                    placeholder="123456"
                    value={otpData.code}
                    onChange={(e) =>
                      setOtpData((prev) => ({ ...prev, code: e.target.value }))
                    }
                    className="text-center text-2xl font-mono rounded-xl border-2 border-gray-200 focus:border-orange-400"
                    maxLength={6}
                  />
                </div>

                {/* Mensagem de feedback para OTP */}
                {submitMessage && (
                  <div
                    className={`p-3 rounded-xl text-sm font-medium ${
                      submitMessage.type === "success"
                        ? "bg-green-50 text-green-700 border border-green-200"
                        : "bg-red-50 text-red-700 border border-red-200"
                    }`}
                  >
                    {submitMessage.text}
                  </div>
                )}

                <Button
                  onClick={handleOTPSubmit}
                  disabled={isLoading || otpData.code.length !== 6}
                  className="w-full h-12 rounded-xl bg-linear-to-r from-orange-500 to-orange-500 hover:from-orange-600 hover:to-orange-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all cursor-pointer"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Verificando...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4" />
                      <span>Verificar Código</span>
                    </div>
                  )}
                </Button>

                <Button
                  variant="ghost"
                  onClick={() => setStep("form")}
                  className="w-full text-gray-600 hover:text-gray-900 cursor-pointer"
                >
                  Voltar
                </Button>
              </div>
            ) : step === "forgot-password" ? (
              /* Forgot Password - Request Code */
              <div className="space-y-4 sm:space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Lock className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Esqueceu sua senha?
                  </h3>
                  <p className="text-sm text-gray-600">
                    Digite seu email e enviaremos um código para redefinir sua
                    senha
                  </p>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="forgot-email"
                    className="text-sm font-semibold text-gray-700"
                  >
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="forgot-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={forgotPasswordData.email}
                      onChange={(e) =>
                        setForgotPasswordData({ email: e.target.value })
                      }
                      className="pl-10 rounded-xl border-2 border-gray-200 focus:border-orange-400"
                    />
                  </div>
                </div>

                {submitMessage && (
                  <div
                    className={`p-3 rounded-xl text-sm font-medium ${
                      submitMessage.type === "success"
                        ? "bg-green-50 text-green-700 border border-green-200"
                        : "bg-red-50 text-red-700 border border-red-200"
                    }`}
                  >
                    {submitMessage.text}
                  </div>
                )}

                <Button
                  onClick={handleForgotPasswordSubmit}
                  disabled={isLoading || !forgotPasswordData.email}
                  className="w-full h-12 rounded-xl bg-linear-to-r from-orange-500 to-orange-500 hover:from-orange-600 hover:to-orange-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all cursor-pointer"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Enviando...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4" />
                      <span>Enviar Código</span>
                    </div>
                  )}
                </Button>

                <Button
                  variant="ghost"
                  onClick={() => {
                    setStep("form");
                    setSubmitMessage(null);
                  }}
                  className="w-full text-gray-600 hover:text-gray-900 cursor-pointer"
                >
                  Voltar ao Login
                </Button>
              </div>
            ) : step === "reset-password" ? (
              /* Reset Password - Enter Code and New Password */
              <div className="space-y-4 sm:space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Redefinir Senha
                  </h3>
                  <p className="text-sm text-gray-600">
                    Digite o código enviado para{" "}
                    <strong>{resetPasswordData.email}</strong>
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="reset-code"
                      className="text-sm font-semibold text-gray-700"
                    >
                      Código de Verificação
                    </Label>
                    <Input
                      id="reset-code"
                      placeholder="123456"
                      value={resetPasswordData.code}
                      onChange={(e) =>
                        setResetPasswordData((prev) => ({
                          ...prev,
                          code: e.target.value,
                        }))
                      }
                      className="text-center text-xl font-mono rounded-xl border-2 border-gray-200 focus:border-orange-400"
                      maxLength={6}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="new-password"
                      className="text-sm font-semibold text-gray-700"
                    >
                      Nova Senha
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="new-password"
                        type="password"
                        placeholder="Nova senha"
                        value={resetPasswordData.newPassword}
                        onChange={(e) =>
                          setResetPasswordData((prev) => ({
                            ...prev,
                            newPassword: e.target.value,
                          }))
                        }
                        className="pl-10 rounded-xl border-2 border-gray-200 focus:border-orange-400"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="confirm-new-password"
                      className="text-sm font-semibold text-gray-700"
                    >
                      Confirmar Nova Senha
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="confirm-new-password"
                        type="password"
                        placeholder="Confirme a nova senha"
                        value={resetPasswordData.confirmPassword}
                        onChange={(e) =>
                          setResetPasswordData((prev) => ({
                            ...prev,
                            confirmPassword: e.target.value,
                          }))
                        }
                        className="pl-10 rounded-xl border-2 border-gray-200 focus:border-orange-400"
                      />
                    </div>
                  </div>

                  {/* Password requirements */}
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                    <p className="text-xs font-semibold text-blue-900 mb-2">
                      A senha deve conter:
                    </p>
                    <ul className="text-xs text-blue-700 space-y-1">
                      <li>• Mínimo 6 caracteres</li>
                      <li>• 1 letra maiúscula</li>
                      <li>• 1 letra minúscula</li>
                      <li>• 1 caractere especial</li>
                    </ul>
                  </div>
                </div>

                {submitMessage && (
                  <div
                    className={`p-3 rounded-xl text-sm font-medium ${
                      submitMessage.type === "success"
                        ? "bg-green-50 text-green-700 border border-green-200"
                        : "bg-red-50 text-red-700 border border-red-200"
                    }`}
                  >
                    {submitMessage.text}
                  </div>
                )}

                <Button
                  onClick={handleResetPasswordSubmit}
                  disabled={
                    isLoading ||
                    !resetPasswordData.code ||
                    !resetPasswordData.newPassword ||
                    !resetPasswordData.confirmPassword ||
                    resetPasswordData.code.length !== 6
                  }
                  className="w-full h-12 rounded-xl bg-linear-to-r from-orange-500 to-orange-500 hover:from-orange-600 hover:to-orange-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all cursor-pointer"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Redefinindo...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4" />
                      <span>Redefinir Senha</span>
                    </div>
                  )}
                </Button>

                <Button
                  variant="ghost"
                  onClick={() => {
                    setStep("forgot-password");
                    setSubmitMessage(null);
                  }}
                  className="w-full text-gray-600 hover:text-gray-900 cursor-pointer"
                >
                  Voltar
                </Button>
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      {/* Context Selector Modal - COMMENTED */}
      {/* <ContextSelectorModal
        isOpen={showContextSelector}
        onClose={() => {
          setShowContextSelector(false)
          onAuthSuccess?.()
        }}
        userName={loggedUserName}
      /> */}
    </>
  );
}
