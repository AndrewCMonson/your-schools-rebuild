interface SchoolMapProps {
  lat: number | null;
  lng: number | null;
  name: string;
}

export function SchoolMap({ lat, lng, name }: SchoolMapProps) {
  if (!lat || !lng) {
    return <div className="surface p-4 text-sm text-muted-foreground">Map coordinates are not available yet.</div>;
  }

  const query = encodeURIComponent(`${lat},${lng} (${name})`);

  return (
    <div className="surface overflow-hidden">
      <iframe
        title={`Map for ${name}`}
        src={`https://www.google.com/maps?q=${query}&z=14&output=embed`}
        loading="lazy"
        className="h-80 w-full"
      />
    </div>
  );
}
