// Minimal Database types for Supabase
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; username: string | null; avatar_url: string | null }
        Insert: { id: string; username?: string | null; avatar_url?: string | null }
        Update: { username?: string | null; avatar_url?: string | null }
      }
      benches: {
        Row: { id: string; name: string | null; location: { lat: number; lng: number } | null; rating: number | null; image: string | null }
        Insert: { id?: string; name?: string | null; location?: { lat: number; lng: number } | null; rating?: number | null; image?: string | null }
        Update: { name?: string | null; location?: { lat: number; lng: number } | null; rating?: number | null; image?: string | null }
      }
      bench_ratings: {
        Row: { id: string; bench_id: string; profile_id: string; rating_location: number | null; rating_comfort: number | null; material: string | null }
        Insert: { id?: string; bench_id: string; profile_id: string; rating_location?: number | null; rating_comfort?: number | null; material?: string | null }
        Update: { rating_location?: number | null; rating_comfort?: number | null; material?: string | null }
      }
    }
  }
}


