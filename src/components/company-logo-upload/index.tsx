"use client";

import { apiService } from "@/services/api";
import { Camera, Loader2 } from "lucide-react";
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
  maxSizeMB?: number;
}

export function CompanyLogoUpload({
  value,
  onChange,
  companyId,
  companyData,
  maxSizeMB = 5,
}: CompanyLogoUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      setPreview(value || null);
    }
  }, [value, isMounted]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione uma imagem válida");
      return;
    }

    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSizeMB) {
      toast.error(`A imagem deve ter no máximo ${maxSizeMB}MB`);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

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

  if (!isMounted) {
    return (
      <div className="h-[76px] w-[76px] shrink-0 -mt-[30px] rounded-full border-[3px] border-white bg-[#F4F5F7]" />
    );
  }

  return (
    <div
      onClick={() => !uploading && fileInputRef.current?.click()}
      className="group relative h-[76px] w-[76px] shrink-0 -mt-[30px] cursor-pointer overflow-hidden rounded-full border-[3px] border-white bg-white shadow-sm"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        disabled={uploading}
      />

      {preview ? (
        <img
          src={preview}
          alt="Logo da empresa"
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-[#F4F5F7] text-[10px] font-semibold text-[#A0A6B0]">
          Logo
        </div>
      )}

      <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 transition-colors group-hover:bg-black/35">
        {uploading ? (
          <Loader2 className="h-4 w-4 animate-spin text-white" />
        ) : (
          <Camera className="h-4 w-4 text-white opacity-0 transition-opacity group-hover:opacity-100" />
        )}
      </div>
    </div>
  );
}
