/**
 * Robust institute matching and normalization utility.
 * Matches user target institutes against candidate professor profiles
 * handling acronyms, full names, punctuation, and city identifiers.
 */

export function normalizeInstitute(inst: string): string {
  if (!inst) return "";
  return inst
    .toLowerCase()
    .replace(/[^a-z0-9]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Checks if a candidate institute string matches a target institute string.
 * Strictly distinguishes between types like IIT vs IIIT vs NIT, and cities like Surat vs Surathkal.
 */
export function matchInstitute(candidate: string, target: string): boolean {
  if (!candidate || !target) return false;
  
  const c = normalizeInstitute(candidate);
  const t = normalizeInstitute(target);

  if (c === t) return true;

  // Prevent false positive between "iit delhi" and "iiit delhi" or "iit hyderabad" and "iiit hyderabad"
  const cHasIIIT = c.includes("iiit") || c.includes("indraprastha") || c.includes("international institute of information");
  const tHasIIIT = t.includes("iiit") || t.includes("indraprastha") || t.includes("international institute of information");
  if (cHasIIIT !== tHasIIIT) {
    return false;
  }

  // Prevent false positive between Surat and Surathkal
  const cHasSurathkal = c.includes("surathkal");
  const tHasSurathkal = t.includes("surathkal");
  if (cHasSurathkal !== tHasSurathkal) {
    return false;
  }

  // Direct substring matches with word boundary check
  const isWordBoundarySubstring = (needle: string, haystack: string) => {
    const regex = new RegExp(`(^|\\s)${needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\s|$)`);
    return regex.test(haystack);
  };

  if (isWordBoundarySubstring(t, c) || isWordBoundarySubstring(c, t)) {
    return true;
  }

  // Canonical city and institute type pairing for Indian Technical Institutes
  const checkPair = (cityKey: string, type: "iit" | "iiit" | "nit" | "iisc") => {
    const hasCity = (str: string) => {
      if (cityKey === "surat") {
        return str.includes("surat") && !str.includes("surathkal");
      }
      return str.includes(cityKey);
    };

    const hasType = (str: string) => {
      if (type === "iiit") {
        return str.includes("iiit") || str.includes("indraprastha") || str.includes("international institute of information");
      }
      if (type === "iit") {
        return (str.includes("iit") || str.includes("indian institute of technology")) && 
               !str.includes("iiit") && 
               !str.includes("indraprastha") && 
               !str.includes("international institute of information");
      }
      if (type === "nit") {
        return str.includes("nit") || str.includes("national institute of technology") || str.includes("svnit");
      }
      if (type === "iisc") {
        return str.includes("iisc") || str.includes("indian institute of science");
      }
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
    ["sricity", "iiit"],
    ["gwalior", "iiit"],
    ["trichy", "nit"],
    ["tiruchirappalli", "nit"],
    ["surathkal", "nit"],
    ["warangal", "nit"],
    ["calicut", "nit"],
    ["surat", "nit"],
    ["rourkela", "nit"],
    ["bombay", "iit"],
    ["madras", "iit"],
    ["kanpur", "iit"],
    ["kharagpur", "iit"],
    ["roorkee", "iit"],
    ["guwahati", "iit"]
  ];

  for (const [cityKey, type] of canonicalPairs) {
    if (checkPair(cityKey, type)) {
      return true;
    }
  }

  return false;
}

/**
 * Returns true if candidate matches ANY of the target institutes in the list.
 */
export function matchesAnyTarget(candidateInstitute: string, targetInstitutes: string[]): boolean {
  if (!targetInstitutes || targetInstitutes.length === 0) return true;
  return targetInstitutes.some(target => matchInstitute(candidateInstitute, target));
}
