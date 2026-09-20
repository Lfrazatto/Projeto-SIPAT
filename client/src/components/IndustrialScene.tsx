import { Cog, Factory, HardHat, ShieldCheck, Wrench } from "lucide-react";

type IndustrialSceneProps = {
  variant?: "assembly" | "operations" | "safety";
  label: string;
  className?: string;
};

const palette = {
  assembly: {
    glow: "from-red-500/30 via-transparent to-cyan-500/20",
    accent: "text-red-300",
    title: "LINHA DE MONTAGEM",
    subtitle: "TECNOLOGIA • PRECISÃO • SEGURANÇA",
  },
  operations: {
    glow: "from-cyan-500/25 via-transparent to-amber-500/20",
    accent: "text-cyan-300",
    title: "OPERAÇÃO CDBS",
    subtitle: "EIXOS • FREIOS • DRIVETRAIN",
  },
  safety: {
    glow: "from-emerald-500/25 via-transparent to-red-500/20",
    accent: "text-emerald-300",
    title: "CUIDADO ATIVO",
    subtitle: "PESSOAS • PROCESSO • PREVENÇÃO",
  },
} as const;

export function IndustrialScene({ variant = "operations", label, className = "" }: IndustrialSceneProps) {
  const theme = palette[variant];
  return (
    <div role="img" aria-label={label} className={`relative isolate min-h-44 overflow-hidden bg-[#111722] ${className}`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${theme.glow}`} aria-hidden="true" />
      <div className="industrial-grid-bg absolute inset-0 opacity-40" aria-hidden="true" />
      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/80 to-transparent" aria-hidden="true" />
      <div className="absolute -bottom-8 left-[8%] h-28 w-28 rounded-full border-[18px] border-slate-600/30" aria-hidden="true" />
      <div className="absolute -bottom-5 right-[12%] h-24 w-24 rounded-full border-[16px] border-red-500/20" aria-hidden="true" />
      <Factory className="absolute left-[10%] top-[22%] h-20 w-20 text-slate-400/25" strokeWidth={1.2} aria-hidden="true" />
      <Cog className="absolute right-[13%] top-[13%] h-16 w-16 text-slate-300/20" strokeWidth={1.1} aria-hidden="true" />
      <Wrench className="absolute left-[43%] top-[25%] h-14 w-14 -rotate-12 text-amber-300/25" strokeWidth={1.2} aria-hidden="true" />
      {variant === "safety" ? <ShieldCheck className="absolute right-[38%] top-[16%] h-16 w-16 text-emerald-300/35" aria-hidden="true" /> : <HardHat className="absolute right-[38%] top-[16%] h-16 w-16 text-amber-300/30" aria-hidden="true" />}
      <div className="absolute inset-x-0 bottom-0 border-t border-white/10 bg-black/45 px-5 py-4 backdrop-blur-sm">
        <div className={`font-mono text-[10px] font-bold tracking-[.2em] ${theme.accent}`}>{theme.subtitle}</div>
        <div className="mt-1 font-industrial text-xl font-black tracking-wide text-white">{theme.title}</div>
      </div>
    </div>
  );
}
