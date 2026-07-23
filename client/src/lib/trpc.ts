import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "../../../api/_server/routers";

export const trpc = createTRPCReact<AppRouter>();
