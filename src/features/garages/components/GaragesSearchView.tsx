/**
 * GaragesSearchView — live search of published Pro garages.
 * Uses the public RPC `search_public_vitrines` (RLS-safe, returns only non-PII fields).
 * @module features/garages/components
 */
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, MapPin, Store, ChevronRight, ImageOff } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type VitrineRow = {
  user_id: string;
  display_name: string | null;
  garage_name: string | null;
  avatar_url: string | null;
  postal_code: string | null;
  vitrine_slug: string | null;
  vitrine_cover_url: string | null;
  vitrine_about: string | null;
  vitrine_services: string[] | null;
};

function useDebounced<T>(value: T, ms = 280) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export default function GaragesSearchView() {
  const [q, setQ] = useState("");
  const [city, setCity] = useState("");
  const [rows, setRows] = useState<VitrineRow[]>([]);
  const [loading, setLoading] = useState(true);
  const dq = useDebounced(q);
  const dcity = useDebounced(city);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      const { data, error } = await supabase.rpc("search_public_vitrines", {
        _q: dq || null,
        _city: dcity || null,
        _limit: 60,
      });
      if (cancelled) return;
      if (error) {
        console.error("search_public_vitrines", error);
        setRows([]);
      } else {
        setRows((data ?? []) as VitrineRow[]);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [dq, dcity]);

  const empty = useMemo(() => !loading && rows.length === 0, [loading, rows.length]);

  return (
    <div>
      {/* Search bar */}
      <div className="mb-8 grid gap-3 sm:grid-cols-[1fr_220px]">
        <label className="relative block">
          <span className="sr-only">Nom du garage</span>
          <Search
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60"
            strokeWidth={1.5}
          />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Nom du garage…"
            className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] pl-11 pr-4 text-sm text-white placeholder:text-white/45 outline-none transition focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/30"
          />
        </label>
        <label className="relative block">
          <span className="sr-only">Code postal</span>
          <MapPin
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60"
            strokeWidth={1.5}
          />
          <input
            type="search"
            inputMode="numeric"
            value={city}
            onChange={(e) => setCity(e.target.value.replace(/[^0-9]/g, "").slice(0, 4))}
            placeholder="Code postal"
            className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] pl-11 pr-4 text-sm text-white placeholder:text-white/45 outline-none transition focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/30"
          />
        </label>
      </div>

      {/* Results */}
      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-2xl border border-white/5 bg-white/[0.03]">
              <div className="aspect-[16/9] animate-pulse bg-white/[0.04]" />
              <div className="space-y-3 p-5">
                <div className="h-5 w-2/3 animate-pulse rounded bg-white/[0.04]" />
                <div className="h-3 w-1/3 animate-pulse rounded bg-white/[0.04]" />
              </div>
            </div>
          ))}
        </div>
      ) : empty ? (
        <div className="mx-auto max-w-md rounded-2xl border border-white/5 bg-white/[0.03] px-8 py-12 text-center">
          <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-white/70">
            <Store className="h-5 w-5" strokeWidth={1.5} />
          </div>
          <h3 className="text-base font-medium text-white">Aucun garage trouvé</h3>
          <p className="mt-2 text-[13px] text-white/65">
            Essayez un autre nom ou un autre code postal.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((g, i) => (
            <GarageCard key={g.user_id} g={g} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

function GarageCard({ g, index }: { g: VitrineRow; index: number }) {
  const name = g.garage_name || g.display_name || "Garage";
  const href = g.vitrine_slug ? `/garage/${g.vitrine_slug}` : `/seller/${g.user_id}`;
  const services = (g.vitrine_services ?? []).slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.03, 0.2) }}
    >
      <Link
        to={href}
        className="group block overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition hover:border-primary/40 hover:bg-white/[0.05]"
      >
        <div className="relative aspect-[16/9] overflow-hidden bg-white/[0.04]">
          {g.vitrine_cover_url ? (
            <img
              src={g.vitrine_cover_url}
              alt={name}
              loading="lazy"
              className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="grid h-full w-full place-items-center text-white/30">
              <ImageOff className="h-8 w-8" strokeWidth={1.5} />
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 to-transparent" />
          <div className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-emerald-300 backdrop-blur">
            <Store className="h-3 w-3" strokeWidth={2} />
            Pro vérifié
          </div>
        </div>
        <div className="space-y-2.5 p-5">
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-1 text-[15px] font-medium text-white">{name}</h3>
            <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-white/40 transition group-hover:translate-x-0.5 group-hover:text-primary" strokeWidth={1.5} />
          </div>
          {g.postal_code && (
            <p className="flex items-center gap-1.5 text-xs text-white/65">
              <MapPin className="h-3 w-3" strokeWidth={1.5} />
              {g.postal_code}
            </p>
          )}
          {services.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {services.map((s) => (
                <span
                  key={s}
                  className={cn(
                    "inline-flex items-center rounded-full border border-white/10",
                    "bg-white/[0.04] px-2 py-0.5 text-[10.5px] text-white/70",
                  )}
                >
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
