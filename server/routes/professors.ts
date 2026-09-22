import { Router, type Request, type Response, type NextFunction } from "express";
import { AppError, normalizeError, errorResponse } from "../utils/errors.ts";
import { discoverProfessorsFromWeb, mergeWithSeedProfessors, deduplicateProfessors } from "../services/professorDiscovery.ts";
import { verifyProfessorBatch } from "../services/professorVerification.ts";
import { rankMatches, fallbackRank, localOverlapScore } from "../services/matcher.ts";
import { CONFIG } from "../utils/config.ts";
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

    // Pre-rank locally and verify only the most promising candidates to stay within rate limits and time budgets.
    const maxToVerify = CONFIG.MAX_RESULTS;
    const preRanked = candidates
      .map((c) => ({ prof: c, score: localOverlapScore(c, studentProfile as StudentProfile) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, maxToVerify)
      .map((x) => x.prof);

    // Run secondary verification on shortlisted candidates.
    const { verified, rejected } = await verifyProfessorBatch(preRanked);

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
      verificationNotes: `Verified ${verified.length} of ${preRanked.length} shortlisted candidates; ${candidates.length - preRanked.length} lower-priority candidates skipped.`,
    };

    res.json(response);
  } catch (err) {
    next(normalizeError(err));
  }
});

export default router;
