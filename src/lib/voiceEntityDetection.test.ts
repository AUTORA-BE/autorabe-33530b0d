import { describe, it, expect } from "vitest";
import { detectEntities, parseVoiceTranscript } from "./voiceEntityDetection";

const BRANDS = ["Volkswagen", "BMW", "Audi", "Renault", "Peugeot", "Mercedes", "Toyota", "Ford"];

describe("detectEntities", () => {
  it("returns empty array for empty transcript", () => {
    expect(detectEntities("", BRANDS)).toEqual([]);
  });

  it("detects a brand", () => {
    const result = detectEntities("je cherche une BMW", BRANDS);
    expect(result).toContainEqual({ type: "brand", value: "BMW" });
  });

  it("detects a budget with euro symbol", () => {
    const result = detectEntities("moins de 25000€", BRANDS);
    expect(result).toContainEqual(
      expect.objectContaining({ type: "budget" })
    );
  });

  it("detects a budget with word euro", () => {
    const result = detectEntities("budget 30000 euro", BRANDS);
    expect(result).toContainEqual(
      expect.objectContaining({ type: "budget" })
    );
  });

  it("normalizes small budget numbers (multiplies by 1000)", () => {
    const result = detectEntities("15 euro", BRANDS);
    // 15 < 1000 → 15000, should match "< 15 000€"
    expect(result).toContainEqual(
      expect.objectContaining({ type: "budget", value: "< 15 000€" })
    );
  });

  it("detects mileage", () => {
    const result = detectEntities("80000 km", BRANDS);
    expect(result).toContainEqual(
      expect.objectContaining({ type: "mileage" })
    );
  });

  it("normalizes small mileage values", () => {
    const result = detectEntities("50 kilomètres", BRANDS);
    const mileage = result.find(e => e.type === "mileage");
    expect(mileage).toBeDefined();
    expect(mileage!.value).toContain("50");
    // 50 < 1000 → 50000
    expect(mileage!.value).toContain("000");
  });

  it("detects fuel type - diesel", () => {
    const result = detectEntities("une voiture diesel", BRANDS);
    expect(result).toContainEqual({ type: "fuel", value: "Diesel" });
  });

  it("detects fuel type - essence", () => {
    const result = detectEntities("je veux essence", BRANDS);
    expect(result).toContainEqual({ type: "fuel", value: "Essence" });
  });

  it("detects fuel type - électrique", () => {
    const result = detectEntities("voiture électrique", BRANDS);
    expect(result).toContainEqual({ type: "fuel", value: "Électrique" });
  });

  it("detects fuel type - hybride", () => {
    const result = detectEntities("un hybride svp", BRANDS);
    expect(result).toContainEqual({ type: "fuel", value: "Hybride" });
  });

  it("detects transmission - automatique", () => {
    const result = detectEntities("boîte automatique", BRANDS);
    expect(result).toContainEqual({ type: "transmission", value: "Automatique" });
  });

  it("detects transmission - manuelle", () => {
    const result = detectEntities("transmission manuelle", BRANDS);
    expect(result).toContainEqual({ type: "transmission", value: "Manuelle" });
  });

  it("detects color - blanc", () => {
    const result = detectEntities("voiture blanche", BRANDS);
    expect(result).toContainEqual({ type: "color", value: "Blanc" });
  });

  it("detects color - noir", () => {
    const result = detectEntities("BMW noir", BRANDS);
    expect(result).toContainEqual({ type: "color", value: "Noir" });
  });

  it("detects color - Dutch (rood)", () => {
    const result = detectEntities("rode auto", BRANDS);
    expect(result).toContainEqual({ type: "color", value: "Rouge" });
  });

  it("detects euro norm", () => {
    const result = detectEntities("voiture Euro 6", BRANDS);
    expect(result).toContainEqual({ type: "euroNorm", value: "Euro 6" });
  });

  it("detects euro norm - euro 6d", () => {
    const result = detectEntities("euro 6d diesel", BRANDS);
    expect(result).toContainEqual({ type: "euroNorm", value: "Euro 6D" });
  });

  it("detects multiple entities from a complex sentence", () => {
    const result = detectEntities(
      "Volkswagen diesel automatique euro 6 moins de 25000 euros 80000 km",
      BRANDS
    );
    const types = result.map(e => e.type);
    expect(types).toContain("brand");
    expect(types).toContain("budget");
    expect(types).toContain("mileage");
    expect(types).toContain("fuel");
    expect(types).toContain("transmission");
    expect(types).toContain("euroNorm");
    expect(result).toHaveLength(6);
  });

  it("detects Dutch keywords - benzine", () => {
    const result = detectEntities("ik zoek benzine", BRANDS);
    expect(result).toContainEqual({ type: "fuel", value: "Essence" });
  });

  it("detects Dutch keywords - automatisch", () => {
    const result = detectEntities("automatisch", BRANDS);
    expect(result).toContainEqual({ type: "transmission", value: "Automatique" });
  });
});

describe("parseVoiceTranscript", () => {
  it("returns empty params for empty transcript", () => {
    const result = parseVoiceTranscript("", BRANDS);
    expect(result.brand).toBeUndefined();
    expect(result.maxBudget).toBeUndefined();
    expect(result.maxMileage).toBeUndefined();
    expect(result.fuelType).toBeUndefined();
    expect(result.transmission).toBeUndefined();
  });

  it("parses brand", () => {
    const result = parseVoiceTranscript("BMW série 3", BRANDS);
    expect(result.brand).toBe("BMW");
  });

  it("parses budget", () => {
    const result = parseVoiceTranscript("moins de 25000 euros", BRANDS);
    expect(result.maxBudget).toBe(25000);
  });

  it("parses mileage", () => {
    const result = parseVoiceTranscript("100000 km maximum", BRANDS);
    expect(result.maxMileage).toBe(100000);
  });

  it("parses fuel type", () => {
    const result = parseVoiceTranscript("diesel", BRANDS);
    expect(result.fuelType).toBe("diesel");
  });

  it("parses transmission", () => {
    const result = parseVoiceTranscript("automatique", BRANDS);
    expect(result.transmission).toBe("automatique");
  });

  it("extracts remaining text as potential model", () => {
    const result = parseVoiceTranscript("BMW série 3 diesel", BRANDS);
    expect(result.brand).toBe("BMW");
    expect(result.fuelType).toBe("diesel");
    expect(result.remainingText).toContain("série 3");
  });

  it("parses color", () => {
    const result = parseVoiceTranscript("BMW grise", BRANDS);
    expect(result.color).toBe("gris");
    expect(result.brand).toBe("BMW");
  });

  it("parses euro norm", () => {
    const result = parseVoiceTranscript("voiture euro 5", BRANDS);
    expect(result.euroNorm).toBe("5");
  });

  it("parses a full complex sentence", () => {
    const result = parseVoiceTranscript(
      "Audi diesel automatique euro 6 moins de 40000 euros 80000 km",
      BRANDS
    );
    expect(result.brand).toBe("Audi");
    expect(result.fuelType).toBe("diesel");
    expect(result.transmission).toBe("automatique");
    expect(result.euroNorm).toBe("6");
    expect(result.maxBudget).toBe(40000);
    expect(result.maxMileage).toBe(80000);
  });

  it("handles 'mille' keyword for budget", () => {
    const result = parseVoiceTranscript("20 mille euros", BRANDS);
    expect(result.maxBudget).toBe(25000); // 20*1000=20000, nearest option ≥ 20000 is 25000
  });
});
