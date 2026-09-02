import { auth, defineMcp } from "@lovable.dev/mcp-js";
import searchListingsTool from "./tools/search-listings";
import getListingTool from "./tools/get-listing";
import myListingsTool from "./tools/my-listings";
import myFavoritesTool from "./tools/my-favorites";

// The OAuth issuer MUST be the direct Supabase host, built from the project ref
// (inlined by Vite at build time so the module stays import-safe).
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "autora",
  title: "AutoRA",
  version: "0.1.0",
  instructions:
    "Outils AutoRA.be, la marketplace automobile belge. `search_listings` recherche des voitures d'occasion publiées, `get_listing` renvoie la fiche complète d'une annonce, `my_listings` liste les annonces de l'utilisateur connecté et `my_favorites` son garage. Toutes les données sont belges (Car-Pass, normes Euro, LEZ).",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [searchListingsTool, getListingTool, myListingsTool, myFavoritesTool],
});
