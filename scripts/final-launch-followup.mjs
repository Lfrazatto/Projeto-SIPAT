import fs from "node:fs";
const root = process.cwd();
const path = (name) => `${root}/${name}`;
const read = (name) => fs.readFileSync(path(name), "utf8");
const write = (name, value) => fs.writeFileSync(path(name), value);

let routers = read("server/routers.ts");
routers = routers.replace('          participantChapa: z.string().min(1),\n          participantName: z.string().min(1),\n          participantWwid: z.string().min(1),', '          participantChapa: z.string().min(1).max(128).optional(),\n          participantName: z.string().min(1).max(120).optional(),\n          participantWwid: z.string().min(1).max(128).optional(),');
routers = routers.replace('        const participant = sessionParticipant || await db.findOrCreateParticipant(input.participantName, input.participantChapa, input.participantWwid);', '        const participant = sessionParticipant || await db.findOrCreateParticipant(input.participantName || "Colaborador", input.participantChapa || "SEM-CHAPA", input.participantWwid || "SEM-WWID");');
routers = routers.replace('participantName: participant.name, participantChapa: participant.chapa, participantWwid: participant.wwid', 'participantName: participant.name, participantChapa: participant.chapa, participantWwid: participant.wwid');
write("server/routers.ts", routers);

let admin = read("client/src/pages/Admin.tsx");
admin = admin.replace('{ adminKey },', '{} ,');
admin = admin.replace('{ adminKey }', '{}');
admin = admin.replace('Segurança + Ergonomia', 'Segurança + Lean Manufacturing');
admin = admin.replace('q.gameType === "quiz_seguranca" ? "Segurança" : "Ergonomia"', 'q.gameType === "quiz_seguranca" ? "Segurança" : "Lean Manufacturing"');
write("client/src/pages/Admin.tsx", admin);

for (const name of ["client/src/components/QuizGamePlayer.tsx", "client/src/components/OrganizeFactoryGame.tsx", "client/src/components/SpotErrorGame.tsx"]) {
  let source = read(name);
  source = source.replace(/\s*participantChapa: participant(?:\?\.)?\.chapa \|\| "SEM-CHAPA",?/g, "");
  source = source.replace(/\s*participantName: participant(?:\?\.)?\.name \|\| "Colaborador",?/g, "");
  source = source.replace(/\s*participantWwid: participant(?:\?\.)?\.wwid \|\| "WWID",?/g, "");
  source = source.replace(/\s*participantChapa: participant\.chapa,?/g, "");
  source = source.replace(/\s*participantName: participant\.name,?/g, "");
  source = source.replace(/\s*participantWwid: participant\.wwid,?/g, "");
  write(name, source);
}

let jogos = read("client/src/pages/Jogos.tsx");
jogos = jogos.replace(/\s*WWID: <strong className="text-amber-400">\{participant\.wwid\}<\/strong> •/g, "");
write("client/src/pages/Jogos.tsx", jogos);

let toolbar = read("client/src/components/AccessibilityToolbar.tsx");
toolbar = toolbar.replace('  useEffect(() => {\n    if (!open) {', '  useEffect(() => {\n    const openFromFooter = () => setOpen(true);\n    window.addEventListener("open-sipat-accessibility", openFromFooter);\n    return () => window.removeEventListener("open-sipat-accessibility", openFromFooter);\n  }, []);\n\n  useEffect(() => {\n    if (!open) {');
write("client/src/components/AccessibilityToolbar.tsx", toolbar);

let footer = read("client/src/components/SiteFooter.tsx");
footer = footer.replace('<a href="#conteudo-principal" className="flex min-h-10 items-center gap-2 hover:text-white"><Accessibility className="h-4 w-4 text-amber-300" aria-hidden="true" /> Acessibilidade</a>', '<a href="#accessibility-panel" onClick={(event) => { event.preventDefault(); window.dispatchEvent(new Event("open-sipat-accessibility")); }} className="flex min-h-10 items-center gap-2 hover:text-white"><Accessibility className="h-4 w-4 text-amber-300" aria-hidden="true" /> Acessibilidade</a>');
footer = footer.replace('text-[10px] leading-relaxed text-slate-600', 'text-[10px] leading-relaxed text-slate-400');
write("client/src/components/SiteFooter.tsx", footer);
console.log("Patch complementar aplicado.");
