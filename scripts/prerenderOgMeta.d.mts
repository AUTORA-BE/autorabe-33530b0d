import type { Plugin } from "vite";

export interface PrerenderOgMetaOptions {
  /** Supabase REST base URL, injected from loadEnv() in vite.config.ts. */
  supabaseUrl?: string;
  /** Supabase publishable (anon) key, injected from loadEnv(). */
  anonKey?: string;
}

export declare function prerenderOgMeta(options?: PrerenderOgMetaOptions): Plugin;
