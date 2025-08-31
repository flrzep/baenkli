"use client";
import { createBrowserClient } from "@supabase/ssr";
import { Database } from "@/lib/types";
import { BenchGallery } from "@/components/bench-gallery";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";

import UploadDialog from "@/components/upload-dialog";
import { BENCH_TYPES, MATERIALS } from "@/lib/benchOptions";
import ReviewDialog from "@/components/review-dialog";

type Bench = {
  id: string;
  name: string | null;
  type: string | null;
  rating: number | null;
  n_reviews: number | null;
  avg_location?: number | null;
  avg_comfort?: number | null;
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
  onUpdated?: () => void;
}

export function BenchDetailModal({ benchId, isOpen, onClose, onUpdated }: BenchDetailModalProps) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [bench, setBench] = useState<Bench | null>(null);
  const [loading, setLoading] = useState(false);
  const [showUpload, setShowUpload] = useState(false)
  const [showReview, setShowReview] = useState(false);
  const [galleryRefresh, setGalleryRefresh] = useState(0);
  const [ownerName, setOwnerName] = useState<string | null>(null);
  const [createdById, setCreatedById] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState<string>("");
  const [editType, setEditType] = useState<string>("");
  const [editMaterial, setEditMaterial] = useState<string>("");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  // No bench_ratings reads in modal; ReviewDialog handles rating CRUD



  const fetchBenchDetails = useCallback(async () => {
    if (!benchId) return;
    setLoading(true);
    const { data: benchData } = await supabase
      .from("benches")
      .select("*")
      .eq("id", benchId)
      .single();

    if (benchData) {
      setBench(benchData);

      const creatorId = (benchData as any).created_by;
      setCreatedById(creatorId ?? null);
      if (creatorId) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", creatorId)
          .single();
        setOwnerName(profile?.username ?? null);
      } else {
        setOwnerName(null);
      }

  // Ratings come from benches aggregates
    }
    setLoading(false);
  }, [benchId, supabase]);

  useEffect(() => {
    if (!benchId || !isOpen) return;
    fetchBenchDetails();
  }, [benchId, isOpen, fetchBenchDetails]);

  // Turn off edit mode when the modal closes
  useEffect(() => {
    if (!isOpen) {
      setEditMode(false);
      setSaveError(null);
      setSaving(false);
    }
  }, [isOpen]);

  // Load current user info and role to decide edit permissions
  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();
      const user = data?.user;
      setCurrentUserId(user?.id ?? null);
      const appRole = (user?.app_metadata as any)?.role;
      setIsAdmin(appRole === "admin");
    };
    if (isOpen) loadUser();
  }, [isOpen, supabase]);

  // Do not query bench_ratings here

  if (!isOpen || !bench) return null;

  const overall = typeof bench.rating === "number" ? bench.rating : null;
  const avgLocation = typeof bench.avg_location === "number" ? bench.avg_location : null;
  const avgComfort = typeof bench.avg_comfort === "number" ? bench.avg_comfort : null;
  const comfort10 = typeof avgComfort === "number" ? avgComfort * 2 : null;
  const location10 = typeof avgLocation === "number" ? avgLocation * 2 : null;
  const reviewsCount = typeof bench.n_reviews === "number" ? bench.n_reviews : 0;

  function handleUploaded() {
    // Bump key to trigger gallery reload
    setGalleryRefresh((k) => k + 1);
  // Also refresh bench-related data just in case
  fetchBenchDetails();
  onUpdated?.();
  }

  // Guard actions behind authentication
  async function requireAuth(): Promise<boolean> {
    const { data } = await supabase.auth.getUser();
    if (!data?.user) {
      router.push("/login");
      return false;
    }
    return true;
  }

  async function handleAddImageClick() {
    if (!(await requireAuth())) return;
    setShowUpload(true);
  }

  async function handleEditClick() {
    if (!(await requireAuth())) return;
  if (!bench) return;
  setEditName(bench.name ?? "");
  setEditType((bench as any).type ?? "");
  setEditMaterial((bench as any).material ?? "");
  setSaveError(null);
  setEditMode(true);
  }

  async function handleAddReviewClick() {
    if (!(await requireAuth())) return;
  setShowReview(true);
  }

  const isOwner = currentUserId !== null && createdById !== null && currentUserId === createdById;
  const canEdit = isAdmin || isOwner;

  async function handleSaveEdit() {
    if (!benchId) return;
    setSaving(true);
    setSaveError(null);
  const updates: any = { name: editName, type: editType, material: editMaterial };
    const { error } = await supabase
      .from("benches")
      .update(updates)
      .eq("id", benchId);
    if (error) {
      setSaveError(error.message);
    } else {
  setBench((prev) => (prev ? { ...prev, name: editName, type: editType, material: editMaterial } : prev));
      setEditMode(false);
  // Reload from server to ensure consistency
  fetchBenchDetails();
  onUpdated?.();
    }
    setSaving(false);
  }

  function handleCancelEdit() {
    setEditMode(false);
    setSaveError(null);
  }

  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-3xl w-full max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          {/* Sticky header */}
          <div
  className="sticky top-6 z-10 pb-2 pl-2 ml-[-0.5rem] w-full"
  style={{
    background: "linear-gradient(0deg, rgba(255,255,255,0) 0%, rgba(255,255,255,1) 10%, rgba(255,255,255,1) 100%)"
  }}
>
            <div className="flex justify-between items-start mb-2">
              {editMode ? (
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="text-2xl font-semibold border rounded px-2 py-1 w-full max-w-md"
                  placeholder="Bench name"
                />
              ) : (
                <h1 className="text-2xl font-semibold">{bench.name}</h1>
              )}
              <button
                onClick={() => {
                  setEditMode(false);
                  setSaveError(null);
                  setSaving(false);
                  onClose();
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            {saveError && (
              <div className="text-xs text-red-600 mb-1">{saveError}</div>
            )}
            {(isOwner || ownerName) && (
              <div className="text-xs text-gray-500 -mt-1 mb-1">created by {isOwner ? "you" : ownerName}</div>
            )}
            {typeof bench.rating === "number" ? (
              <div className="flex items-center m-0 mb-2">
                <svg className="w-4 h-4 text-yellow-300 me-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 22 20">
                  <path d="M20.924 7.625a1.523 1.523 0 0 0-1.238-1.044l-5.051-.734-2.259-4.577a1.534 1.534 0 0 0-2.752 0L7.365 5.847l-5.051.734A1.535 1.535 0 0 0 1.463 9.2l3.656 3.563-.863 5.031a1.532 1.532 0 0 0 2.226 1.616L11 17.033l4.518 2.375a1.534 1.534 0 0 0 2.226-1.617l-.863-5.03L20.537 9.2a1.523 1.523 0 0 0 .387-1.575Z"/>
                </svg>
                <p className="m-0 text-sm font-bold text-gray-900 dark:text-white">{bench.rating.toFixed(2)}</p>
                <span className="w-1 h-1 mx-1.5 bg-gray-500 rounded-full dark:bg-gray-400"></span>
                <span className="text-sm font-normal text-gray-500 dark:text-white">{reviewsCount} reviews</span>
              </div>
            ) : (
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">not yet rated</div>
            )}
          </div>

          <div className="mt-0">
            <BenchGallery
              benchId={bench.id}
              fullWidth={false}
              refreshKey={galleryRefresh}
              canDelete={editMode && canEdit}
              onDeleted={() => {
                // keep modal gallery and external popups in sync after deletion
                setGalleryRefresh((k) => k + 1);
                onUpdated?.();
              }}
            />
            <div className="flex gap-2  flex-wrap justify-start mt-4">
              {canEdit && !editMode && (
                <button type="button" onClick={handleEditClick} className="flex items-center gap-2 text-white bg-blue-700 hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 font-medium rounded-full text-sm px-5 py-2.5 text-left mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487a2.1 2.1 0 1 1 2.97 2.97L7.5 19.789l-4 1 1-4 12.362-12.302Z" />
                  </svg>
                  Edit
                </button>
              )}
              {editMode && (
                <>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={handleSaveEdit}
                    className="flex items-center gap-2 text-white bg-green-700 hover:bg-green-800 disabled:opacity-60 focus:outline-none focus:ring-4 focus:ring-green-300 font-medium rounded-full text-sm px-5 py-2.5 text-left mb-2"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="flex items-center gap-2 text-gray-700 bg-gray-200 hover:bg-gray-300 focus:outline-none focus:ring-4 focus:ring-gray-300 font-medium rounded-full text-sm px-5 py-2.5 text-left mb-2"
                  >
                    Cancel
                  </button>
                </>
              )}
              <button
                type="button"
                className="text-white bg-blue-700 hover:bg-blue-800 focus:outline-none focus:ring-4 gap-2 focus:ring-blue-300 font-medium rounded-full text-sm px-5 py-2.5 text-center me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800  flex items-center justify-start"
                onClick={handleAddImageClick}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" className="w-5 h-5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                </svg>

                Add Image
              </button>
              <button type="button" onClick={handleAddReviewClick} className="flex items-center gap-2 text-white bg-blue-700 hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 font-medium rounded-full text-sm px-5 py-2.5 text-left mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" className="w-5 h-5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M8.625 9.75a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 0 1 .778-.332 48.294 48.294 0 0 0 5.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                </svg>
                Add review
              </button>
            </div>
          </div>

          {/* Rating summary */}
          <div className="mt-6">
            <div className="mb-5">
              <h1 className="text-xl font-semibold mb-2 mt-6">Reviews</h1>
              <div className="flex items-center gap-2 flex-wrap">
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

          <div className="mt-6">
            <h2 className="text-lg font-medium mb-1">Type</h2>
            {editMode ? (
              <select
                value={editType}
                onChange={(e) => setEditType(e.target.value)}
                className="text-sm border rounded px-2 py-1 w-full max-w-md bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700"
              >
                <option value="">Select type</option>
                {BENCH_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            ) : (
              <p className="text-sm text-gray-600 dark:text-gray-300">{bench.type ?? "-"}</p>
            )}
          </div>

          <div className="mt-4">
            <h2 className="text-lg font-medium mb-1">Material</h2>
            {editMode ? (
              <select
                value={editMaterial}
                onChange={(e) => setEditMaterial(e.target.value)}
                className="text-sm border rounded px-2 py-1 w-full max-w-md bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700"
              >
                <option value="">Select material</option>
                {MATERIALS.map((m) => (
                  <option key={m} value={m.toLowerCase()}>{m}</option>
                ))}
              </select>
            ) : (
              <p className="text-sm text-gray-600 dark:text-gray-300">{(bench as any).material ?? "-"}</p>
            )}
          </div>
        </div>
      </div>

      {showUpload && benchId && (
        <UploadDialog
          benchId={benchId}
          open={showUpload}
          onClose={() => setShowUpload(false)}
          onUploaded={() => handleUploaded()}
        />
      )}
      {showReview && benchId && (
        <ReviewDialog
          benchId={benchId}
          open={showReview}
          onClose={() => setShowReview(false)}
          onSaved={() => {
            // refresh local rating data and external popups
            fetchBenchDetails();
            onUpdated?.();
          }}
        />
      )}
    </div>,
    document.body
  );
}
