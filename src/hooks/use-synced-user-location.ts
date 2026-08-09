"use client";

import { useCallback, useEffect, useState } from "react";

import { useUserAddresses } from "@/hooks/use-addresses";
import type { Address } from "@/services/api";
import type { Coords } from "@/types/restaurant";

type StoredUserLocation = Coords & {
  address?: string;
  city?: string;
};

const LOCATION_COOKIE = "userLocation";

function parseLocationCookie(): StoredUserLocation | null {
  if (typeof document === "undefined") return null;

  const locationCookie = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${LOCATION_COOKIE}=`));

  if (!locationCookie) return null;

  try {
    const value = locationCookie.split("=").slice(1).join("=");
    const parsed = JSON.parse(decodeURIComponent(value));

    if (
      typeof parsed === "object" &&
      parsed !== null &&
      Number.isFinite(Number(parsed.lat)) &&
      Number.isFinite(Number(parsed.lng))
    ) {
      return {
        ...parsed,
        lat: Number(parsed.lat),
        lng: Number(parsed.lng),
      };
    }
  } catch {
    return null;
  }

  return null;
}

function saveLocationCookie(location: StoredUserLocation) {
  document.cookie = `${LOCATION_COOKIE}=${encodeURIComponent(
    JSON.stringify(location),
  )}; path=/; max-age=86400; SameSite=Lax`;
  window.dispatchEvent(new Event("locationChanged"));
}

function getAddressLabel(address: Address) {
  return [
    address.street,
    address.number,
    address.neighborhood,
    address.city,
    address.state,
  ]
    .filter(Boolean)
    .join(", ");
}

function getCoordsFromAddress(address: Address): StoredUserLocation | null {
  const lat = Number(address.latitude);
  const lng = Number(address.longitude);

  if (!Number.isFinite(lat) || !Number.isFinite(lng) || (lat === 0 && lng === 0)) {
    return null;
  }

  return {
    lat,
    lng,
    city: address.city,
    address: getAddressLabel(address),
  };
}

async function geocodeAddress(address: Address): Promise<StoredUserLocation | null> {
  const query = [
    address.street,
    address.number,
    address.neighborhood,
    address.city,
    address.state,
    address.zipCode,
    "Brasil",
  ]
    .filter(Boolean)
    .join(", ");

  if (!query.trim()) return null;

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        query,
      )}&format=jsonv2&limit=1&addressdetails=1`,
    );

    if (!response.ok) return null;

    const results = await response.json();
    const result = results?.[0];

    if (!result?.lat || !result?.lon) return null;

    return {
      lat: Number(result.lat),
      lng: Number(result.lon),
      city: address.city,
      address: getAddressLabel(address) || result.display_name,
    };
  } catch {
    return null;
  }
}

function getPreferredAddress(addresses: Address[]) {
  return addresses.find((address) => address.isDefault) || addresses[0];
}

export function useSyncedUserLocation(initialLocation?: Coords | null) {
  const { data: userAddresses = [] } = useUserAddresses();
  const [location, setLocation] = useState<Coords | undefined>(
    () => initialLocation ?? undefined,
  );

  const syncLocationFromCookie = useCallback(() => {
    const storedLocation = parseLocationCookie();

    if (!storedLocation) return;

    setLocation((currentLocation) => {
      if (
        currentLocation?.lat === storedLocation.lat &&
        currentLocation?.lng === storedLocation.lng
      ) {
        return currentLocation;
      }

      return {
        lat: storedLocation.lat,
        lng: storedLocation.lng,
      };
    });
  }, []);

  useEffect(() => {
    syncLocationFromCookie();
    window.addEventListener("locationChanged", syncLocationFromCookie);

    return () => {
      window.removeEventListener("locationChanged", syncLocationFromCookie);
    };
  }, [syncLocationFromCookie]);

  useEffect(() => {
    if (location || parseLocationCookie() || !userAddresses.length) return;

    let cancelled = false;

    const syncLocationFromSavedAddress = async () => {
      const preferredAddress = getPreferredAddress(userAddresses);
      if (!preferredAddress) return;

      const savedLocation =
        getCoordsFromAddress(preferredAddress) ||
        (await geocodeAddress(preferredAddress));

      if (!savedLocation || cancelled) return;

      setLocation({
        lat: savedLocation.lat,
        lng: savedLocation.lng,
      });
      saveLocationCookie(savedLocation);
    };

    syncLocationFromSavedAddress();

    return () => {
      cancelled = true;
    };
  }, [location, userAddresses]);

  return {
    location,
    setLocation,
  };
}
