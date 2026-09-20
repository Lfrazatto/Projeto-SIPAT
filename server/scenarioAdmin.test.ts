import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

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

    await expect(
      caller.admin.createScenarioImage({
        adminKey: "SIPATMA",
        scenarioKey: "cdbs-real-2026",
        label: "Posto real de montagem",
        imageUrl: "/manus-storage/cdbs-real-errors.webp",
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("accepts secure storage URLs in the update contract", async () => {
    const caller = appRouter.createCaller(createContext());

    await expect(
      caller.admin.updateScenarioImage({
        adminKey: "SIPATMA",
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
      })
    ).resolves.toEqual({ success: true });
  });
});
