"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAuth } from "@/contexts/auth-provider";
import { useAuthStore } from "@/stores";
import { isCompanyRole } from "@/utils/role-helpers";
import clsx from "clsx";
import {
  ChevronDown,
  LogOut,
  MapPin,
  Menu,
  Navigation,
  Package,
  PencilLine,
  Search,
  ShoppingCart,
  Store,
  User,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";
import { LikeDeliveryLogo } from "../ui/likedelivery-logo";
import Link from "next/link";

const DEFAULT_LOCATION_LABEL = "Escolha seu endereço";

interface MainHeaderProps {
  cartItems?: number;
  onCartClick?: () => void;
  showSearch?: boolean;
  showNav?: boolean;
}

export function MainHeader({
  cartItems = 0,
  onCartClick,
  showSearch = true,
  showNav = true,
}: MainHeaderProps) {
  const router = useRouter();
  const { showAuthModal, logout } = useAuth();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [isMounted, setIsMounted] = useState(false);
  const [hasHydrated, setHasHydrated] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [locationLabel, setLocationLabel] = useState(DEFAULT_LOCATION_LABEL);
  const [locationOpen, setLocationOpen] = useState(false);
  const [isChangingLocation, setIsChangingLocation] = useState(false);
  const [manualLocation, setManualLocation] = useState("");
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState("");

  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  const saveLocation = (location: {
    lat: number;
    lng: number;
    city: string;
    address: string;
  }) => {
    document.cookie = `userLocation=${encodeURIComponent(
      JSON.stringify(location),
    )}; path=/; max-age=86400; SameSite=Lax`;
    setLocationLabel(location.address || location.city);
    setLocationOpen(false);
    setIsChangingLocation(false);
    setManualLocation("");
    setLocationError("");
    window.dispatchEvent(new Event("locationChanged"));
  };

  const handleManualLocation = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = manualLocation.trim();
    if (!query) {
      setLocationError("Digite uma cidade, bairro ou endereço.");
      return;
    }
    setLocationLoading(true);
    setLocationError("");
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          `${query}, Brasil`,
        )}&format=jsonv2&limit=1&addressdetails=1`,
      );
      if (!response.ok) throw new Error("Falha ao buscar localização");
      const results = await response.json();
      const result = results?.[0];
      if (!result?.lat || !result?.lon) {
        throw new Error("Localização não encontrada");
      }
      const city =
        result.address?.city ||
        result.address?.town ||
        result.address?.municipality ||
        query;
      saveLocation({
        lat: Number(result.lat),
        lng: Number(result.lon),
        city,
        address: result.display_name || query,
      });
    } catch {
      setLocationError(
        "Não encontramos esse local. Tente uma cidade ou bairro.",
      );
    } finally {
      setLocationLoading(false);
    }
  };

  const handleCurrentLocation = async () => {
    if (!navigator.geolocation) {
      setLocationError("Seu navegador não permite localização automática.");
      return;
    }
    setLocationLoading(true);
    setLocationError("");
    try {
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: false,
            timeout: 10000,
          }),
      );
      const { latitude, longitude } = position.coords;
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=pt`,
      );
      if (!response.ok) throw new Error("Falha ao buscar endereço");
      const data = await response.json();
      const city = data.city || data.locality || "Minha localização";
      const address = [
        data.street,
        data.streetNumber,
        data.neighbourhood,
        city,
        data.principalSubdivision,
      ]
        .filter(Boolean)
        .join(", ");
      saveLocation({
        lat: latitude,
        lng: longitude,
        city,
        address: address || city,
      });
    } catch {
      setLocationError("Não foi possível encontrar sua localização.");
    } finally {
      setLocationLoading(false);
    }
  };

  useEffect(() => {
    const syncLocation = () => {
      const locationCookie = document.cookie
        .split("; ")
        .find((row) => row.startsWith("userLocation="));
      if (!locationCookie) {
        setLocationLabel(DEFAULT_LOCATION_LABEL);
        return;
      }
      const encodedLocation = locationCookie.split("=").slice(1).join("=");
      try {
        const parsedLocation = JSON.parse(decodeURIComponent(encodedLocation));
        const label =
          parsedLocation?.address ||
          parsedLocation?.locality ||
          parsedLocation?.city;
        setLocationLabel(label || DEFAULT_LOCATION_LABEL);
      } catch {
        setLocationLabel(DEFAULT_LOCATION_LABEL);
      }
    };
    syncLocation();
    window.addEventListener("locationChanged", syncLocation);
    return () => {
      window.removeEventListener("locationChanged", syncLocation);
    };
  }, []);

  useEffect(() => {
    if (useAuthStore.persist.hasHydrated()) {
      setHasHydrated(true);
    }
    const unsub = useAuthStore.persist.onFinishHydration(() => {
      setHasHydrated(true);
    });
    return () => {
      unsub();
    };
  }, []);

  const canShowAuthUI = isMounted && hasHydrated;

  const handleProfileClick = () => {
    if (isCompanyRole(user?.role)) {
      router.push("/company-profile");
    } else {
      router.push("/profile");
    }
    setMobileMenuOpen(false);
  };

  const handleCartClick = () => {
    if (onCartClick) onCartClick();
    else router.push("/cart");
    setMobileMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    router.push("/");
    setMobileMenuOpen(false);
  };

  const hasSavedLocation = locationLabel !== DEFAULT_LOCATION_LABEL;
  const currentLocationText = hasSavedLocation
    ? locationLabel
    : "Nenhum endereço selecionado";

  return (
    <header
      className={clsx(
        "fixed top-1 left-1 right-1 z-50",
        "bg-white/95 border border-orange-100/50",
        "rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden",
      )}
    >
      <div className="px-3 py-2 sm:px-6 sm:py-3">
        <div className="flex items-center justify-between gap-1.5 sm:gap-2">
          {/* ===== LADO ESQUERDO (Logo + Endereço) ===== */}
          <div
            className={clsx(
              "flex min-w-0 flex-1 items-center gap-1.5 sm:gap-2 transition-all duration-200",
              searchOpen && "max-md:hidden",
            )}
          >
            <Link href="/" className="shrink-0">
              <LikeDeliveryLogo>LikeDelivery</LikeDeliveryLogo>
            </Link>

            <div className="min-w-0 leading-tight">
              <Sheet
                open={locationOpen}
                onOpenChange={(open) => {
                  setLocationOpen(open);
                  if (!open) {
                    setLocationError("");
                    setIsChangingLocation(false);
                    setManualLocation("");
                  }
                }}
              >
                <SheetTrigger asChild>
                  <button
                    type="button"
                    className="flex max-w-[90px] cursor-pointer items-center gap-1.5 rounded-lg bg-gray-100 px-2.5 py-1.5 text-xs font-medium text-gray-900 shadow-sm transition-colors hover:bg-gray-200 xs:max-w-[120px] sm:max-w-[140px] md:max-w-[180px] lg:max-w-[240px]"
                    title="Alterar endereço"
                  >
                    <MapPin className="h-3.5 w-3.5 shrink-0 fill-orange-500 text-orange-500" />
                    <span className="truncate" title={locationLabel}>
                      {locationLabel}
                    </span>
                    <ChevronDown className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                  </button>
                </SheetTrigger>

                <SheetContent
                  side="bottom"
                  className="rounded-t-3xl border-t border-orange-100 bg-white px-4 pb-8 pt-4 sm:px-6"
                >
                  {/* Handle visual (opcional mas fica bonito) */}
                  <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-gray-200" />

                  <div className="mx-auto w-full max-w-xl space-y-4">
                    <div className="space-y-1">
                      <SheetTitle className="text-lg font-bold text-gray-950">
                        Endereço de entrega
                      </SheetTitle>
                      <p className="text-sm text-gray-500">
                        Onde seu pedido será entregue
                      </p>
                    </div>

                    {/* Card do endereço atual */}
                    <div className="rounded-2xl border border-orange-100 bg-orange-50/60 p-4">
                      <div className="flex gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-orange-500 shadow-sm">
                          <MapPin className="h-5 w-5 fill-orange-500" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-bold uppercase tracking-wide text-orange-600">
                            Entregando em
                          </p>
                          <p className="mt-1 text-sm font-semibold leading-snug text-gray-950">
                            {currentLocationText}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setManualLocation("");
                            setLocationError("");
                            setIsChangingLocation(true);
                          }}
                          className="h-11 justify-center rounded-xl border-orange-200 bg-white text-orange-600 hover:bg-orange-50"
                        >
                          <PencilLine className="mr-2 h-4 w-4" />
                          Trocar
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          disabled={locationLoading}
                          onClick={handleCurrentLocation}
                          className="h-11 justify-center rounded-xl border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                        >
                          <Navigation className="mr-2 h-4 w-4" />
                          Usar atual
                        </Button>
                      </div>
                    </div>

                    {/* Formulário só aparece quando o usuário clica em "Trocar" */}
                    {isChangingLocation && (
                      <form
                        onSubmit={handleManualLocation}
                        className="rounded-2xl border border-gray-200 bg-gray-50 p-4"
                      >
                        <p className="mb-3 text-sm font-semibold text-gray-950">
                          Digite o novo endereço
                        </p>
                        <div className="flex flex-col gap-2">
                          <Input
                            value={manualLocation}
                            onChange={(event) =>
                              setManualLocation(event.target.value)
                            }
                            placeholder="Ex.: Rua Machado de Assis, 334"
                            className="h-11 rounded-xl bg-white"
                            // ← sem autoFocus
                          />
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setIsChangingLocation(false);
                                setManualLocation("");
                                setLocationError("");
                              }}
                              className="h-11 flex-1 rounded-xl"
                            >
                              Cancelar
                            </Button>
                            <Button
                              type="submit"
                              disabled={locationLoading}
                              className="h-11 flex-1 rounded-xl bg-orange-500 hover:bg-orange-600"
                            >
                              {locationLoading ? "Buscando..." : "Salvar"}
                            </Button>
                          </div>
                        </div>
                      </form>
                    )}

                    {locationError && (
                      <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">
                        {locationError}
                      </p>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          {/* ===== ACTIONS ===== */}
          <div
            className={clsx(
              "flex items-center gap-1.5 sm:gap-2 transition-all duration-200",
              searchOpen ? "max-md:flex-1 max-md:min-w-0" : "shrink-0",
            )}
          >
            {/* Search */}
            {showSearch && (
              <div className="flex items-center max-md:flex-1 max-md:min-w-0">
                {/* Input expande para a ESQUERDA do botão */}
                <div
                  className={clsx(
                    "overflow-hidden transition-all duration-200 ease-out",
                    searchOpen
                      ? "mr-1.5 w-full opacity-100 max-md:flex-1 sm:w-36 md:w-40 lg:w-48 xl:w-56"
                      : "w-0 opacity-0",
                  )}
                >
                  <Input
                    ref={searchInputRef}
                    placeholder="Buscar comida..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") setSearchOpen(false);
                    }}
                    className="h-9 sm:h-10 w-full rounded-xl border-0 bg-gray-50/50 text-sm"
                  />
                </div>

                {/* Botão SEMPRE fica na direita */}
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 sm:h-10 sm:w-10 shrink-0 rounded-xl border-0 bg-gray-50/50"
                  onClick={() => setSearchOpen((open) => !open)}
                  aria-label={searchOpen ? "Fechar busca" : "Buscar"}
                >
                  {searchOpen ? (
                    <X className="h-4 w-4" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>
            )}

            {/* Carrinho */}
            <Button
              variant="outline"
              size="icon"
              className="relative hidden h-9 w-9 rounded-xl border-0 bg-gray-50/50 md:flex md:h-10 md:w-10"
              onClick={handleCartClick}
              aria-label="Carrinho"
            >
              <ShoppingCart className="h-4 w-4" />
              {isMounted && cartItems > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-bold text-white">
                  {cartItems}
                </span>
              )}
            </Button>

            {/* Meus Pedidos */}
            {canShowAuthUI && isAuthenticated && user?.role === "client" && (
              <Button
                variant="outline"
                size="icon"
                className="hidden h-9 w-9 rounded-xl border-0 bg-gray-50/50 md:flex md:h-10 md:w-10"
                onClick={() => router.push("/orders")}
                aria-label="Meus Pedidos"
              >
                <Package className="h-4 w-4" />
              </Button>
            )}

            {/* Menu / Entrar */}
            {canShowAuthUI && (
              <>
                {isAuthenticated ? (
                  <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                    <SheetTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl border-0 bg-gray-50/50 cursor-pointer"
                      >
                        <Menu className="h-5 w-5" />
                      </Button>
                    </SheetTrigger>

                    <SheetContent
                      side="right"
                      className="w-[300px] sm:w-[400px]"
                    >
                      <SheetTitle className="sr-only">
                        Menu de navegação
                      </SheetTitle>
                      <div className="flex flex-col h-full">
                        <div className="flex items-center space-x-2 mb-6">
                          <LikeDeliveryLogo />
                          <h2 className="text-lg font-bold">Menu</h2>
                        </div>

                        <div className="space-y-2">
                          <Button
                            variant="outline"
                            className="w-full justify-start rounded-xl"
                            onClick={handleProfileClick}
                          >
                            {user?.photoUrl ? (
                              <img
                                src={user.photoUrl}
                                alt={user.name || "User"}
                                className="h-5 w-5 rounded-full object-cover mr-2"
                              />
                            ) : (
                              <User className="h-4 w-4 mr-2" />
                            )}
                            Perfil
                          </Button>

                          <Button
                            variant="outline"
                            className="w-full justify-start rounded-xl"
                            onClick={handleCartClick}
                          >
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            Carrinho
                            {cartItems > 0 && (
                              <span className="ml-auto bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
                                {cartItems}
                              </span>
                            )}
                          </Button>

                          {user?.role === "client" && (
                            <Button
                              variant="outline"
                              className="w-full justify-start rounded-xl"
                              onClick={() => {
                                router.push("/orders");
                                setMobileMenuOpen(false);
                              }}
                            >
                              <Package className="h-4 w-4 mr-2" />
                              Meus Pedidos
                            </Button>
                          )}

                          {user?.role === "owner" && (
                            <Button
                              variant="outline"
                              className="w-full justify-start rounded-xl"
                              onClick={() => {
                                router.push("/menu-management");
                                setMobileMenuOpen(false);
                              }}
                            >
                              <Store className="h-4 w-4 mr-2" />
                              Gestão
                            </Button>
                          )}

                          <Button
                            className="w-full justify-start rounded-xl text-orange-600 hover:text-orange-700 hover:bg-red-50"
                            onClick={handleLogout}
                          >
                            <LogOut className="h-4 w-4 mr-2" />
                            Sair da conta
                          </Button>
                        </div>
                      </div>
                    </SheetContent>
                  </Sheet>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl border-0 bg-orange-50 text-orange-600 hover:bg-orange-100 font-medium"
                    onClick={() => showAuthModal("login")}
                  >
                    Entrar
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
