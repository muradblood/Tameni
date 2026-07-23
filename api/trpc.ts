import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import type { NextFunction, Request, Response } from "express";
import { appRouter } from "./_server/routers";
import { createContext } from "./_server/_core/context";

const trpcMiddleware = createExpressMiddleware({
  router: appRouter,
  createContext,
});

export default function handler(req: VercelRequest, res: VercelResponse) {
  return new Promise<void>((resolve, reject) => {
    const next: NextFunction = (err?: unknown) => {
      if (err) {
        console.error("[tRPC] error:", err);
        if (!res.headersSent) {
          res.status(500).json({ error: "Internal server error" });
        }
        reject(err);
      } else {
        resolve();
      }
    };

    // Cast VercelRequest/Response to Express Request/Response for tRPC adapter compatibility.
    trpcMiddleware(req as unknown as Request, res as unknown as Response, next);
  });
}
