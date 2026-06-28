import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  getIsolationDetails,
  getOpsSnapshot,
  getRetrySafetyDetails
} from "../services/ops.service.js";

export const opsRoutes = Router();

opsRoutes.use(requireAuth);

opsRoutes.get("/snapshot", async (req, res, next) => {
  try {
    res.json(await getOpsSnapshot(req.user!.id));
  } catch (error) {
    next(error);
  }
});

opsRoutes.get("/isolation", (_req, res) => {
  res.json(getIsolationDetails());
});

opsRoutes.get("/retry-safety", (_req, res) => {
  res.json(getRetrySafetyDetails());
});
