import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { getProfile, linkAadhaar } from "../services/profile.service.js";

export const profileRoutes = Router();

profileRoutes.use(requireAuth);

profileRoutes.get("/", async (req, res, next) => {
  try {
    res.json(await getProfile(req.user!.id));
  } catch (error) {
    next(error);
  }
});

profileRoutes.post("/aadhaar/link", async (req, res, next) => {
  try {
    res.json(await linkAadhaar(req.user!.id, req.body));
  } catch (error) {
    next(error);
  }
});
