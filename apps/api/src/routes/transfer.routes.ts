import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { transferMoney } from "../services/transfer.service.js";

export const transferRoutes = Router();

transferRoutes.use(requireAuth);

transferRoutes.post("/", async (req, res, next) => {
  try {
    const response = await transferMoney(
      req.user!.id,
      req.body,
      req.header("idempotency-key") ?? undefined
    );
    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
});
