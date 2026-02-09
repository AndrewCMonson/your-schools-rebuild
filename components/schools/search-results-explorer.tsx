"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ComponentProps } from "react";
import { SearchMap } from "@/components/schools/search-map";
import type { SearchMapSchool } from "@/components/schools/search-map";
import { SchoolCard } from "@/components/school-card";
import { getSchoolsForVisiblePinsAction } from "@/lib/actions/school-search-actions";
import { Button } from "@/components/ui/button";

type SchoolCardData = ComponentProps<typeof SchoolCard>["school"];
const LOCATION_CACHE_KEY = "ys:school-search:user-location:v1";
const LOCATION_CACHE_MAX_AGE_MS = 1000 * 60 * 60 * 24;

function sameIds(left: string[], right: string[]) {
  if (left.length !== right.length) return false;
  for (let i = 0; i < left.length; i += 1) {
    if (left[i] !== right[i]) return false;
  }
  return true;
}

interface SearchResultsExplorerProps {
  schools: SchoolCardData[];
  mapSchools: SearchMapSchool[];
  geocodedOrigin?: { lat: number; lng: number } | null;
  mapApiKey?: string;
  mapId?: string;
  activeFilters?: ComponentProps<typeof SchoolCard>["activeFilters"];
}

type LocationStatus = "idle" | "requesting" | "ready" | "denied" | "unavailable" | "error";

export function SearchResultsExplorer({
  schools,
  mapSchools,
  geocodedOrigin,
  mapApiKey,
  mapId,
  activeFilters,
}: SearchResultsExplorerProps) {
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(geocodedOrigin ?? null);
  const [locationStatus, setLocationStatus] = useState<LocationStatus>("idle");
  const mapSchoolIds = useMemo(
    () =>
      mapSchools
        .filter((school) => school.lat !== null && school.lng !== null)
        .map((school) => school.id),
    [mapSchools],
  );
  const mapSchoolIdSet = useMemo(() => new Set(mapSchoolIds), [mapSchoolIds]);
  const [visibleSchoolIds, setVisibleSchoolIds] = useState<string[]>(mapSchoolIds);
  const [cardSchools, setCardSchools] = useState<SchoolCardData[]>(schools);
  const [loadingCards, setLoadingCards] = useState(false);

  const requestLocation = useCallback(() => {
    if (typeof window === "undefined") return;
    if (!("geolocation" in navigator)) {
      setLocationStatus("unavailable");
      return;
    }

    setLocationStatus("requesting");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextCenter = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setMapCenter(nextCenter);
        setLocationStatus("ready");
        window.localStorage.setItem(
          LOCATION_CACHE_KEY,
          JSON.stringify({
            lat: nextCenter.lat,
            lng: nextCenter.lng,
            capturedAt: Date.now(),
          }),
        );
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setLocationStatus("denied");
          return;
        }
        setLocationStatus("error");
      },
      {
        enableHighAccuracy: false,
        timeout: 4500,
        maximumAge: 1000 * 60 * 10,
      },
    );
  }, []);

  useEffect(() => {
    setMapCenter(geocodedOrigin ?? null);
  }, [geocodedOrigin]);

  useEffect(() => {
    if (geocodedOrigin) {
      setLocationStatus("ready");
      return;
    }
    if (typeof window === "undefined") return;

    const raw = window.localStorage.getItem(LOCATION_CACHE_KEY);
    if (raw) {
      try {
        const cached = JSON.parse(raw) as { lat?: number; lng?: number; capturedAt?: number };
        if (
          typeof cached.lat === "number" &&
          typeof cached.lng === "number" &&
          typeof cached.capturedAt === "number" &&
          Date.now() - cached.capturedAt < LOCATION_CACHE_MAX_AGE_MS
        ) {
          setMapCenter({ lat: cached.lat, lng: cached.lng });
          setLocationStatus("ready");
          return;
        }
      } catch {
        // Ignore bad cache and request fresh location.
      }
    }

    requestLocation();
  }, [geocodedOrigin, requestLocation]);

  useEffect(() => {
    setVisibleSchoolIds(mapSchoolIds);
  }, [mapSchoolIds]);

  const visibleMapIds = useMemo(
    () => visibleSchoolIds.filter((id) => mapSchoolIdSet.has(id)),
    [visibleSchoolIds, mapSchoolIdSet],
  );

  useEffect(() => {
    let cancelled = false;
    const timeout = setTimeout(() => {
      if (visibleMapIds.length === 0) {
        setCardSchools([]);
        return;
      }

      setLoadingCards(true);
      void getSchoolsForVisiblePinsAction(visibleMapIds)
        .then((results) => {
          if (cancelled) return;
          setCardSchools(results);
        })
        .finally(() => {
          if (cancelled) return;
          setLoadingCards(false);
        });
    }, 180);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [visibleMapIds]);

  const handleVisibleSchoolIdsChange = useCallback((ids: string[]) => {
    setVisibleSchoolIds((previous) => (sameIds(previous, ids) ? previous : ids));
  }, []);

  return (
    <div className="space-y-6">
      <SearchMap
        schools={mapSchools}
        center={mapCenter}
        mapApiKey={mapApiKey}
        mapId={mapId}
        onVisibleSchoolIdsChange={handleVisibleSchoolIdsChange}
      />
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <Button size="sm" type="button" variant="outline" onClick={requestLocation} disabled={locationStatus === "requesting"}>
          {locationStatus === "requesting" ? "Locating..." : "Use my location"}
        </Button>
        {locationStatus === "denied" ? <span>Location permission denied. You can still pan/zoom manually.</span> : null}
        {locationStatus === "unavailable" ? <span>Geolocation is unavailable in this browser.</span> : null}
      </div>

      <div className="relative">
        {loadingCards ? (
          <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center rounded-xl bg-background/75 text-sm text-muted-foreground backdrop-blur-[1px]">
            Updating visible schools...
          </div>
        ) : null}
        {cardSchools.length === 0 ? (
          <div className="surface space-y-4 p-10 text-center text-muted-foreground">
            <p>No schools are visible in the current map view.</p>
            <p className="text-sm">Pan or zoom the map to load schools in a different area.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {cardSchools.map((school, index) => (
              <SchoolCard
                key={school.id}
                school={school}
                imagePriority={index === 0}
                activeFilters={activeFilters}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
