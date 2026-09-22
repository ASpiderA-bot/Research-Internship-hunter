import { Router, type Request, type Response, type NextFunction } from "express";
import { AppError, normalizeError } from "../utils/errors.ts";
import { findHackathons } from "../services/hackathonFinder.ts";
import type { HackathonSearchRequest } from "../../shared/types.ts";

const router = Router();

router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { studentProfile, requireOnline = true, requireVibeCoding = true, maxResults = 12 } = req.body;
    if (!studentProfile) {
      throw new AppError("Missing student profile", 400, "MISSING_PROFILE");
    }

    const request: HackathonSearchRequest = {
      studentProfile,
      requireOnline,
      requireVibeCoding,
      maxResults,
    };

    const hackathons = await findHackathons(request);
    res.json({ hackathons });
  } catch (err) {
    next(normalizeError(err));
  }
});

export default router;
