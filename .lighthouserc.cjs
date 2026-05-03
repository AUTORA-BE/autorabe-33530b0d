module.exports = {
  ci: {
    collect: {
      // Test home + a vehicle listing search page
      url: [
        "https://autorabe.lovable.app/",
        "https://autorabe.lovable.app/?brand=BMW",
      ],
      numberOfRuns: 3,
      settings: {
        preset: "desktop",
        // Mobile preset is more realistic for our audience but slower; we run a
        // separate mobile audit below.
      },
    },
    assert: {
      // Mobile thresholds requested: perf/a11y/seo/best-practices >= 85
      // We use lightweight assertions — we want signal, not bike-shedding.
      assertions: {
        "categories:performance": ["error", { minScore: 0.85 }],
        "categories:accessibility": ["error", { minScore: 0.85 }],
        "categories:best-practices": ["error", { minScore: 0.85 }],
        "categories:seo": ["error", { minScore: 0.85 }],
      },
    },
    upload: {
      target: "temporary-public-storage",
    },
  },
};
