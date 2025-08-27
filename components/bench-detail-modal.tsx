"use client";
import { createBrowserClient } from "@supabase/ssr";
import { Database } from "@/lib/types";
import { BenchGallery } from "@/components/bench-gallery";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type Bench = {
  id: string;
  name: string | null;
  type: string | null;
  rating: number | null;
  n_reviews: number | null;
};

type BenchRating = {
  rating_location: number | null;
  rating_comfort: number | null;
};

function StarBar({ value }: { value: number | null }) {
  const percent = typeof value === "number" ? Math.max(0, Math.min(1, value / 5)) * 100 : 0;
  const Star = (
    <svg className="w-4 h-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 22 20">
      <path d="M20.924 7.625a1.523 1.523 0 0 0-1.238-1.044l-5.051-.734-2.259-4.577a1.534 1.534 0 0 0-2.752 0L7.365 5.847l-5.051.734A1.535 1.535 0 0 0 1.463 9.2l3.656 3.563-.863 5.031a1.532 1.532 0 0 0 2.226 1.616L11 17.033l4.518 2.375a1.534 1.534 0 0 0 2.226-1.617l-.863-5.03L20.537 9.2a1.523 1.523 0 0 0 .387-1.575Z"/>
    </svg>
  );
  return (
    <div className="relative inline-block align-middle" aria-label={typeof value === "number" ? `${value.toFixed(2)} out of 5` : "No rating"}>
      <div className="flex gap-0.5 text-gray-300 dark:text-gray-600">
        {Array.from({ length: 5 }).map((_, i) => (
          <span key={`base-${i}`}>{Star}</span>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-0 overflow-hidden" style={{ width: `${percent}%` }}>
        <div className="flex gap-0.5 text-yellow-300">
          {Array.from({ length: 5 }).map((_, i) => (
            <span key={`fill-${i}`}>{Star}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

interface BenchDetailModalProps {
  benchId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function BenchDetailModal({ benchId, isOpen, onClose }: BenchDetailModalProps) {
  const [bench, setBench] = useState<Bench | null>(null);
  const [ratings, setRatings] = useState<BenchRating[]>([]);
  const [loading, setLoading] = useState(false);

  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    if (!benchId || !isOpen) return;

    const fetchBenchDetails = async () => {
      setLoading(true);
      
      // Fetch bench details
      const { data: benchData } = await supabase
        .from("benches")
        .select("id, name, type, rating, n_reviews")
        .eq("id", benchId)
        .single();

      if (benchData) {
        setBench(benchData);

        // Fetch individual ratings
        const { data: ratingsData } = await supabase
          .from("bench_ratings")
          .select("rating_location, rating_comfort")
          .eq("bench_id", benchId);

        setRatings(ratingsData || []);
      }
      
      setLoading(false);
    };

    fetchBenchDetails();
  }, [benchId, isOpen, supabase]);

  if (!isOpen || !bench) return null;

  const valuesLocation = ratings.map((r) => r.rating_location).filter((v): v is number => typeof v === "number");
  const valuesComfort = ratings.map((r) => r.rating_comfort).filter((v): v is number => typeof v === "number");

  const avg = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null);
  const avgLocation = avg(valuesLocation);
  const avgComfort = avg(valuesComfort);

  const overall = typeof bench.rating === "number"
    ? bench.rating
    : avg([...(avgLocation ? [avgLocation] : []), ...(avgComfort ? [avgComfort] : [])]) ?? null;

  const comfort10 = typeof avgComfort === "number" ? avgComfort * 2 : null;
  const location10 = typeof avgLocation === "number" ? avgLocation * 2 : null;

  const reviewsCount = typeof bench.n_reviews === "number" ? bench.n_reviews : ratings.length;

  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h1 className="text-2xl font-semibold">{bench.name}</h1>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl font-bold"
            >
              ×
            </button>
          </div>

          {typeof bench.rating === "number" ? (
            <div className="flex items-center m-0 mb-4">
              <svg className="w-4 h-4 text-yellow-300 me-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 22 20">
                <path d="M20.924 7.625a1.523 1.523 0 0 0-1.238-1.044l-5.051-.734-2.259-4.577a1.534 1.534 0 0 0-2.752 0L7.365 5.847l-5.051.734A1.535 1.535 0 0 0 1.463 9.2l3.656 3.563-.863 5.031a1.532 1.532 0 0 0 2.226 1.616L11 17.033l4.518 2.375a1.534 1.534 0 0 0 2.226-1.617l-.863-5.03L20.537 9.2a1.523 1.523 0 0 0 .387-1.575Z"/>
              </svg>
              <p className="m-0 text-sm font-bold text-gray-900 dark:text-white">{bench.rating.toFixed(2)}</p>
              <span className="w-1 h-1 mx-1.5 bg-gray-500 rounded-full dark:bg-gray-400"></span>
              <span className="text-sm font-normal text-gray-500 dark:text-white">{reviewsCount} reviews</span>
            </div>
          ) : (
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">not yet rated</div>
          )}

          <div className="mt-6">
            <BenchGallery benchId={bench.id} fullWidth={false} />
            <div className="flex gap-2 justify-start mt-4">
              <button type="button" className="flex items-center gap-2 text-white bg-blue-700 hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 font-medium rounded-full text-sm px-5 py-2.5 text-left mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487a2.1 2.1 0 1 1 2.97 2.97L7.5 19.789l-4 1 1-4 12.362-12.302Z" />
                </svg>
                Edit
              </button>
              <button type="button" className="flex items-center gap-2 text-white bg-blue-700 hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 font-medium rounded-full text-sm px-5 py-2.5 text-left mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5V7.5A2.25 2.25 0 0 1 5.25 5.25h13.5A2.25 2.25 0 0 1 21 7.5v9a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 16.5Zm0 0l4.5-4.5a2.25 2.25 0 0 1 3.182 0l2.068 2.068a2.25 2.25 0 0 0 3.182 0L21 7.5" />
                </svg>
                Add Image
              </button>
              <button type="button" className="flex items-center gap-2 text-white bg-blue-700 hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 font-medium rounded-full text-sm px-5 py-2.5 text-left mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" className="w-5 h-5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M8.625 9.75a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 0 1 .778-.332 48.294 48.294 0 0 0 5.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                </svg>
                Add Review
              </button>
            </div>
          </div>

          {/* Rating summary */}
          <div className="mt-6">
            <div className="mb-5">
              <h1 className="text-xl font-semibold mb-2 mt-6">Reviews</h1>
              <div className="flex items-center gap-2">
                <StarBar value={overall} />
                <p className="bg-gray-100 text-sm font-semibold inline-flex items-center p-1.5 rounded-sm dark:bg-blue-200 dark:text-blue-800">
                  {overall !== null ? overall.toFixed(1) : "-"}
                </p>
                <p className="ms-2 font-medium text-gray-900 dark:text-white">{overall !== null ? "Excellent" : "Not yet rated"}</p>
                <span className="w-1 h-1 mx-2 bg-gray-900 rounded-full dark:bg-gray-500"></span>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{reviewsCount} reviews</p>
                <a href="#" className="ms-auto text-sm font-medium text-blue-600 hover:underline dark:text-blue-500">Read all reviews</a>
              </div>
            </div>

            <div className="gap-8 sm:grid sm:grid-cols-2">
              <div>
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Location</dt>
                  <dd className="flex items-center mb-3">
                    <div className="w-full bg-gray-200 rounded-sm h-2.5 dark:bg-gray-700 me-2">
                      <div className="bg-blue-600 h-2.5 rounded-sm dark:bg-blue-500" style={{ width: `${location10 !== null ? Math.min(100, Math.max(0, (location10 / 10) * 100)) : 0}%` }}></div>
                    </div>
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{location10 !== null ? location10.toFixed(1) : "-"}</span>
                  </dd>
                </dl>
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Comfort</dt>
                  <dd className="flex items-center mb-3">
                    <div className="w-full bg-gray-200 rounded-sm h-2.5 dark:bg-gray-700 me-2">
                      <div className="bg-blue-600 h-2.5 rounded-sm dark:bg-blue-500" style={{ width: `${comfort10 !== null ? Math.min(100, Math.max(0, (comfort10 / 10) * 100)) : 0}%` }}></div>
                    </div>
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{comfort10 !== null ? comfort10.toFixed(1) : "-"}</span>
                  </dd>
                </dl>
              </div>
              <div>
                {/* Placeholder for more categories later */}
              </div>
            </div>
          </div>

          {bench.type && (
            <div className="mt-6">
              <h2 className="text-lg font-medium mb-1">Type</h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">{bench.type}</p>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
