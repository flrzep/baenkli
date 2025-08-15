"use client";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type Bench = {
  id: string;
  name: string | null;
  location: { lat: number; lng: number } | null;
  rating: number | null;
  image: string | null;
};

export default function BenchesMap({ benches }: { benches: Bench[] }) {
  const position = benches[0]?.location ?? { lat: 47.3769, lng: 8.5417 };

  // Fix default icon paths in Leaflet + Next
  const DefaultIcon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconAnchor: [12, 41],
    iconSize: [25, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });
  L.Marker.prototype.options.icon = DefaultIcon;

  return (
    <MapContainer center={[position.lat, position.lng]} zoom={13} scrollWheelZoom className="h-full w-full">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {benches.map((b) => (
        b.location ? (
          <Marker key={b.id} position={[b.location.lat, b.location.lng]}>
            <Popup>
              <div className="space-y-1">
                <div className="font-medium">{b.name}</div>
                {typeof b.rating === "number" && <div>Rating: {b.rating.toFixed(1)}</div>}
              </div>
            </Popup>
          </Marker>
        ) : null
      ))}
    </MapContainer>
  );
}


