import fs from "node:fs";

const file = "client/src/pages/MeuProgresso.tsx";
let content = fs.readFileSync(file, "utf8");

const oldAchievementCard = `            <div className="flex justify-center pt-4">
              <Button asChild size="lg" className="bg-[#da291c] hover:bg-[#b01e12] text-white font-bold uppercase tracking-wider text-xs px-8 py-6 flex items-center gap-2"><Link href="/jogos"><RotateCcw className="w-4 h-4" /><span>Refazer Desafios Para Melhorar Pontuação</span></Link></Button>
            </div>`;

const newAchievementCard = `            {/* Grade de Conquistas Reais do Backend */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black font-industrial uppercase text-white flex items-center gap-2">
                  <Medal className="w-5 h-5 text-amber-400" /> Conquistas Desbloqueadas
                </h3>
                <span className="text-xs font-mono text-amber-300">
                  {(progressQuery.data?.achievements || []).filter((a: any) => a.unlocked).length} de {(progressQuery.data?.achievements || []).length}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {(progressQuery.data?.achievements || []).map((ach: any) => (
                  <div
                    key={ach.key}
                    className={\`p-4 rounded-xl border transition-all \${
                      ach.unlocked
                        ? "bg-amber-950/20 border-amber-500/50 shadow-md shadow-amber-950/30"
                        : "bg-black/30 border-white/10 opacity-60"
                    }\`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-mono font-bold uppercase text-amber-400">
                        {ach.category}
                      </span>
                      <span className={\`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border \${
                        ach.unlocked
                          ? "border-emerald-400/40 bg-emerald-950/60 text-emerald-300"
                          : "border-white/10 bg-white/5 text-slate-400"
                      }\`}>
                        {ach.unlocked ? "Conquistado" : "Bloqueado"}
                      </span>
                    </div>
                    <div className="mt-2 font-industrial font-bold uppercase text-sm text-white">
                      {ach.title}
                    </div>
                    <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                      {ach.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-center pt-4">
              <Button asChild size="lg" className="bg-[#da291c] hover:bg-[#b01e12] text-white font-bold uppercase tracking-wider text-xs px-8 py-6 flex items-center gap-2"><Link href="/jogos"><RotateCcw className="w-4 h-4" /><span>Refazer Desafios Para Melhorar Pontuação</span></Link></Button>
            </div>`;

if (!content.includes(oldAchievementCard)) throw new Error("Trecho de CTA em MeuProgresso não encontrado");
content = content.replace(oldAchievementCard, newAchievementCard);
fs.writeFileSync(file, content);
console.log("MeuProgresso.tsx atualizado com conquistas dinâmicas.");
