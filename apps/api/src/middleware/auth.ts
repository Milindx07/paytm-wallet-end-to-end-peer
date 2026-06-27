import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config.js";
import { HttpError } from "../utils/http-error.js";

type JwtPayload = {
  sub: string;
  name: string;
  email: string;
};

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: "7d",
    issuer: "paytm-wallet-p2p"
  });
}

export function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const header = req.header("authorization");

  if (!header?.startsWith("Bearer ")) {
    next(new HttpError(401, "Missing bearer token"));
    return;
  }

  try {
    const decoded = jwt.verify(header.slice("Bearer ".length), config.jwtSecret, {
      issuer: "paytm-wallet-p2p"
    }) as JwtPayload;

    req.user = {
      id: decoded.sub,
      name: decoded.name,
      email: decoded.email
    };
    next();
  } catch {
    next(new HttpError(401, "Invalid or expired token"));
  }
}
