/**
 * Reusable Zod schemas for Belgian-market inputs.
 * Centralized so Auth, SellWizard, EditVitrine, contact forms all enforce
 * the same client-side rules. Server-side validation remains via DB
 * constraints + RPC checks.
 */
import { z } from "zod";

/** Email — trimmed, lowercased, max 255. */
export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email({ message: "Adresse e-mail invalide" })
  .max(255, { message: "Adresse e-mail trop longue" });

/**
 * Belgian phone number.
 * Accepts: +32 470 12 34 56, +32470123456, 0470 12 34 56, 0470123456.
 * Normalizes to E.164 (+32…). Returns the canonical string.
 */
const beMobileRe = /^(?:\+32\s?|0)[1-9](?:[\s./-]?\d){7,8}$/;
export const belgianPhoneSchema = z
  .string()
  .trim()
  .refine((v) => beMobileRe.test(v), { message: "Numéro belge invalide (ex: +32 470 12 34 56)" })
  .transform((v) => {
    const digits = v.replace(/[^\d+]/g, "");
    if (digits.startsWith("+32")) return digits;
    if (digits.startsWith("0")) return "+32" + digits.slice(1);
    return digits;
  });

/**
 * Belgian VAT (TVA) number. Format: BE0XXXXXXXXX (10 digits after BE0).
 * Accepts "BE 0123.456.789", "0123456789", etc. Normalizes to BE0XXXXXXXXX.
 */
export const belgianVatSchema = z
  .string()
  .trim()
  .transform((v) => v.toUpperCase().replace(/[\s.-]/g, ""))
  .refine((v) => /^BE0\d{9}$/.test(v) || /^0\d{9}$/.test(v), {
    message: "Numéro TVA belge invalide (BE0XXXXXXXXX)",
  })
  .transform((v) => (v.startsWith("BE") ? v : "BE" + v));

/** Belgian postal code — 4 digits. */
export const belgianPostalSchema = z
  .string()
  .trim()
  .regex(/^\d{4}$/, { message: "Code postal belge invalide (4 chiffres)" });

/**
 * Free-text safe input. Trims, caps length, strips obvious script tags.
 * Use for bio, description, etc. when not rendered as HTML.
 */
export const safeTextSchema = (max = 2000) =>
  z
    .string()
    .trim()
    .max(max, { message: `Texte trop long (${max} caractères max)` })
    .transform((v) => v.replace(/<\s*script\b[^<]*(?:(?!<\s*\/\s*script\s*>)<[^<]*)*<\s*\/\s*script\s*>/gi, ""));

/** Display name — 2–80 chars, trimmed. */
export const displayNameSchema = z
  .string()
  .trim()
  .min(2, { message: "Nom trop court" })
  .max(80, { message: "Nom trop long" });

/** Password — 8+ chars, at least 1 letter + 1 digit. HIBP check côté serveur. */
export const passwordSchema = z
  .string()
  .min(8, { message: "Mot de passe : 8 caractères minimum" })
  .max(128, { message: "Mot de passe trop long" })
  .refine((v) => /[A-Za-z]/.test(v) && /\d/.test(v), {
    message: "Doit contenir au moins une lettre et un chiffre",
  });
