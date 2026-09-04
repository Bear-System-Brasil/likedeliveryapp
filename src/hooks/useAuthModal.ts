import { useState, useEffect } from "react";
import { apiService } from "@/services/api";
import { useAuthStore } from "@/stores";

interface UseAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess?: (userData?: any) => void;
  defaultTab?: "login" | "register";
}

export function useAuthModal({
  isOpen,
  onClose,
  onAuthSuccess,
  defaultTab = "login",
}: UseAuthModalProps) {
  const { login: zustandLogin } = useAuthStore();
  
  const [activeTab, setActiveTab] = useState<"login" | "register">(defaultTab);
  const [step, setStep] = useState<"form" | "otp" | "forgot-password" | "reset-password">("form");
  const [isLoading, setIsLoading] = useState(false);

  // Formulários
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [forgotPasswordData, setForgotPasswordData] = useState({ phone: "" });
  const [resetPasswordData, setResetPasswordData] = useState({ phone: "", code: "", newPassword: "", confirmPassword: "" });
  const [registerData, setRegisterData] = useState({
    name: "", email: "", cpf: "", phone: "", password: "", confirmPassword: "", birthDate: "", role: "client",
  });
  const [otpData, setOtpData] = useState({ phone: "", code: "" });

  // Validações e Feedbacks
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [passwordMatch, setPasswordMatch] = useState(true);
  const [submitMessage, setSubmitMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (isOpen) setActiveTab(defaultTab);
  }, [isOpen, defaultTab]);

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
    if (password.length < 6) errors.push("mínimo 6 caracteres");
    if (!/[A-Z]/.test(password)) errors.push("1 letra maiúscula");
    if (!/[a-z]/.test(password)) errors.push("1 letra minúscula");
    if (!/[^A-Za-z0-9]/.test(password)) errors.push("1 símbolo");
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
        registerData.name && registerData.email && registerData.cpf &&
        registerData.phone && registerData.password && registerData.confirmPassword &&
        registerData.birthDate && passwordErrors.length === 0 && passwordMatch
      );
    }
  };

  const resetForm = () => {
    setStep("form");
    setLoginData({ email: "", password: "" });
    setRegisterData({ name: "", email: "", cpf: "", phone: "", password: "", confirmPassword: "", birthDate: "", role: "client" });
    setOtpData({ phone: "", code: "" });
    setForgotPasswordData({ phone: "" });
    setResetPasswordData({ phone: "", code: "", newPassword: "", confirmPassword: "" });
    setSubmitMessage(null);
    setPasswordErrors([]);
    setPasswordMatch(true);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setSubmitMessage(null);

    try {
      if (activeTab === "login") {
        const loginResponse = await apiService.login(loginData);

        if (loginResponse.success && loginResponse.data?.data?.user) {
          const user = loginResponse.data.data.user;
          const companyId: string | null = (user as any).companyId ?? null;
          const userRole = (user as any).role || "client";
          const isCompanyUser = ["owner", "admin", "manager", "cook", "delivery"].includes(userRole);

          const userForStore = isCompanyUser
            ? {
                id: user.id,
                name: (user as any).tradeName || (user as any).legalName || (user as any).name || "Empresa",
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

          const userWithRole = { ...user, role: userRole, companyId };
          zustandLogin(userForStore);

          setSubmitMessage({ type: "success", text: "Login realizado com sucesso! Bem-vindo de volta!" });

          setTimeout(() => {
            if (userWithRole) onAuthSuccess?.(userWithRole);
            else onAuthSuccess?.();
            onClose();
            resetForm();
          }, 2000);
        } else {
          setSubmitMessage({ type: "error", text: loginResponse.message || "Email ou senha incorretos. Tente novamente." });
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
          setOtpData((prev) => ({ ...prev, phone: registerData.phone.replace(/\D/g, "") }));
          setStep("otp");
          setSubmitMessage({ type: "success", text: "Código de verificação enviado para seu telefone!" });
        } else {
          setSubmitMessage({ type: "error", text: response.message || "Erro ao criar conta. Tente novamente." });
        }
      }
    } catch (error) {
      setSubmitMessage({ type: "error", text: "Erro de conexão. Verifique sua internet e tente novamente." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPSubmit = async () => {
    setIsLoading(true);
    setSubmitMessage(null);
    try {
      const response = await apiService.verifyOtp({ phone: otpData.phone.replace(/\D/g, ""), code: otpData.code });
      if (response.success) {
        setSubmitMessage({ type: "success", text: "Conta verificada com sucesso!" });
        setTimeout(() => {
          onAuthSuccess?.();
          onClose();
          resetForm();
        }, 2000);
      } else {
        setSubmitMessage({ type: "error", text: response.message || "Código inválido. Tente novamente." });
        setOtpData((prev) => ({ ...prev, code: "" }));
      }
    } catch (error) {
      setSubmitMessage({ type: "error", text: "Erro de conexão. Tente novamente." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async () => {
    setIsLoading(true);
    setSubmitMessage(null);
    try {
      const phone = forgotPasswordData.phone.replace(/\D/g, "");
      const response = await apiService.forgotPassword({ phone });
      if (response.success) {
        setResetPasswordData((prev) => ({ ...prev, phone }));
        setStep("reset-password");
        setSubmitMessage({ type: "success", text: "Código de recuperação enviado para seu telefone!" });
      } else {
        setSubmitMessage({ type: "error", text: response.message || "Telefone não encontrado. Verifique e tente novamente." });
      }
    } catch (error) {
      setSubmitMessage({ type: "error", text: "Erro de conexão. Tente novamente." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPasswordSubmit = async () => {
    setIsLoading(true);
    setSubmitMessage(null);

    const errors = validatePassword(resetPasswordData.newPassword);
    if (errors.length > 0) {
      setSubmitMessage({ type: "error", text: `Senha inválida: ${errors.join(", ")}` });
      setIsLoading(false);
      return;
    }

    if (resetPasswordData.newPassword !== resetPasswordData.confirmPassword) {
      setSubmitMessage({ type: "error", text: "As senhas não coincidem." });
      setIsLoading(false);
      return;
    }

    try {
      const response = await apiService.resetPassword({
        phone: resetPasswordData.phone,
        code: resetPasswordData.code,
        newPassword: resetPasswordData.newPassword,
      });

      if (response.success) {
        setSubmitMessage({ type: "success", text: "Senha redefinida com sucesso! Entrando na sua conta..." });
        const { authenticated, user } = await apiService.getSession();
        setTimeout(() => {
          if (authenticated && user) {
            onAuthSuccess?.(user);
            onClose();
          } else {
            setActiveTab("login");
          }
          resetForm();
        }, 1500);
      } else {
        setSubmitMessage({ type: "error", text: response.message || "Código inválido. Verifique e tente novamente." });
      }
    } catch (error) {
      setSubmitMessage({ type: "error", text: "Erro de conexão. Tente novamente." });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    activeTab, setActiveTab,
    step, setStep,
    isLoading,
    loginData,
    forgotPasswordData, setForgotPasswordData,
    resetPasswordData, setResetPasswordData,
    registerData,
    otpData, setOtpData,
    passwordErrors,
    passwordMatch,
    submitMessage, setSubmitMessage,
    formatPhone,
    handleInputChange,
    isFormValid,
    handleSubmit,
    handleOTPSubmit,
    handleForgotPasswordSubmit,
    handleResetPasswordSubmit,
    handleClose,
  };
}