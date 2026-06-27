import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { listTransactions } from "../services/transaction.service.js";

export const transactionRoutes = Router();

transactionRoutes.use(requireAuth);

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20)
});

transactionRoutes.get("/", async (req, res, next) => {
  try {
    const query = querySchema.parse(req.query);
    const transactions = await listTransactions(req.user!.id, query.limit);
    res.json({ transactions });
  } catch (error) {
    next(error);
  }
});
