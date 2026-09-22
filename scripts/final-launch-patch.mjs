import fs from "node:fs";

const root = process.cwd();
const file = (name) => `${root}/${name}`;
const read = (name) => fs.readFileSync(file(name), "utf8");
const write = (name, value) => fs.writeFileSync(file(name), value);
const replace = (name, from, to, count = Infinity) => {
  let source = read(name);
  let occurrences = 0;
  source = source.replace(from, (...args) => {
    occurrences += 1;
    return occurrences <= count ? to : args[0];
  });
  if (occurrences === 0) throw new Error(`Não encontrei trecho em ${name}: ${String(from).slice(0, 100)}`);
  write(name, source);
};
const replaceAll = (name, from, to) => {
  const source = read(name);
  if (!source.includes(from)) throw new Error(`Não encontrei trecho em ${name}: ${from.slice(0, 100)}`);
  write(name, source.split(from).join(to));
};

// ------------------------- Backend security -------------------------
let routers = read("server/routers.ts");
routers = routers.replace(
  'import { timingSafeEqual } from "node:crypto";',
  'import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";\nimport { parse as parseCookieHeader } from "cookie";'
);
routers = routers.replace(
  'function isValidAdminKey(value: string) {',
  'const PARTICIPANT_SESSION_COOKIE = "sipat_participant_session";\nconst ADMIN_SESSION_COOKIE = "sipat_admin_session";\nconst SESSION_TTL_MS = 8 * 60 * 60 * 1000;\n\nfunction signSessionValue(scope: string, value: string, expiresAt: number) {\n  const payload = `${scope}|${value}|${expiresAt}`;\n  const signature = createHmac("sha256", ENV.cookieSecret || "sipat-fallback-session-secret").update(payload).digest("base64url");\n  return `${payload}|${signature}`;\n}\n\nfunction readSessionValue(req: { headers?: { cookie?: string } }, scope: string, cookieName: string) {\n  const token = parseCookieHeader(req.headers?.cookie ?? "")[cookieName];\n  if (!token) return null;\n  const parts = token.split("|");\n  if (parts.length !== 4 || parts[0] !== scope) return null;\n  const expiresAt = Number(parts[2]);\n  if (!Number.isSafeInteger(expiresAt) || expiresAt < Date.now()) return null;\n  const expected = createHmac("sha256", ENV.cookieSecret || "sipat-fallback-session-secret").update(`${parts[0]}|${parts[1]}|${parts[2]}`).digest("base64url");\n  const candidate = Buffer.from(parts[3]);\n  const expectedBuffer = Buffer.from(expected);\n  if (candidate.length !== expectedBuffer.length || !timingSafeEqual(candidate, expectedBuffer)) return null;\n  return parts[1];\n}\n\nfunction setSessionCookie(ctx: { req: any; res: any }, cookieName: string, scope: string, value: string) {\n  if (typeof ctx.res?.cookie !== "function") return;\n  ctx.res.cookie(cookieName, signSessionValue(scope, value, Date.now() + SESSION_TTL_MS), { ...getSessionCookieOptions(ctx.req), maxAge: SESSION_TTL_MS });\n}\n\nfunction isValidAdminKey(value: string) {'
);
routers = routers.replace(
  'function isValidAdminKey(value: string) {\n  const configuredKey',
  'function isValidAdminKey(value: string) {\n  const configuredKey'
);
routers = routers.replace(
  '  return candidate.length === expected.length && timingSafeEqual(candidate, expected);\n}\n\nconst scenarioImageUrlSchema',
  '  return candidate.length === expected.length && timingSafeEqual(candidate, expected);\n}\n\nfunction isValidAdminRequest(value: string | undefined, req: { headers?: { cookie?: string } }) {\n  return isValidAdminKey(value ?? "") || Boolean(readSessionValue(req, "admin", ADMIN_SESSION_COOKIE));\n}\n\nfunction participantSessionId(req: { headers?: { cookie?: string } }) {\n  const value = readSessionValue(req, "participant", PARTICIPANT_SESSION_COOKIE);\n  const id = value ? Number(value) : NaN;\n  return Number.isSafeInteger(id) && id > 0 ? id : null;\n}\n\nconst scenarioImageUrlSchema'
);
routers = routers.replace(
  'const rateBuckets = new Map<string, { count: number; resetAt: number }>();',
  'const rateBuckets = new Map<string, { count: number; resetAt: number }>();\nconst quizAttempts = new Map<number, { gameType: "quiz_seguranca" | "quiz_ergonomia"; questionIds: Set<number>; answered: Set<number>; score: number; correctCount: number; wrongCount: number }>();'
);
routers = routers.replace(
  'const visitorKey = `VISITANTE-${cleanName.normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48)}`;',
  'const visitorKey = `VISITANTE-${randomUUID().replace(/-/g, "").slice(0, 24).toUpperCase()}`;'
);
routers = routers.replace(
  '        const ranking = await db.getRankingList();\n        const rankIndex = ranking.findIndex((item) => item.wwid === participant.wwid);\n\n        return {',
  '        setSessionCookie(ctx, PARTICIPANT_SESSION_COOKIE, "participant", String(participant.id));\n        const ranking = await db.getRankingList();\n        const rankIndex = ranking.findIndex((item) => item.wwid === participant.wwid);\n\n        return {'
);
routers = routers.replace(
  '        z.object({\n          wwid: z.string().trim().min(1, "Chapa ou WWID é obrigatório").max(64),\n        })',
  '        z.object({\n          wwid: z.string().trim().min(1).max(64).optional(),\n        })'
);
routers = routers.replace(
  '      .query(async ({ input }) => {\n        const cleanWwid = input.wwid.trim().toUpperCase();\n        const participant = (await db.getParticipantByWwid(cleanWwid)) || (await db.getParticipantByChapa(cleanWwid));\n        const ranking = await db.getRankingList();',
  '      .query(async ({ input, ctx }) => {\n        const sessionId = participantSessionId(ctx.req);\n        const cleanWwid = input.wwid?.trim().toUpperCase();\n        const sessionParticipant = sessionId ? await db.getParticipantById(sessionId) : undefined;\n        const participant = sessionParticipant || (cleanWwid ? (await db.getParticipantByWwid(cleanWwid)) || (await db.getParticipantByChapa(cleanWwid)) : undefined);\n        const ranking = await db.getRankingList();'
);
routers = routers.replace(
  '        const rankIndex = ranking.findIndex((item) => item.wwid === participant.wwid);\n\n        const achievements = await db.getParticipantAchievements(participant.id);\n        return {\n          participant,',
  '        if (!sessionParticipant) {\n          return { participant: null, rank: 0, totalParticipants: ranking.length };\n        }\n        const rankIndex = ranking.findIndex((item) => item.wwid === participant.wwid);\n        const achievements = await db.getParticipantAchievements(participant.id);\n        const safeParticipant = { ...participant, chapa: maskIdentifier(participant.chapa), wwid: maskIdentifier(participant.wwid) };\n        return {\n          participant: safeParticipant,'
);
// Start a server-side attempt with the exact question ids sent to the client.
routers = routers.replace(
  '      .query(async ({ input }) => {\n        await assertGameOpen(input.gameType);',
  '      .query(async ({ input, ctx }) => {\n        await assertGameOpen(input.gameType);'
);
routers = routers.replace(
  '        const shuffled = [...filtered].sort(() => Math.random() - 0.5).slice(0, 12);\n        return shuffled.map((q) => ({',
  '        const shuffled = [...filtered].sort(() => Math.random() - 0.5).slice(0, 12);\n        const sessionId = participantSessionId(ctx.req);\n        if (sessionId) {\n          quizAttempts.set(sessionId, { gameType: input.gameType, questionIds: new Set(shuffled.map((q) => q.id)), answered: new Set(), score: 0, correctCount: 0, wrongCount: 0 });\n        }\n        return shuffled.map((q) => ({'
);
// Daily attempts are now session-bound in production; the legacy field remains optional for old callers.
routers = routers.replace(
  '          participantWwid: z.string().trim().min(1),',
  '          participantWwid: z.string().trim().min(1).optional(),'
);
routers = routers.replace(
  '      .query(async ({ input }) => {\n        const participant = await db.getParticipantByWwid(input.participantWwid) || await db.getParticipantByChapa(input.participantWwid);\n        if (!participant) return { attemptsToday: 0, maxDailyAttempts: 5, remainingToday: 5 };',
  '      .query(async ({ input, ctx }) => {\n        const sessionId = participantSessionId(ctx.req);\n        const participant = sessionId ? await db.getParticipantById(sessionId) : undefined;\n        if (!participant) return { attemptsToday: 0, maxDailyAttempts: 5, remainingToday: 5 };'
);
// Verify answers against the active attempt when a participant session exists.
routers = routers.replace(
  '        const isCorrect = question.correctOption === input.selectedOption;\n\n        let basePoints',
  '        const sessionId = participantSessionId(ctx.req);\n        const attempt = sessionId ? quizAttempts.get(sessionId) : undefined;\n        if (attempt) {\n          if (attempt.gameType !== question.gameType || !attempt.questionIds.has(question.id) || attempt.answered.has(question.id)) {\n            throw new TRPCError({ code: "BAD_REQUEST", message: "Resposta fora da tentativa ativa." });\n          }\n          attempt.answered.add(question.id);\n        }\n        const isCorrect = question.correctOption === input.selectedOption;\n\n        let basePoints'
);
routers = routers.replace(
  '        if (isCorrect && input.remainingSeconds > 0) {\n          earnedPoints = Math.round(basePoints * (input.remainingSeconds / 60));\n        }\n\n        return {',
  '        if (isCorrect && input.remainingSeconds > 0) {\n          earnedPoints = Math.round(basePoints * (input.remainingSeconds / 60));\n        }\n        const acceptedCorrect = isCorrect && input.remainingSeconds > 0;\n        if (attempt) {\n          if (acceptedCorrect) { attempt.correctCount += 1; attempt.score += earnedPoints; }\n          else attempt.wrongCount += 1;\n        }\n\n        return {'
);
routers = routers.replace(
  '          isCorrect: isCorrect && input.remainingSeconds > 0,',
  '          isCorrect: acceptedCorrect,'
);
// Bind result submission to the signed participant session and clamp untrusted payloads.
routers = routers.replace(
  '          score: z.number().min(0),\n          correctCount: z.number().min(0),\n          wrongCount: z.number().min(0),\n          hintsUsed: z.number().int().min(0).max(20).optional(),\n          timeSpentSeconds: z.number().min(0),',
  '          score: z.number().int().min(0).max(10000),\n          correctCount: z.number().int().min(0).max(50),\n          wrongCount: z.number().int().min(0).max(100),\n          hintsUsed: z.number().int().min(0).max(20).optional(),\n          timeSpentSeconds: z.number().int().min(0).max(7200),'
);
routers = routers.replace(
  '        const participant = await db.findOrCreateParticipant(input.participantName, input.participantChapa, input.participantWwid);\n        const attemptsToday = await db.getDailyAttemptsCount(participant.id, input.gameType);',
  '        const sessionId = participantSessionId(ctx.req);\n        const sessionParticipant = sessionId ? await db.getParticipantById(sessionId) : undefined;\n        const participant = sessionParticipant || await db.findOrCreateParticipant(input.participantName, input.participantChapa, input.participantWwid);\n        const authoritativeAttempt = sessionParticipant && (input.gameType === "quiz_seguranca" || input.gameType === "quiz_ergonomia") ? quizAttempts.get(sessionParticipant.id) : undefined;\n        const resultInput = authoritativeAttempt ? { ...input, participantName: participant.name, participantChapa: participant.chapa, participantWwid: participant.wwid, score: authoritativeAttempt.score, correctCount: authoritativeAttempt.correctCount, wrongCount: authoritativeAttempt.wrongCount } : { ...input, participantName: participant.name, participantChapa: participant.chapa, participantWwid: participant.wwid };\n        if (authoritativeAttempt) quizAttempts.delete(sessionParticipant.id);\n        const attemptsToday = await db.getDailyAttemptsCount(participant.id, input.gameType);'
);
routers = routers.replace(
  '        const recorded = await db.recordGameResult(input);',
  '        const recorded = await db.recordGameResult(resultInput);'
);
// Game hotspot preview can rely on the admin session cookie instead of receiving the key.
routers = routers.replace(
  '      .query(async ({ input }) => {\n        if (!isValidAdminKey(input?.adminKey ?? "")) await assertGameOpen("ache_o_erro");',
  '      .query(async ({ input, ctx }) => {\n        if (!isValidAdminRequest(input?.adminKey, ctx.req)) await assertGameOpen("ache_o_erro");'
);
// Admin verification creates a short-lived HttpOnly session cookie.
routers = routers.replace(
  '        const isValid = isValidAdminKey(input.adminKey);\n        return { isValid };',
  '        const isValid = isValidAdminKey(input.adminKey);\n        if (isValid) setSessionCookie(ctx, ADMIN_SESSION_COOKIE, "admin", "authorized");\n        return { isValid };'
);
// All admin endpoints accept an optional legacy key but authenticate through the cookie whenever present.
const adminStart = routers.indexOf('  admin: router({');
const adminEnd = routers.indexOf('  }),\n\n  mural: router({', adminStart);
if (adminStart < 0 || adminEnd < 0) throw new Error("Bloco admin não localizado");
let adminBlock = routers.slice(adminStart, adminEnd);
adminBlock = adminBlock.replace(/adminKey: z\.string\(\)/g, 'adminKey: z.string().optional()');
// verifyKey is the only endpoint that must receive the credential.
adminBlock = adminBlock.replace('adminKey: z.string().optional(),\n        })\n      )\n      .mutation(async ({ input, ctx }) => {', 'adminKey: z.string(),\n        })\n      )\n      .mutation(async ({ input, ctx }) => {', 1);
adminBlock = adminBlock.replace(/\.query\(async \(\{ input \}\) => \{/g, '.query(async ({ input, ctx }) => {');
adminBlock = adminBlock.replace(/\.mutation\(async \(\{ input \}\) => \{/g, '.mutation(async ({ input, ctx }) => {');
adminBlock = adminBlock.replace(/isValidAdminKey\(input\.adminKey\)/g, 'isValidAdminRequest(input.adminKey, ctx.req)');
routers = routers.slice(0, adminStart) + adminBlock + routers.slice(adminEnd);
write("server/routers.ts", routers);

let db = read("server/db.ts");
const dbAnchor = 'export async function getParticipantByWwid(wwid: string): Promise<Participant | undefined> {';
if (!db.includes(dbAnchor)) throw new Error("Âncora de participantes não encontrada");
db = db.replace(dbAnchor, 'export async function getParticipantById(id: number): Promise<Participant | undefined> {\n  const dbConn = await getDb();\n  if (!dbConn) return undefined;\n  const rows = await dbConn.select().from(participants).where(eq(participants.id, id)).limit(1);\n  return rows[0];\n}\n\n' + dbAnchor);
write("server/db.ts", db);

// ------------------------- Client privacy/session calls -------------------------
for (const name of ["client/src/pages/Home.tsx", "client/src/pages/Jogos.tsx", "client/src/pages/Ranking.tsx", "client/src/pages/MeuProgresso.tsx", "client/src/components/Navbar.tsx"]) {
  let source = read(name);
  source = source.replace(/\{ wwid: participant\?\.wwid \|\| "" \}/g, "{}");
  write(name, source);
}
let quiz = read("client/src/components/QuizGamePlayer.tsx");
quiz = quiz.replace('{ participantWwid: participant?.wwid || "", gameType }', '{ gameType }');
write("client/src/components/QuizGamePlayer.tsx", quiz);

let navbar = read("client/src/components/Navbar.tsx");
navbar = navbar.replace('    else navigate("/jogos");', '    else navigate("/jogos?identify=1");');
navbar = navbar.replace('<span className="font-mono text-xs text-amber-300">\n                      WWID: {participant.wwid}\n                    </span>', '<span className="font-mono text-xs text-amber-300">\n                      Perfil: {participant.participantType === "cummins" ? "Cummins" : participant.participantType === "terceiro" ? "Terceiro" : "Visitante"}\n                    </span>');
write("client/src/components/Navbar.tsx", navbar);

let jogos = read("client/src/pages/Jogos.tsx");
jogos = jogos.replace(
  '    const target = params.get("play") || params.get("game");\n    if (!target) return;',
  '    const target = params.get("play") || params.get("game");\n    if (params.get("identify") === "1" && !participant) {\n      setIdentifyModalOpen(true);\n      return;\n    }\n    if (!target) return;'
);
write("client/src/pages/Jogos.tsx", jogos);

// ------------------------- Admin: no credential in data/query payloads -------------------------
let admin = read("client/src/pages/Admin.tsx");
admin = admin.replace(/\{ adminKey, /g, "{ ");
admin = admin.replace(/mutate\(\{ adminKey, /g, "mutate({ ");
admin = admin.replace(/^\s+adminKey,\n/gm, "");
admin = admin.replace(/previewAdminKey=\{adminKey\}/g, "");
admin = admin.replace('            setAdminKey(cleanKey);\n            setIsAuthenticated(true);', '            setAdminKey("");\n            setIsAuthenticated(true);');
write("client/src/pages/Admin.tsx", admin);

// ------------------------- Accessible toolbar semantics -------------------------
let toolbar = read("client/src/components/AccessibilityToolbar.tsx");
toolbar = toolbar.replace('  const panelRef = useRef<HTMLDivElement>(null);', '  const panelRef = useRef<HTMLDivElement>(null);\n  const triggerRef = useRef<HTMLButtonElement>(null);');
toolbar = toolbar.replace('    if (!open) return;\n    panelRef.current?.focus();', '    if (!open) {\n      triggerRef.current?.focus();\n      return;\n    }\n    panelRef.current?.focus();');
toolbar = toolbar.replace('          aria-labelledby="accessibility-title"', '          id="accessibility-panel"\n          aria-labelledby="accessibility-title"');
toolbar = toolbar.replace('        type="button"\n        onClick={() => setOpen((current) => !current)}', '        ref={triggerRef}\n        type="button"\n        onClick={() => setOpen((current) => !current)}');
toolbar = toolbar.replace('        aria-controls="accessibility-title"', '        aria-controls="accessibility-panel"');
write("client/src/components/AccessibilityToolbar.tsx", toolbar);

// ------------------------- 3D fullscreen stability and keyboard use -------------------------
let experience = read("client/src/components/Sipat3DExperience.tsx");
experience = experience.replace('  if (heroLayout && !immersive) {', '  if (heroLayout) {');
experience = experience.replace('        <div ref={experienceRef} className="sipat-3d-hero-container flex flex-col gap-3">', '        <div ref={experienceRef} className={`${immersive ? "fixed inset-0 z-[80] overflow-y-auto bg-[#070a0f] p-3 sm:p-5" : "sipat-3d-hero-container"} flex flex-col gap-3`}>');
experience = experience.replace('              <Maximize2 className="mr-1.5 h-3.5 w-3.5" /> Tela cheia', '              {immersive ? <Minimize2 className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" /> : <Maximize2 className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />} {immersive ? "Sair da tela cheia" : "Tela cheia"}');
write("client/src/components/Sipat3DExperience.tsx", experience);

let viewer = read("client/src/components/AxleAssemblyViewer.tsx");
viewer = viewer.replace('              ref={canvasRef}\n              aria-label="Visualizador 3D Interativo do Eixo Traseiro Meritor Cummins MS-120 com Exploded View"\n              className="relative z-10 w-full h-full cursor-grab active:cursor-grabbing outline-none"', '              ref={canvasRef}\n              tabIndex={0}\n              role="application"\n              aria-label="Visualizador 3D interativo do eixo traseiro Meritor Cummins MS-120. Use as setas para girar, mais e menos para zoom, R para resetar e M para medir."\n              onKeyDown={(event) => {\n                if (event.key === "r" || event.key === "R") { event.preventDefault(); handleReset(); return; }\n                if (event.key === "m" || event.key === "M") { event.preventDefault(); handleMeasureToggle(); return; }\n                if (event.key === "+" || event.key === "=") { event.preventDefault(); zoomBy(-1.2); return; }\n                if (event.key === "-" || event.key === "_") { event.preventDefault(); zoomBy(1.2); return; }\n                if (event.key === "ArrowLeft" || event.key === "ArrowRight") {\n                  event.preventDefault(); cameraRef.current.theta += event.key === "ArrowLeft" ? -0.12 : 0.12;\n                }\n                if (event.key === "ArrowUp" || event.key === "ArrowDown") {\n                  event.preventDefault(); cameraRef.current.phi = Math.max(0.25, Math.min(Math.PI - 0.25, cameraRef.current.phi + (event.key === "ArrowUp" ? -0.08 : 0.08)));\n                }\n              }}\n              className="relative z-10 w-full h-full cursor-grab active:cursor-grabbing outline-none focus-visible:ring-4 focus-visible:ring-amber-300"');
viewer = viewer.replace('setMeasuredDistance("Bitola entre flanges dos cubos: 1.688 mm (Conforme catálogo MS-120)");', 'setMeasuredDistance("Bitola entre flanges dos cubos: 1,688 mm (referência didática do catálogo MS-120)");');
write("client/src/components/AxleAssemblyViewer.tsx", viewer);

// ------------------------- Secure progress page -------------------------
let progress = read("client/src/pages/MeuProgresso.tsx");
progress = progress.replace('  const [searchWwid, setSearchWwid] = useState(participant?.wwid || "");\n  const [activeWwid, setActiveWwid] = useState(participant?.wwid || "");', '  const [searchWwid, setSearchWwid] = useState("");\n  const [activeWwid, setActiveWwid] = useState("");');
progress = progress.replace('    { wwid: activeWwid },\n    { enabled: !!activeWwid }', '    {},\n    { enabled: Boolean(participant) }');
progress = progress.replace('  const handleSearch = (e: React.FormEvent) => {\n    e.preventDefault();\n    if (searchWwid.trim()) {\n      setActiveWwid(searchWwid.trim().toUpperCase());\n    }\n  };', '  const handleSearch = (e: React.FormEvent) => {\n    e.preventDefault();\n    if (participant) setActiveWwid("session");\n  };');
const oldLookupStart = progress.indexOf('      {/* Chapa / WWID lookup section */}');
const oldLookupEnd = progress.indexOf('\n\n        {progressQuery.isLoading', oldLookupStart);
if (oldLookupStart < 0 || oldLookupEnd < 0) throw new Error("Bloco de consulta do progresso não encontrado");
const newLookup = `      {/* Consulta protegida por sessão */}\n      <section className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">\n        {participant ? (\n          <form onSubmit={handleSearch} className="flex flex-col gap-3 rounded-xl border border-white/10 bg-[#141822] p-4 sm:flex-row sm:items-end">\n            <div className="flex-1">\n              <span className="mb-1 block text-[11px] font-mono text-slate-300">SESSÃO DO PARTICIPANTE</span>\n              <p className="text-sm text-slate-200">Progresso vinculado à sua identificação nesta sessão. O identificador corporativo não é exibido publicamente.</p>\n            </div>\n            <Button type="submit" className="min-h-11 bg-[#da291c] px-6 text-xs font-bold uppercase text-white hover:bg-[#b01e12]">Atualizar progresso</Button>\n          </form>\n        ) : (\n          <div className="rounded-xl border border-amber-400/30 bg-amber-950/20 p-5 text-center">\n            <h2 className="font-industrial text-xl uppercase text-white">Identifique-se para consultar seu progresso</h2>\n            <p className="mt-2 text-sm text-slate-300">Por privacidade, a consulta é vinculada à sessão do participante e não aceita busca pública por chapa ou WWID.</p>\n            <Button asChild className="mt-4 min-h-11 bg-[#da291c] text-xs font-bold uppercase text-white hover:bg-[#b01e12]"><Link href="/jogos?identify=1">Identificar e começar</Link></Button>\n          </div>\n        )}\n      </section>`;
progress = progress.slice(0, oldLookupStart) + newLookup + progress.slice(oldLookupEnd);
progress = progress.replace('{activeWwid}', '{participant ? "sua sessão" : "sua sessão"}');
progress = progress.replace('Chapa: <strong className="text-amber-400">{pData.chapa}</strong> • WWID: <strong className="text-amber-400">{pData.wwid}</strong> • Maior Dificuldade:', 'Perfil protegido • Maior Dificuldade:');
write("client/src/pages/MeuProgresso.tsx", progress);

console.log("Patch final aplicado com sucesso.");
