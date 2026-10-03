/**
 * Single source for public company statistics.
 * Only management-verified values may be numbers.
 * null means "do not display" — never invent a replacement.
 */
export const companyStats = {
  projectsCompleted: null,
  verifiedClients: null,
  verifiedReviews: null,
  yearsOperating: null,
  clientSatisfaction: null,
  systemsDelivered: null,
  investmentGenerated: null,
};

const LABELS = {
  projectsCompleted: "Projects completed",
  verifiedClients: "Verified clients",
  verifiedReviews: "Verified reviews",
  yearsOperating: "Years operating",
  clientSatisfaction: "Client satisfaction",
  systemsDelivered: "Systems delivered",
  investmentGenerated: "Investment generated",
};

/** Stats safe to render. Empty until management verifies figures. */
export function verifiedPublicStats() {
  return Object.entries(companyStats)
    .filter(([, value]) => typeof value === "number" && Number.isFinite(value))
    .map(([key, value]) => ({
      key,
      value,
      label: LABELS[key] || key,
      suffix: key === "clientSatisfaction" ? "%" : "+",
    }));
}
