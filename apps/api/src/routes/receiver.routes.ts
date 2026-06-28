import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { resolveReceiver } from "../services/receiver.service.js";

export const receiverRoutes = Router();

receiverRoutes.use(requireAuth);

receiverRoutes.get("/resolve", async (req, res, next) => {
  try {
    res.json(
      await resolveReceiver(String(req.query.identifier ?? ""), req.user!.id)
    );
  } catch (error) {
    next(error);
  }
});
