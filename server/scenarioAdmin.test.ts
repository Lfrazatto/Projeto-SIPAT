import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { ENV } from "./_core/env";

function createContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("admin scenario catalog", () => {
  it("rejects a scenario without the paired safe image", async () => {
    const caller = appRouter.createCaller(createContext());

    const attempt = caller.admin.createScenarioImage({
      adminKey: ENV.adminAccessKey || "missing-configured-secret",
      scenarioKey: "cdbs-real-2026",
      label: "Posto real de montagem",
      imageUrl: "/manus-storage/cdbs-real-errors.webp",
    });
    await expect(attempt).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("accepts secure storage URLs in the update contract", async () => {
    const caller = appRouter.createCaller(createContext());

    const attempt = caller.admin.updateScenarioImage({
      adminKey: ENV.adminAccessKey || "missing-configured-secret",
      scenarioKey: "cdbs-real-2026",
      label: "Posto real de montagem",
      imageUrl: "/manus-storage/cdbs-real-errors.webp",
      safeImageUrl: "/manus-storage/cdbs-real-safe.webp",
      difficulty: "medio",
      timeSeconds: 120,
      hintCount: 2,
      hintCost: 5,
      wrongClickPenalty: 3,
      phaseMode: "livres",
      active: true,
    });
    if (ENV.adminAccessKey) {
      await expect(attempt).resolves.toEqual({ success: true });
    } else {
      await expect(attempt).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    }
  });
});
