import type { ProfessorProfile } from "../types.ts";

/**
 * Robust institute matching and normalization.
 */

export function normalizeInstitute(inst: string): string {
  if (!inst) return "";
  return inst
    .toLowerCase()
    .replace(/[^a-z0-9]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function matchInstitute(candidate: string, target: string): boolean {
  if (!candidate || !target) return false;

  const c = normalizeInstitute(candidate);
  const t = normalizeInstitute(target);

  if (c === t) return true;

  // Strictly distinguish IIT / IIIT / NIT.
  const typeFlags = (s: string) => ({
    iiit: s.includes("iiit") || s.includes("indraprastha") || s.includes("international institute of information"),
    iit: (s.includes("iit") || s.includes("indian institute of technology")) && !s.includes("iiit"),
    nit: s.includes("nit") || s.includes("national institute of technology") || s.includes("svnit"),
    iisc: s.includes("iisc") || s.includes("indian institute of science"),
  });

  const cType = typeFlags(c);
  const tType = typeFlags(t);

  if (cType.iiit !== tType.iiit) return false;
  if (cType.iit !== tType.iit) return false;
  if (cType.nit !== tType.nit) return false;
  if (cType.iisc !== tType.iisc) return false;

  // Surat vs Surathkal disambiguation.
  if (c.includes("surathkal") !== t.includes("surathkal")) return false;
  if ((c.includes("surat") && !c.includes("surathkal")) !== (t.includes("surat") && !t.includes("surathkal"))) {
    return false;
  }

  const isWordBoundarySubstring = (needle: string, haystack: string) => {
    const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(^|\\s)${escaped}(\\s|$)`);
    return regex.test(haystack);
  };

  if (isWordBoundarySubstring(t, c) || isWordBoundarySubstring(c, t)) return true;

  // Canonical city + type pairs.
  const checkPair = (cityKey: string, type: "iit" | "iiit" | "nit" | "iisc") => {
    const hasCity = (str: string) => {
      if (cityKey === "surat") return str.includes("surat") && !str.includes("surathkal");
      if (cityKey === "sri city") return str.includes("sri city") || str.includes("sricity");
      return str.includes(cityKey);
    };
    const hasType = (str: string) => {
      if (type === "iiit") return str.includes("iiit") || str.includes("indraprastha");
      if (type === "iit") return (str.includes("iit") || str.includes("indian institute of technology")) && !str.includes("iiit");
      if (type === "nit") return str.includes("nit") || str.includes("national institute of technology") || str.includes("svnit");
      if (type === "iisc") return str.includes("iisc") || str.includes("indian institute of science");
      return false;
    };
    return hasCity(c) && hasCity(t) && hasType(c) && hasType(t);
  };

  const canonicalPairs: Array<[string, "iit" | "iiit" | "nit" | "iisc"]> = [
    ["gandhinagar", "iit"],
    ["hyderabad", "iit"],
    ["hyderabad", "iiit"],
    ["jodhpur", "iit"],
    ["ropar", "iit"],
    ["mandi", "iit"],
    ["patna", "iit"],
    ["indore", "iit"],
    ["tirupati", "iit"],
    ["palakkad", "iit"],
    ["bhilai", "iit"],
    ["dharwad", "iit"],
    ["goa", "iit"],
    ["bhubaneswar", "iit"],
    ["delhi", "iiit"],
    ["delhi", "iit"],
    ["bangalore", "iiit"],
    ["bangalore", "iisc"],
    ["allahabad", "iiit"],
    ["sri city", "iiit"],
    ["gwalior", "iiit"],
    ["trichy", "nit"],
    ["tiruchirappalli", "nit"],
    ["surathkal", "nit"],
    ["warangal", "nit"],
    ["calicut", "nit"],
    ["surat", "nit"],
    ["rourkela", "nit"],
    ["bombay", "iit"],
    ["mumbai", "iit"],
    ["madras", "iit"],
    ["chennai", "iit"],
    ["kanpur", "iit"],
    ["kharagpur", "iit"],
    ["roorkee", "iit"],
    ["guwahati", "iit"],
  ];

  for (const [cityKey, type] of canonicalPairs) {
    if (checkPair(cityKey, type)) return true;
  }

  return false;
}

export function matchesAnyTarget(candidateInstitute: string, targetInstitutes: string[]): boolean {
  if (!targetInstitutes || targetInstitutes.length === 0) return true;
  return targetInstitutes.some((target) => matchInstitute(candidateInstitute, target));
}

export function categorizeInstitute(institute: string): ProfessorProfile["instituteCategory"] {
  const s = normalizeInstitute(institute);
  if (s.includes("iiit")) return "IIIT";
  if (s.includes("nit") || s.includes("svnit")) return "NIT";
  if (s.includes("iisc")) return "Premier Research Inst";
  const newerIITs = [
    "gandhinagar", "hyderabad", "jodhpur", "ropar", "mandi", "patna",
    "indore", "tirupati", "palakkad", "bhilai", "dharwad", "goa", "bhubaneswar"
  ];
  if (s.includes("iit") && newerIITs.some((city) => s.includes(city))) return "Newer IIT";
  if (s.includes("iit")) return "Established IIT";
  return "Premier Research Inst";
}

export function inferConversionPotential(institute: string): ProfessorProfile["conversionPotential"] {
  const cat = categorizeInstitute(institute);
  if (cat === "Newer IIT" || cat === "IIIT") return "Very High";
  if (cat === "NIT") return "High";
  return "Moderate";
}
