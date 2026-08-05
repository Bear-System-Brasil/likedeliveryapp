"use client";

import { toast } from "sonner";
import { GradientButton } from "@/components/ui/gradient-button";
import { useEffect, useState } from "react";

export function GeolocationButton() {
  const [isLoading, setIsLoading] = useState(false);

  // Tenta pegar localização automaticamente
  useEffect(() => {
    const hasLocationCookie = document.cookie.includes("userLocation=");
    if (!hasLocationCookie) {
      const timer = setTimeout(() => {
        handleGetGeolocation();
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleGetGeolocation = async () => {
    if (!navigator.geolocation) {
      toast.error("Geolocalização não suportada", {
        description: "Seu navegador não suporta localização.",
        duration: 3000,
      });
      return;
    }

    toast.info("Geolocalização", {
      description: "Obtendo sua localização...",
      duration: 3000,
    });

    setIsLoading(true);

    try {
      const position = await new Promise<{ lat: number; lng: number }>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            (pos) =>
              resolve({
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
              }),
            reject,
          );
        },
      );

      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${position.lat}&longitude=${position.lng}&localityLanguage=pt`,
      );

      if (!response.ok) throw new Error("Erro na API");

      const data = await response.json();

      const fullAddress = [
        data.street, // Rua
        data.streetNumber, // Número
        data.neighbourhood, // Bairro
        data.city, // Cidade
        data.principalSubdivision, // Estado
      ]
        .filter(Boolean)
        .join(", ");

      const coords = {
        lat: position.lat,
        lng: position.lng,
        city: data.city || "",
        address:
          fullAddress || data.address || `${data.city}, ${data.countryName}`,
        locality: data.locality,
        neighbourhood: data.neighbourhood,
        postcode: data.postcode,
      };

      // Salva no cookie
      document.cookie = `userLocation=${encodeURIComponent(JSON.stringify(coords))}; path=/; max-age=86400; SameSite=Lax`;

      // Dispara evento
      window.dispatchEvent(new Event("locationChanged"));

      toast.success("Localização definida!", {
        description: fullAddress || data.city,
        duration: 4000,
      });
    } catch (error: any) {
      console.error(error);

      let title = "Erro de localização";
      let description = "Não foi possível obter sua localização.";

      if (error instanceof GeolocationPositionError) {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            title = "Permissão negada";
            description =
              "Para usar sua localização, permita o acesso no navegador.";
            break;
          case error.POSITION_UNAVAILABLE:
            description = "Não foi possível determinar sua localização.";
            break;
          case error.TIMEOUT:
            description = "A localização demorou muito para responder.";
            break;
        }
      }

      toast.error(title, { description, duration: 4000 });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <GradientButton
      size="lg"
      onClick={handleGetGeolocation}
      disabled={isLoading}
      fullWidth
      className="sm:w-auto h-12 sm:h-14 text-base sm:text-lg"
    >
      {isLoading ? "Obtendo localização..." : "Usar minha localização"}
    </GradientButton>
  );
}
