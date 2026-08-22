import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { ENV } from "./_core/env";
import { sdk } from "./_core/sdk";
import * as db from "./db";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { aiRouter } from "./routers/ai";
import { placementRouter } from "./routers/placement";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    demoLogin: publicProcedure
      .input(z.object({
        username: z.string().trim().min(1).max(64),
        password: z.string().min(1).max(128),
        placementRole: z.enum(["candidate", "recruiter"]),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ENV.demoLoginEnabled) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Presentation demo access is disabled." });
        }
        if (input.username !== ENV.demoUsername || input.password !== ENV.demoPassword) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid presentation credentials." });
        }
        if (!ENV.cookieSecret) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Session signing is not configured." });
        }

        const openId = `demo-presentation-${input.placementRole}`;
        const demoName = input.placementRole === "candidate" ? "Presentation Candidate" : "Presentation Recruiter";
        await db.upsertUser({
          openId,
          name: demoName,
          email: `test+${input.placementRole}@presentation.local`,
          loginMethod: "demo",
          role: "user",
          placementRole: input.placementRole,
          lastSignedIn: new Date(),
        });
        const demoUser = await db.getUserByOpenId(openId);
        if (!demoUser) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Presentation account could not be loaded." });
        }
        if (input.placementRole === "candidate") {
          await db.ensureDemoCandidateProfile(demoUser.id);
        }

        const token = await sdk.createSessionToken(openId, { name: demoName });
        ctx.res.cookie(COOKIE_NAME, token, {
          ...getSessionCookieOptions(ctx.req),
          maxAge: 24 * 60 * 60 * 1000,
        });
        return { success: true, demo: true, placementRole: input.placementRole } as const;
      }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  placement: placementRouter,
  ai: aiRouter,

  // TODO: add feature routers here, e.g.
  // todo: router({
  //   list: protectedProcedure.query(({ ctx }) =>
  //     db.getUserTodos(ctx.user.id)
  //   ),
  // }),
});

export type AppRouter = typeof appRouter;
