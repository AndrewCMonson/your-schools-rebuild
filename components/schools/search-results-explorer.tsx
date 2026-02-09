"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ComponentProps } from "react";
import { SearchMap } from "@/components/schools/search-map";
import type { SearchMapSchool } from "@/components/schools/search-map";
import { SchoolCard } from "@/components/school-card";
import { getSchoolsForVisiblePinsAction } from "@/lib/actions/school-search-actions";

type SchoolCardData = ComponentProps<typeof SchoolCard>["school"];

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

export function SearchResultsExplorer({
  schools,
  mapSchools,
  geocodedOrigin,
  mapApiKey,
  mapId,
  activeFilters,
}: SearchResultsExplorerProps) {
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
        center={geocodedOrigin}
        mapApiKey={mapApiKey}
        mapId={mapId}
        onVisibleSchoolIdsChange={handleVisibleSchoolIdsChange}
      />

      {loadingCards ? (
        <div className="surface p-6 text-center text-sm text-muted-foreground">Loading visible schools...</div>
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
  );
}
