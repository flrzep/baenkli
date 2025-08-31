"use client";
import { useEffect, useMemo, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Database } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapContainer, TileLayer, useMapEvents, useMap } from "react-leaflet";
import type { LatLngLiteral } from "leaflet";
import { BENCH_TYPES, MATERIALS } from "@/lib/benchOptions";

export function BenchForm({ onCreated }: { onCreated?: (benchId: string) => void }) {
  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const [name, setName] = useState("");
  const [center, setCenter] = useState<LatLngLiteral>({ lat: 47.3769, lng: 8.5417 });
  const [includeRating, setIncludeRating] = useState(false);
  const [ratingLocation, setRatingLocation] = useState<number>(3);
  const [ratingComfort, setRatingComfort] = useState<number>(3);
  const [material, setMaterial] = useState<string>("");
  const [type, setType] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setCenter({ lat: latitude, lng: longitude });
        },
        () => {},
        { enableHighAccuracy: true, timeout: 3000 }
      );
    }
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data: auth } = await supabase.auth.getUser();
    const userId = auth.user?.id;

  const { data: benchInsert, error: insertError } = await supabase
      .from("benches")
      .insert({
        name,
    location: center ? { lat: center.lat, lng: center.lng } : null,
        rating: null,
        type: type || null,
      })
      .select("id")
      .single();

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    const benchId = benchInsert?.id;

    if (benchId && userId && (includeRating || material)) {
      await supabase.from("bench_ratings").insert({
        bench_id: benchId,
        profile_id: userId,
        rating_location: includeRating ? Number(ratingLocation) : null,
        rating_comfort: includeRating ? Number(ratingComfort) : null,
        material: material || null,
      });
    }

    setLoading(false);
    setName("");
    setCenter({ lat: 47.3769, lng: 8.5417 });
  setIncludeRating(false);
  setRatingLocation(3);
  setRatingComfort(3);
  setMaterial("");
  setType("");
    if (benchId && onCreated) {
      onCreated(benchId);
    } else {
      alert("Bench created!");
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="type">Type</Label>
        <select
          id="type"
          className="w-full rounded-md border px-3 py-2 text-sm bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          <option value="">Select type</option>
          {BENCH_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label>Location</Label>
        <div className="relative h-72 w-full overflow-hidden rounded-md border">
          <MapContainer center={center} zoom={16} scrollWheelZoom className="h-full w-full z-0">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <CenterWatcher onChange={(ll) => setCenter(ll)} />
            <LocateButtonForm />
          </MapContainer>
          <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full z-10">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 text-red-600 drop-shadow">
              <path fillRule="evenodd" d="M12 2.25c-3.728 0-6.75 3.022-6.75 6.75 0 4.784 6.04 11.038 6.297 11.298a.75.75 0 0 0 1.106 0c.257-.26 6.297-6.514 6.297-11.298 0-3.728-3.022-6.75-6.75-6.75Zm0 9a2.25 2.25 0 1 1 0-4.5 2.25 2.25 0 0 1 0 4.5Z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
        <p className="text-xs text-gray-500">Lat: {center.lat.toFixed(6)}, Lng: {center.lng.toFixed(6)}</p>
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <input id="include_rating" type="checkbox" checked={includeRating} onChange={(e) => setIncludeRating(e.target.checked)} />
          <Label htmlFor="include_rating">Include initial rating</Label>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className={!includeRating ? "opacity-60" : ""}>Location</Label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={5}
                step={0.5}
                value={ratingLocation}
                onChange={(e) => setRatingLocation(parseFloat(e.target.value))}
                className="w-full"
                disabled={!includeRating}
              />
              <span className={`text-sm w-8 text-right ${!includeRating ? "opacity-60" : ""}`}>{ratingLocation.toFixed(1)}</span>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className={!includeRating ? "opacity-60" : ""}>Comfort</Label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={5}
                step={0.5}
                value={ratingComfort}
                onChange={(e) => setRatingComfort(parseFloat(e.target.value))}
                className="w-full"
                disabled={!includeRating}
              />
              <span className={`text-sm w-8 text-right ${!includeRating ? "opacity-60" : ""}`}>{ratingComfort.toFixed(1)}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="material">Material</Label>
        <select
          id="material"
          className="w-full rounded-md border px-3 py-2 text-sm bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700"
          value={material}
          onChange={(e) => setMaterial(e.target.value)}
        >
          <option value="">Select material</option>
          {MATERIALS.map((m) => (
            <option key={m} value={m.toLowerCase()}>{m}</option>
          ))}
        </select>
      </div>
      
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={loading}>{loading ? "Saving..." : "Save"}</Button>
    </form>
  );
}

function CenterWatcher({ onChange }: { onChange: (ll: LatLngLiteral) => void }) {
  useMapEvents({
    moveend: (e) => {
      const c = e.target.getCenter();
      onChange({ lat: c.lat, lng: c.lng });
    },
  });
  return null;
}

function LocateButtonForm() {
  const map = useMap();
  function locate() {
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        map.flyTo([latitude, longitude], Math.max(map.getZoom(), 16), { animate: true, duration: 0.4 });
      },
      () => {},
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 10000 }
    );
  }
  return (
    <div className="absolute bottom-3 right-3 z-[1000]">
      <button
        type="button"
        onClick={locate}
        className="inline-flex items-center justify-center rounded-md bg-white/90 dark:bg-gray-800/90 border border-gray-300 dark:border-gray-700 shadow-sm hover:bg-white dark:hover:bg-gray-800 w-9 h-9"
        aria-label="Use my location"
        title="Use my location"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-gray-700 dark:text-gray-200">
          <path fillRule="evenodd" d="M12 2.25a.75.75 0 0 1 .75.75v1.77a7.23 7.23 0 0 1 6.48 6.48h1.77a.75.75 0 0 1 0 1.5H19.23a7.23 7.23 0 0 1-6.48 6.48v1.77a.75.75 0 0 1-1.5 0V19.23a7.23 7.23 0 0 1-6.48-6.48H2.25a.75.75 0 0 1 0-1.5H4.02a7.23 7.23 0 0 1 6.48-6.48V3a.75.75 0 0 1 .75-.75Zm0 4.5a5.25 5.25 0 1 0 0 10.5 5.25 5.25 0 0 0 0-10.5Zm0 3a2.25 2.25 0 1 1 0 4.5 2.25 2.25 0 0 1 0-4.5Z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );
}


