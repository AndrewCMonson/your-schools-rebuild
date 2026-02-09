"use client";

import { useEffect, useMemo, useRef } from "react";
import { useState } from "react";
import { importLibrary, setOptions } from "@googlemaps/js-api-loader";
import { MarkerClusterer } from "@googlemaps/markerclusterer";

let mapsOptionsInitialized = false;
type MapMarker = google.maps.marker.AdvancedMarkerElement | google.maps.Marker;

export type SearchMapSchool = {
  id: string;
  name: string;
  slug: string;
  lat: number | null;
  lng: number | null;
  city: string;
  state: string;
};

interface SearchMapProps {
  schools: SearchMapSchool[];
  center?: { lat: number; lng: number } | null;
  mapApiKey?: string;
  mapId?: string;
  onVisibleSchoolIdsChange?: (schoolIds: string[]) => void;
}

export function SearchMap({ schools, center, mapApiKey, mapId, onVisibleSchoolIdsChange }: SearchMapProps) {
  const mapNodeRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const onVisibleSchoolIdsChangeRef = useRef(onVisibleSchoolIdsChange);
  const preferredCenterRef = useRef(center ?? null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  preferredCenterRef.current = center ?? null;

  const markerInputs = useMemo(
    () => schools.filter((school) => school.lat !== null && school.lng !== null),
    [schools],
  );

  useEffect(() => {
    onVisibleSchoolIdsChangeRef.current = onVisibleSchoolIdsChange;
  }, [onVisibleSchoolIdsChange]);

  useEffect(() => {
    const key = mapApiKey;
    if (!key || !mapNodeRef.current) {
      return;
    }

    let markersById = new Map<string, MapMarker>();
    let clusterer: MarkerClusterer | null = null;
    let idleListener: google.maps.MapsEventListener | null = null;

    if (!mapsOptionsInitialized) {
      setOptions({ key, v: "weekly" });
      mapsOptionsInitialized = true;
    }
    void Promise.all([importLibrary("maps"), importLibrary("marker")]).then(() => {
      if (!mapNodeRef.current) return;

      const resolvedCenter = preferredCenterRef.current ||
        (markerInputs[0]
          ? {
              lat: markerInputs[0].lat as number,
              lng: markerInputs[0].lng as number,
            }
          : { lat: 37.0902, lng: -95.7129 });

      const map = new google.maps.Map(mapNodeRef.current, {
        center: resolvedCenter,
        zoom: 11,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        mapId: mapId || undefined,
      });
      mapRef.current = map;

      const createMarker = (school: (typeof markerInputs)[number]) => {
        const position = { lat: school.lat as number, lng: school.lng as number };
        const marker = mapId
          ? new google.maps.marker.AdvancedMarkerElement({
              map,
              position,
              title: school.name,
              gmpClickable: true,
            })
          : new google.maps.Marker({
              map,
              position,
              title: school.name,
            });

        const infowindow = new google.maps.InfoWindow({
          content: `<div style=\"font-family:Manrope,sans-serif;\"><strong>${school.name}</strong><br/>${school.city}, ${school.state}<br/><a href=\"/schools/${school.slug}\">View profile</a></div>`,
        });

        if (marker instanceof google.maps.Marker) {
          marker.addListener("click", () => infowindow.open({ map, anchor: marker }));
        } else {
          marker.addEventListener("gmp-click", () => infowindow.open({ map, anchor: marker }));
        }
        return marker;
      };

      clusterer = new MarkerClusterer({ markers: [], map });

      const updateVisibleMarkers = () => {
        const bounds = map.getBounds();
        if (!bounds || !clusterer) return;

        const visibleSchools = markerInputs.filter((school) => {
          const position = new google.maps.LatLng(school.lat as number, school.lng as number);
          return bounds.contains(position);
        });

        const visibleIds = visibleSchools.map((school) => school.id);
        const visibleIdSet = new Set(visibleIds);
        onVisibleSchoolIdsChangeRef.current?.(visibleIds);

        markersById.forEach((marker, schoolId) => {
          if (visibleIdSet.has(schoolId)) return;
          if (marker instanceof google.maps.Marker) {
            marker.setMap(null);
          } else {
            marker.map = null;
          }
          markersById.delete(schoolId);
        });

        visibleSchools.forEach((school) => {
          if (!markersById.has(school.id)) {
            markersById.set(school.id, createMarker(school));
          }
        });

        clusterer.clearMarkers();
        clusterer.addMarkers(Array.from(markersById.values()));
      };

      updateVisibleMarkers();
      idleListener = map.addListener("idle", updateVisibleMarkers);
      setStatus("ready");
    }).catch(() => {
      setStatus("error");
    });

    return () => {
      idleListener?.remove();
      mapRef.current = null;
      markersById.forEach((marker) => {
        if (marker instanceof google.maps.Marker) {
          marker.setMap(null);
        } else {
          marker.map = null;
        }
      });
      markersById.clear();
      if (clusterer) {
        clusterer.clearMarkers();
      }
    };
  }, [mapApiKey, mapId, markerInputs]);

  useEffect(() => {
    if (!center || !mapRef.current) return;
    mapRef.current.panTo(center);
  }, [center]);

  if (!mapApiKey) {
    return (
      <div className="surface p-4 text-sm text-muted-foreground">
        Set `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` or `GOOGLE_MAPS_API_KEY` to render interactive maps.
      </div>
    );
  }

  return (
    <div className="relative">
      {status === "loading" ? (
        <div className="surface absolute inset-0 z-10 grid place-items-center text-sm text-muted-foreground">
          Loading map...
        </div>
      ) : null}
      {status === "error" ? (
        <div className="surface absolute inset-0 z-10 grid place-items-center text-sm text-red-600">
          Map failed to load. Verify your Google Maps API key restrictions.
        </div>
      ) : null}
      <div ref={mapNodeRef} className="surface h-[420px] w-full overflow-hidden" aria-label="School map" />
    </div>
  );
}
