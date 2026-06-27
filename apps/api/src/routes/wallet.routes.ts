import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { addMoney, getWallet } from "../services/wallet.service.js";

export const walletRoutes = Router();

walletRoutes.use(requireAuth);

walletRoutes.get("/", async (req, res, next) => {
  try {
    const wallet = await getWallet(req.user!.id);
    res.json({ wallet });
  } catch (error) {
    next(error);
  }
});

walletRoutes.post("/add-money", async (req, res, next) => {
  try {
    const response = await addMoney(
      req.user!.id,
      req.body,
      req.header("idempotency-key") ?? undefined
    );
    res.json(response);
  } catch (error) {
    next(error);
  }
});
