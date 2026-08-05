"use client";

import { apiService } from "@/services/api";
import { Upload, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface CompanyCoverUploadProps {
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

export function CompanyCoverUpload({
  value,
  onChange,
  companyId,
  companyData,
  label = "Escolher imagem de capa",
  maxSizeMB = 5,
}: CompanyCoverUploadProps) {
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
      const response = await apiService.uploadCompanyCover(
        file,
        companyId,
        companyData,
      );

      if (response.success && response.data?.cover_url) {
        onChange(response.data.cover_url);
        setPreview(response.data.cover_url);
        toast.success("Imagem de capa atualizada com sucesso!");
      } else {
        toast.error(response.message || "Erro ao fazer upload");
        setPreview(value || null);
      }
    } catch (error) {
      toast.error("Erro ao fazer upload da imagem de capa");
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
        <div className="relative w-full h-64 mx-auto rounded-2xl overflow-hidden">
          <div className="w-full h-full bg-linear-to-br from-orange-50 via-orange-50 to-orange-100 flex flex-col items-center justify-center border-2 border-dashed border-orange-300">
            <Upload className="w-14 h-14 text-orange-400 mb-3" />
            <span className="text-base text-orange-600 font-medium">
              Carregando...
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Clickable Preview Area - Banner format */}
      <div className="relative w-full h-64 mx-auto rounded-2xl overflow-hidden">
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
          <div className="w-full h-full relative">
            <div className="absolute inset-0 bg-linear-to-br from-orange-200 via-orange-200 to-purple-200 animate-pulse" />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin" />
              <span className="mt-3 text-sm font-medium text-white drop-shadow-lg">
                Enviando imagem de capa...
              </span>
            </div>
          </div>
        ) : preview ? (
          <div
            onClick={() => !uploading && fileInputRef.current?.click()}
            className="relative w-full h-full cursor-pointer group bg-gray-100"
            style={{
              position: "relative",
              zIndex: 1,
              backgroundColor: "#f3f4f6",
            }}
          >
            {/* Image */}
            <img
              src={preview}
              alt="Capa da empresa"
              className="w-full h-full object-contain"
              style={{
                display: "block",
                opacity: 1,
                visibility: "visible",
                width: "100%",
                height: "100%",
                objectFit: "contain",
                position: "relative",
                zIndex: 2,
              }}
              onLoad={(e) => {
                // Imagem carregada com sucesso
              }}
              onError={(e) => {
                console.error("❌ Erro ao carregar cover:", preview);
                // Esconder imagem quebrada
                e.currentTarget.style.display = "none";
                // Mostrar mensagem de erro
                const parent = e.currentTarget.parentElement;
                if (parent && !parent.querySelector(".error-message")) {
                  const errorDiv = document.createElement("div");
                  errorDiv.className =
                    "error-message absolute inset-0 flex items-center justify-center bg-gray-100";
                  errorDiv.innerHTML = `
                    <div className="text-center p-4">
                      <div className="text-red-500 mb-2">
                        <p className="text-sm font-medium">Erro ao carregar imagem</p>
                      </div>
                    </div>
                  `;
                  parent.appendChild(errorDiv);
                }
              }}
            />

            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center pointer-events-none">
              <div className="text-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <Upload className="w-10 h-10 mx-auto mb-2" />
                <p className="text-sm font-medium">Alterar imagem de capa</p>
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
                className="absolute top-4 right-4 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors shadow-lg z-10"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        ) : (
          <div
            onClick={() => !uploading && fileInputRef.current?.click()}
            className="w-full h-full bg-linear-to-br from-orange-50 via-orange-50 to-orange-100 flex flex-col items-center justify-center border-2 border-dashed border-orange-300 hover:border-orange-500 hover:from-orange-100 hover:via-orange-100 hover:to-orange-200 transition-all cursor-pointer"
          >
            <Upload className="w-14 h-14 text-orange-400 transition-colors mb-3" />
            <span className="text-base text-orange-600 font-medium">
              {uploading ? "Enviando..." : "Adicionar Imagem de Capa"}
            </span>
            <span className="text-sm text-orange-400 mt-2">
              Recomendado: 1200x400px
            </span>
          </div>
        )}

        {/* Loading overlay */}
        {uploading && (
          <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center rounded-2xl">
            <div className="text-center text-white">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white mx-auto mb-3" />
              <span className="text-sm font-medium">
                Enviando imagem de capa...
              </span>
            </div>
          </div>
        )}
      </div>

      <p className="text-xs text-center text-gray-500">
        Clique para fazer upload da imagem de capa • Até {maxSizeMB}MB (JPG,
        PNG, GIF) • Recomendado: 1200x400px
      </p>
    </div>
  );
}
