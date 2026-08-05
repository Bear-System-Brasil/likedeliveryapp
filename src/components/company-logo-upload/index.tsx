"use client";

import { apiService } from "@/services/api";
import { Upload, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface CompanyLogoUploadProps {
  value: string;
  onChange: (url: string) => void;
  companyId: string;
  companyData?: {
    tradeName?: string;
    legalName?: string;
    cnpj?: string;
    email?: string;
    phone?: string;
  };
  label?: string;
  maxSizeMB?: number;
}

export function CompanyLogoUpload({
  value,
  onChange,
  companyId,
  companyData,
  label = "Escolher imagem",
  maxSizeMB = 5,
}: CompanyLogoUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Prevenir hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Sincronizar preview quando value mudar (dados carregados do backend)
  useEffect(() => {
    if (isMounted) {
      setPreview(value || null);
    }
  }, [value, isMounted]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione uma imagem válida");
      return;
    }

    // Validate file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSizeMB) {
      toast.error(`A imagem deve ter no máximo ${maxSizeMB}MB`);
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to backend
    try {
      setUploading(true);
      const response = await apiService.uploadCompanyLogo(
        file,
        companyId,
        companyData,
      );

      if (response.success && response.data?.logo_url) {
        onChange(response.data.logo_url);
        setPreview(response.data.logo_url);
        toast.success("Logo atualizado com sucesso!");
      } else {
        toast.error(response.message || "Erro ao fazer upload");
        setPreview(value || null);
      }
    } catch (error) {
      toast.error("Erro ao fazer upload do logo");
      setPreview(value || null);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onChange("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Não renderizar até estar montado (evita hydration mismatch)
  if (!isMounted) {
    return (
      <div className="space-y-4">
        <div className="relative w-48 h-48 mx-auto">
          <div className="w-full h-full bg-linear-to-br from-orange-50 to-orange-100 rounded-full flex flex-col items-center justify-center border-2 border-dashed border-orange-300">
            <Upload className="w-12 h-12 text-orange-400 mb-2" />
            <span className="text-sm text-orange-600 font-medium">
              Carregando...
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Clickable Preview Area */}
      <div className="relative w-48 h-48 mx-auto">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          disabled={uploading}
        />

        {uploading ? (
          // Upload skeleton loading
          <div className="w-full h-full rounded-full overflow-hidden relative">
            <div className="absolute inset-0 bg-linear-to-br from-orange-200 to-orange-200 animate-pulse" />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin" />
              <span className="mt-3 text-sm font-medium text-white drop-shadow-lg">
                Enviando...
              </span>
            </div>
          </div>
        ) : preview ? (
          <div
            onClick={() => !uploading && fileInputRef.current?.click()}
            className="relative w-full h-full rounded-full bg-white border-4 border-orange-200 hover:border-orange-400 transition-all overflow-hidden cursor-pointer group"
          >
            {/* Image Container */}
            <div
              className="w-full h-full flex items-center justify-center bg-white"
              style={{ position: "relative", zIndex: 1 }}
            >
              <img
                src={preview}
                alt="Logo da empresa"
                className="w-full h-full object-contain"
                style={{
                  display: "block",
                  opacity: 1,
                  visibility: "visible",
                  objectFit: "contain",
                }}
                onLoad={(e) => {
                  // Image loaded successfully
                }}
                onError={(e) => {
                  // Hide broken image
                  e.currentTarget.style.display = "none";
                  // Show error message
                  const parent = e.currentTarget.parentElement;
                  if (parent && !parent.querySelector(".error-message")) {
                    const errorDiv = document.createElement("div");
                    errorDiv.className = "error-message text-center p-4";
                    errorDiv.innerHTML = `
                      <div className="text-red-500 mb-2">
                        <p className="text-sm font-medium">Erro ao carregar imagem</p>
                      </div>
                    `;
                    parent.appendChild(errorDiv);
                  }
                }}
              />
            </div>

            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 rounded-full transition-all flex items-center justify-center pointer-events-none">
              <div className="text-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <Upload className="w-8 h-8 mx-auto mb-1" />
                <p className="text-xs font-medium">Alterar</p>
              </div>
            </div>

            {/* Remove button */}
            {!uploading && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove();
                }}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors shadow-lg z-10"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : (
          <div
            onClick={() => !uploading && fileInputRef.current?.click()}
            className="w-full h-full bg-linear-to-br from-orange-50 to-orange-100 rounded-full flex flex-col items-center justify-center border-2 border-dashed border-orange-300 hover:border-orange-500 hover:from-orange-100 hover:to-orange-200 transition-all cursor-pointer"
          >
            <Upload className="w-12 h-12 text-orange-400 transition-colors mb-2" />
            <span className="text-sm text-orange-600 font-medium text-center px-4">
              {uploading ? "Enviando..." : "Adicionar Logo"}
            </span>
          </div>
        )}

        {/* Loading overlay */}
        {uploading && (
          <div className="absolute inset-0 bg-black bg-opacity-60 rounded-full flex items-center justify-center">
            <div className="text-center text-white">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2" />
              <span className="text-xs">Enviando...</span>
            </div>
          </div>
        )}
      </div>

      <p className="text-xs text-center text-gray-500">
        Clique para fazer upload • Até {maxSizeMB}MB (JPG, PNG, GIF)
      </p>
    </div>
  );
}
