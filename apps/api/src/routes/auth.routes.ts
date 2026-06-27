import { Router } from "express";
import { login, register } from "../services/auth.service.js";

export const authRoutes = Router();

authRoutes.post("/register", async (req, res, next) => {
  try {
    const response = await register(req.body);
    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
});

authRoutes.post("/login", async (req, res, next) => {
  try {
    const response = await login(req.body);
    res.json(response);
  } catch (error) {
    next(error);
  }
});
