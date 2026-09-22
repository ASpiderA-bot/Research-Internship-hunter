import { Router, type Request, type Response, type NextFunction } from "express";
import { AppError, errorResponse, normalizeError } from "../utils/errors.ts";
import { parseProfileFromText, parseProfileFromPDF } from "../services/profileParser.ts";
import type { StudentProfile } from "../../shared/types.ts";

const router = Router();

router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { pdfBase64, textContent } = req.body;
    if (!pdfBase64 && !textContent) {
      throw new AppError("Missing resume contents (PDF base64 or text)", 400, "MISSING_INPUT");
    }

    let profile: StudentProfile;
    if (pdfBase64) {
      profile = await parseProfileFromPDF(pdfBase64);
    } else {
      profile = await parseProfileFromText(textContent);
    }

    res.json(profile);
  } catch (err) {
    next(normalizeError(err));
  }
});

export default router;
