import { afterAll, describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { getDb } from "./db";
import { gameResults, participants } from "../drizzle/schema";
import { like, or } from "drizzle-orm";

function createMockContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as any,
    res: {
      clearCookie: () => {},
    } as any,
  };
}

describe("Participant Identification & Rules (Prompt Section 4 & 20)", () => {
  it("rejects non-visitor identification when identifier is missing", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.participant.identify({
        name: "Carlos Mecânico",
        participantType: "terceiro",
        identifier: "",
      })
    ).rejects.toThrow("Informe a chapa");
  });

  it("identifies a Cummins employee with WWID correctly", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.participant.identify({
      name: "Mariana Engenheira",
      participantType: "cummins",
      identifier: "WW99281",
    });

    expect(result.participant).toBeDefined();
    expect(result.participant.name).toBe("Mariana Engenheira");
    expect(result.participant.participantType).toBe("cummins");
    expect(result.participant.wwid).toBe("WW99281");
    expect(result.rank).toBeGreaterThanOrEqual(1);
  });

  it("identifies a Visitor without chapa, WWID or password", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.participant.identify({
      name: "Visitante Comunidade",
      participantType: "visitante",
    });

    expect(result.participant).toBeDefined();
    expect(result.participant.name).toBe("Visitante Comunidade");
    expect(result.participant.participantType).toBe("visitante");
    expect(result.participant.chapa).toContain("VISITANTE-");
  });

  it("returns null participant with rank 0 when looking up an unknown identifier", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const progress = await caller.participant.getProgress({
      wwid: "UNKNOWN-NON-EXISTENT",
    });

    expect(progress.participant).toBeNull();
    expect(progress.rank).toBe(0);
  });

  afterAll(async () => {
    const db = await getDb();
    if (db) {
      await db.delete(gameResults).where(or(like(gameResults.participantName, "%Teste%"), like(gameResults.participantChapa, "TEST%"), like(gameResults.participantName, "Mariana Engenheira"), like(gameResults.participantName, "Visitante Comunidade")));
      await db.delete(participants).where(or(like(participants.name, "%Teste%"), like(participants.chapa, "TEST%"), like(participants.name, "Mariana Engenheira"), like(participants.name, "Visitante Comunidade")));
    }
  });
});
