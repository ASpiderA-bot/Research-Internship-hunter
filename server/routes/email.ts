import { Router, type Request, type Response, type NextFunction } from "express";
import { AppError, normalizeError } from "../utils/errors.ts";
import { composePersonalizedEmail, buildMailtoLink } from "../services/emailComposer.ts";
import type { ColdEmailRequest, ColdEmailResponse } from "../../shared/types.ts";

const router = Router();

router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { professor, studentProfile, matchReasons, studentName, studentEmail, studentInstitute, tone } =
      req.body as ColdEmailRequest;

    if (!professor || !studentProfile) {
      throw new AppError("Missing professor or student profile", 400, "MISSING_INPUT");
    }

    const email = await composePersonalizedEmail({
      professor,
      studentProfile,
      matchReasons,
      studentName,
      studentEmail,
      studentInstitute,
      tone,
    });

    const response: ColdEmailResponse & { mailto?: string } = {
      ...email,
      mailto: professor.email ? buildMailtoLink(professor.email, email.subject, email.body) : undefined,
    };

    res.json(response);
  } catch (err) {
    next(normalizeError(err));
  }
});

export default router;
