"use client";
import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Database } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function BenchForm() {
  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const [name, setName] = useState("");
  const [lat, setLat] = useState<number | "">("");
  const [lng, setLng] = useState<number | "">("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [ratingLocation, setRatingLocation] = useState<number | "">("");
  const [ratingComfort, setRatingComfort] = useState<number | "">("");
  const [material, setMaterial] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    let imageUrl: string | null = null;
    if (imageFile) {
      const filePath = `${Date.now()}_${imageFile.name}`;
      const { data, error } = await supabase.storage
        .from(process.env.NEXT_PUBLIC_SUPABASE_BUCKET_BENCHES || "benches")
        .upload(filePath, imageFile, { upsert: true });
      if (!error && data) {
        const { data: pub } = supabase.storage
          .from(process.env.NEXT_PUBLIC_SUPABASE_BUCKET_BENCHES || "benches")
          .getPublicUrl(data.path);
        imageUrl = pub.publicUrl;
      }
    }

    const { data: auth } = await supabase.auth.getUser();
    const userId = auth.user?.id;

    const { data: benchInsert, error: insertError } = await supabase
      .from("benches")
      .insert({
        name,
        location: lat !== "" && lng !== "" ? { lat: Number(lat), lng: Number(lng) } : null,
        rating: null,
        image: imageUrl,
      })
      .select("id")
      .single();

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    if (benchInsert?.id && userId && (ratingLocation !== "" || ratingComfort !== "" || material)) {
      await supabase.from("bench_ratings").insert({
        bench_id: benchInsert.id,
        profile_id: userId,
        rating_location: ratingLocation === "" ? null : Number(ratingLocation),
        rating_comfort: ratingComfort === "" ? null : Number(ratingComfort),
        material: material || null,
      });
    }

    setLoading(false);
    setName("");
    setLat("");
    setLng("");
    setImageFile(null);
    setRatingLocation("");
    setRatingComfort("");
    setMaterial("");
    alert("Bench created!");
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="lat">Latitude</Label>
          <Input id="lat" type="number" value={lat} onChange={(e) => setLat(Number(e.target.value))} step="any" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lng">Longitude</Label>
          <Input id="lng" type="number" value={lng} onChange={(e) => setLng(Number(e.target.value))} step="any" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="rating_location">Location Rating (0-5)</Label>
          <Input id="rating_location" type="number" min={0} max={5} step={0.5} value={ratingLocation} onChange={(e) => setRatingLocation(Number(e.target.value))} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="rating_comfort">Comfort Rating (0-5)</Label>
          <Input id="rating_comfort" type="number" min={0} max={5} step={0.5} value={ratingComfort} onChange={(e) => setRatingComfort(Number(e.target.value))} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="material">Material</Label>
        <Input id="material" value={material} onChange={(e) => setMaterial(e.target.value)} placeholder="wood, metal, stone..." />
      </div>
      <div className="space-y-2">
        <Label htmlFor="image">Image</Label>
        <input id="image" type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] ?? null)} />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={loading}>{loading ? "Saving..." : "Save"}</Button>
    </form>
  );
}


