import type { VercelRequest, VercelResponse } from "@vercel/node";

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.status(501).json({ ok: false, message: "Storage proxy not implemented in Vercel serverless mode" });
}
