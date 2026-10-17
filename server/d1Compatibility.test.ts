import { describe, expect, it } from "vitest";
import { drizzle } from "drizzle-orm/d1";
import { participants } from "../drizzle/d1Schema";

describe("Cloudflare D1 schema compatibility", () => {
  it("does not generate MySQL now() in participant inserts", () => {
    const database = drizzle({} as any);
    const query = database.insert(participants).values({
      name: "Teste D1",
      participantType: "terceiro",
      chapa: "TEST-D1",
      wwid: "TEST-D1",
      totalScore: 0,
      completedGamesCount: 0,
      bestSecurityScore: 0,
      bestEnvironmentScore: 0,
      bestSpotErrorScore: 0,
      bestOrganizeScore: 0,
      totalCorrectAnswers: 0,
      totalWrongAnswers: 0,
      highestDifficulty: "Fácil",
    });

    const sql = query.toSQL().sql.toLowerCase();
    expect(sql).not.toContain("now()");
    expect(sql).toContain("current_timestamp");
    expect(sql).toContain('insert into "participants"');
  });
});
