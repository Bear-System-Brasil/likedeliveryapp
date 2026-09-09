"use client";

import { MapPinOffIcon } from "lucide-react";
import { Card, CardContent } from "./card";
import { GeolocationButton } from "../user-location/geolocation-button";

export function NoRestaurantNear() {
  return (
    <Card className="border-none shadow-sm">
      <CardContent className="pt-12 pb-16">
        <div className="max-w-md mx-auto flex flex-col items-center justify-center text-center">
          <div className="w-24 h-24 mb-8 bg-linear-to-br from-blue-50 to-teal-50 dark:from-blue-950 dark:to-teal-950 rounded-full flex items-center justify-center">
            <MapPinOffIcon size={52} className="text-muted-foreground" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
            Encontre restaurantes perto de você
          </h2>

          <p className="text-muted-foreground mb-10 text-base leading-relaxed">
            Habilite sua localização para ver os restaurantes em alta na sua
            região e os mais pedidos da semana.
          </p>

          <GeolocationButton />

          <p className="text-xs text-muted-foreground mt-6">
            Sua localização é usada apenas para mostrar restaurantes próximos
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
