import fs from "node:fs";

const file = "server/routers.ts";
let content = fs.readFileSync(file, "utf8");

const oldProgressReturn = `        return {
          participant,
          rank: rankIndex >= 0 ? rankIndex + 1 : 1,
          totalParticipants: ranking.length,
        };`;

const newProgressReturn = `        const achievements = await db.getParticipantAchievements(participant.id);
        return {
          participant,
          rank: rankIndex >= 0 ? rankIndex + 1 : 1,
          totalParticipants: ranking.length,
          achievements,
        };`;

if (!content.includes(oldProgressReturn)) throw new Error("Trecho de getProgress não encontrado");
content = content.replace(oldProgressReturn, newProgressReturn);

const oldSubmitReturn = `        return db.recordGameResult(input);`;
const newSubmitReturn = `        const recorded = await db.recordGameResult(input);
        const unlockedAchievements = await db.evaluateAndUnlockAchievements(recorded.participant.id);
        return {
          ...recorded,
          unlockedAchievements,
        };`;

if (!content.includes(oldSubmitReturn)) throw new Error("Trecho de submitResult não encontrado");
content = content.replace(oldSubmitReturn, newSubmitReturn);

fs.writeFileSync(file, content);
console.log("server/routers.ts atualizado com conquistas integradas.");
