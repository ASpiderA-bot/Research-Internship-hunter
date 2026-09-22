import { Router, type Request, type Response, type NextFunction } from "express";
import { AppError, normalizeError, errorResponse } from "../utils/errors.ts";
import { discoverProfessorsFromWeb, mergeWithSeedProfessors, deduplicateProfessors } from "../services/professorDiscovery.ts";
import { verifyProfessorBatch } from "../services/professorVerification.ts";
import { rankMatches, fallbackRank } from "../services/matcher.ts";
import type { SearchResponse, StudentProfile } from "../../shared/types.ts";

const router = Router();

router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { studentProfile, targetInstitutes = [] } = req.body;
    if (!studentProfile) {
      throw new AppError("Missing student profile", 400, "MISSING_PROFILE");
    }

    const isTargeted = Array.isArray(targetInstitutes) && targetInstitutes.length > 0;

    const { professors: scraped, queries, scrapedCount } = await discoverProfessorsFromWeb(
      studentProfile as StudentProfile,
      targetInstitutes,
      isTargeted
    );

    const merged = mergeWithSeedProfessors(scraped);
    const candidates = deduplicateProfessors(merged);

    // Run secondary verification on all candidates.
    const { verified, rejected } = await verifyProfessorBatch(candidates);

    let results;
    try {
      results = await rankMatches(studentProfile as StudentProfile, verified, targetInstitutes);
    } catch (rankErr) {
      console.warn("AI ranking failed, using fallback matcher:", rankErr);
      results = fallbackRank(studentProfile as StudentProfile, verified, targetInstitutes);
    }

    const response: SearchResponse = {
      searchQueries: queries,
      scrapedCount,
      results,
      targetInstitutes: isTargeted ? targetInstitutes : [],
      rejectedCount: rejected.length,
      verificationNotes: `Verified ${verified.length} of ${candidates.length} candidates; ${rejected.length} rejected due to low-confidence identity or domain mismatch.`,
    };

    res.json(response);
  } catch (err) {
    next(normalizeError(err));
  }
});

export default router;
