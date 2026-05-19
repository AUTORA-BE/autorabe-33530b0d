/**
 * AmbientBackdrop — fixed luxury backdrop overlay for the Recherche page.
 * Layers a triple radial gradient (#0A1118 deep navy + soft primary halo),
 * a subtle 2.5%-opacity grid texture, and a bottom vignette over the page.
 * Lives below `z-0` so it never blocks interaction.
 * @module components/search
 */
export function AmbientBackdrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {/* Base : bleu nuit profond */}
      <div className="absolute inset-0 bg-[#070B11]" />

      {/* Radial central : illumination subtile #0A1118 → #050810 */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 90% 60% at 50% 18%, rgba(10,17,24,0) 0%, rgba(10,17,24,0.55) 45%, #050810 78%)",
        }}
      />

      {/* Halo discret couleur primary (vert AutoRA) au centre */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle 700px at 50% 35%, hsl(var(--primary) / 0.10) 0%, hsl(var(--primary) / 0) 60%)",
        }}
      />

      {/* Grille luxueuse 64px, 2.5% d'opacité, masquée en bords */}
      <div
        className="absolute inset-0 opacity-[0.025] mix-blend-screen"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,1) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage:
            "radial-gradient(ellipse 85% 70% at 50% 30%, black 30%, transparent 90%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 85% 70% at 50% 30%, black 30%, transparent 90%)",
        }}
      />

      {/* Vignette inférieure */}
      <div
        className="absolute inset-x-0 bottom-0 h-[40vh]"
        style={{
          background:
            "linear-gradient(to top, #050810 0%, rgba(5,8,16,0.4) 60%, rgba(5,8,16,0) 100%)",
        }}
      />
    </div>
  );
}
