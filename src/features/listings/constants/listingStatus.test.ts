import { describe, it, expect } from "vitest";
import {
  LISTING_STATUS_PENDING,
  LISTING_STATUSES,
  countPendingListings,
  isPendingListing,
} from "./listingStatus";

describe("statut d'annonce — un seul état d'attente", () => {
  it("l'état d'attente est pending_review", () => {
    expect(LISTING_STATUS_PENDING).toBe("pending_review");
  });

  it("l'ancien mot 'pending' n'est plus un statut valide", () => {
    expect(LISTING_STATUSES).not.toContain("pending");
  });

  it("reconnaît une annonce en attente", () => {
    expect(isPendingListing("pending_review")).toBe(true);
    expect(isPendingListing("approved")).toBe(false);
    // Statut absent : une annonce fraîchement déposée est en attente.
    expect(isPendingListing(null)).toBe(true);
  });

  it("compte les annonces en attente, y compris celles sans statut", () => {
    const listings = [
      { status: "pending_review" },
      { status: "approved" },
      { status: "sold" },
      { status: "pending_review" },
      { status: null },
    ];
    expect(countPendingListings(listings)).toBe(3);
  });

  it("ne compte plus rien quand tout est publié", () => {
    expect(countPendingListings([{ status: "approved" }, { status: "sold" }])).toBe(0);
  });
});
