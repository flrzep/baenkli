"use client";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useMemo } from "react";
import { BenchGallery } from "@/components/bench-gallery";

type Bench = {
  id: string;
  name: string | null;
  location: { lat: number; lng: number } | null;
  rating: number | null;
  n_reviews: number | null;
};

export default function BenchesMap({ benches }: { benches: Bench[] }) {
  const position = benches[0]?.location ?? { lat: 47.3769, lng: 8.5417 };

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

  return (
    <MapContainer center={[position.lat, position.lng]} zoom={13} scrollWheelZoom className="h-full w-full">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {benches.map((b) => (
        b.location ? (
          //<Marker key={b.id} position={[b.location.lat, b.location.lng]}>
          <Marker key={b.id} position={[b.location.lat, b.location.lng]} icon={customPin} >
            <Popup>
              <div className="">
                <BenchGallery benchId={b.id} />
                <div className="text-lg font-medium">{b.name}</div>
                {typeof b.rating === "number" && (
                  <div className="flex items-center m-0">
                    <svg className="w-4 h-4 text-yellow-300 me-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 22 20">
                      <path d="M20.924 7.625a1.523 1.523 0 0 0-1.238-1.044l-5.051-.734-2.259-4.577a1.534 1.534 0 0 0-2.752 0L7.365 5.847l-5.051.734A1.535 1.535 0 0 0 1.463 9.2l3.656 3.563-.863 5.031a1.532 1.532 0 0 0 2.226 1.616L11 17.033l4.518 2.375a1.534 1.534 0 0 0 2.226-1.617l-.863-5.03L20.537 9.2a1.523 1.523 0 0 0 .387-1.575Z"/>
                    </svg>
                    <p className="m-0 text-sm font-bold text-gray-900 dark:text-white">{b.rating.toFixed(2)}</p>
                    <span className="w-1 h-1 mx-1.5 bg-gray-500 rounded-full dark:bg-gray-400"></span>
                    <span className="text-sm font-normal text-gray-500 dark:text-white">{b.n_reviews} reviews</span>
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ) : null
      ))}
    </MapContainer>
  );
}


