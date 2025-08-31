"use client";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useMemo, useState } from "react";
import { BenchGallery } from "@/components/bench-gallery";
import { BenchDetailModal } from "@/components/bench-detail-modal";
import { createBrowserClient } from "@supabase/ssr";
import { Database } from "@/lib/types";

type Bench = {
  id: string;
  name: string | null;
  location: { lat: number; lng: number } | null;
  rating: number | null;
  n_reviews: number | null;
};

export default function BenchesMap({ benches }: { benches: Bench[] }) {
  const [selectedBenchId, setSelectedBenchId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [popupRefreshKey, setPopupRefreshKey] = useState(0);
  const [rows, setRows] = useState<Bench[]>(benches);

  // keep local copy in sync if parent updates benches
  useEffect(() => {
    setRows(benches);
  }, [benches]);

  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  async function refreshBenchRow(id: string) {
    const { data } = await supabase
      .from("benches")
      .select("id,name,location,rating,n_reviews")
      .eq("id", id)
      .single();
    if (data) {
      setRows((prev) => prev.map((b) => (b.id === id ? { ...b, ...data } : b)));
    }
  }

  const position = rows[0]?.location ?? { lat: 47.3769, lng: 8.5417 };

  // Use custom SVG pin
  const DefaultIcon = L.icon({
    iconUrl: "/pin-color-2.svg",
    iconSize: [39, 51],
    iconAnchor: [19.5, 51],
  });
  L.Marker.prototype.options.icon = DefaultIcon;

  const customPin = useMemo(
    () =>
      L.icon({
        // iconUrl: "/pin.svg",
        iconUrl: "/pin.png",
        iconSize: [64, 64],
        iconAnchor: [32, 60],
        popupAnchor: [1, -50],
      }),
    []
  );

  const handleBenchClick = (benchId: string) => {
    setSelectedBenchId(benchId);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedBenchId(null);
  };

  return (
    <>
      <MapContainer center={[position.lat, position.lng]} zoom={13} scrollWheelZoom className="h-full w-full z-0">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
  {rows.map((b) => (
          b.location ? (
            //<Marker key={b.id} position={[b.location.lat, b.location.lng]}>
            <Marker key={b.id} position={[b.location.lat, b.location.lng]} icon={customPin} >
              <Popup>
                <div className="min-w-40">
                  {/* images */}
                  <BenchGallery benchId={b.id} fullWidth={true} refreshKey={popupRefreshKey} />
                  <div className="text-lg font-medium">
                    <button
                      onClick={() => handleBenchClick(b.id)}
                      className="underline hover:no-underline text-left"
                    >
                      {b.name}
                    </button>
                  </div>
                  {/* rating */}
                  {typeof b.rating === "number" ? (
                    <div className="flex items-center m-0">
                      <svg className="w-4 h-4 text-yellow-300 me-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 22 20">
                        <path d="M20.924 7.625a1.523 1.523 0 0 0-1.238-1.044l-5.051-.734-2.259-4.577a1.534 1.534 0 0 0-2.752 0L7.365 5.847l-5.051.734A1.535 1.535 0 0 0 1.463 9.2l3.656 3.563-.863 5.031a1.532 1.532 0 0 0 2.226 1.616L11 17.033l4.518 2.375a1.534 1.534 0 0 0 2.226-1.617l-.863-5.03L20.537 9.2a1.523 1.523 0 0 0 .387-1.575Z"/>
                      </svg>
                      <p className="m-0 text-sm font-bold text-gray-900 dark:text-white">{b.rating.toFixed(2)}</p>
                      <span className="w-1 h-1 mx-1.5 bg-gray-500 rounded-full dark:bg-gray-400"></span>
                      <span className="text-sm font-normal text-gray-500 dark:text-white">{b.n_reviews} reviews</span>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 dark:text-gray-400">not yet rated</div>
                  )}
                </div>
              </Popup>
            </Marker>
          ) : null
        ))}
      </MapContainer>

      <BenchDetailModal
        benchId={selectedBenchId}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onUpdated={() => {
          setPopupRefreshKey((k) => k + 1);
          if (selectedBenchId) refreshBenchRow(selectedBenchId);
        }}
      />
    </>
  );
}


