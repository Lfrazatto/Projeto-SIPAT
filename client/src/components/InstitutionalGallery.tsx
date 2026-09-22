import { useEffect, useId, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ExternalLink, Image as ImageIcon, X } from "lucide-react";
import { REAL_PHOTOS } from "@/data/realPhotos";

type GalleryItem = {
  id: string;
  category: string;
  title: string;
  alt: string;
  caption: string;
  credit: string;
  sourceUrl?: string;
  date?: string;
  src: string;
};

export const GALLERY_ITEMS: GalleryItem[] = [
  {
    id: "producao-osasco",
    category: "Cummins / Unidade de Osasco",
    title: "Linha de produção em Osasco",
    alt: "Linha automatizada de produção em uma unidade industrial da Cummins em Osasco, com equipamentos e área de montagem.",
    caption: "A operação industrial conecta automação, qualidade e segurança.",
    credit: REAL_PHOTOS.productionLine.credit,
    sourceUrl: REAL_PHOTOS.productionLine.sourceUrl,
    src: REAL_PHOTOS.productionLine.src,
  },
  {
    id: "montagem-osasco",
    category: "Cummins / Unidade de Osasco",
    title: "Montagem de componentes",
    alt: "Pessoa trabalhando na montagem de componentes em uma linha industrial da operação Cummins Meritor em Osasco.",
    caption: "Pessoas e processos fazem parte da evolução da manufatura.",
    credit: REAL_PHOTOS.assembly.credit,
    sourceUrl: REAL_PHOTOS.assembly.sourceUrl,
    src: REAL_PHOTOS.assembly.src,
  },
  {
    id: "eixo-ms120",
    category: "Segurança e aprendizagem",
    title: "Eixo para aplicações comerciais",
    alt: "Eixo automotivo Cummins fotografado em contexto industrial, usado para apoiar a explicação técnica do projeto 3D.",
    caption: "Tecnologia também pode ser uma forma de aprender com segurança.",
    credit: REAL_PHOTOS.axle.credit,
    sourceUrl: REAL_PHOTOS.axle.sourceUrl,
    src: REAL_PHOTOS.axle.src,
  },
  {
    id: "turma-formare",
    category: "Formare / Alunos e equipe",
    title: "Alunos do Formare responsáveis pelo projeto",
    alt: "Grupo de alunos do Formare reunido em uma sala, diante de uma lousa, celebrando o desenvolvimento do projeto SIPAT Cummins Osasco.",
    caption: "Alunos do Formare responsáveis pelo desenvolvimento do projeto SIPAT Cummins Osasco.",
    credit: REAL_PHOTOS.team.credit,
    src: REAL_PHOTOS.team.src,
  },
];

const categories = ["Todas", ...Array.from(new Set(GALLERY_ITEMS.map((item) => item.category)))];

export function InstitutionalGallery({ compact = false }: { compact?: boolean }) {
  const [category, setCategory] = useState("Todas");
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const titleId = useId();
  const modalRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const filtered = category === "Todas" ? GALLERY_ITEMS : GALLERY_ITEMS.filter((item) => item.category === category);
  const selected = selectedIndex === null ? null : filtered[selectedIndex] ?? null;

  useEffect(() => {
    if (!selected) {
      previouslyFocusedRef.current?.focus();
      previouslyFocusedRef.current = null;
      return;
    }
    previouslyFocusedRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedIndex(null);
      if (event.key === "ArrowRight") setSelectedIndex((index) => index === null ? 0 : (index + 1) % filtered.length);
      if (event.key === "ArrowLeft") setSelectedIndex((index) => index === null ? 0 : (index - 1 + filtered.length) % filtered.length);
      if (event.key === "Tab") {
        const focusables = Array.from(modalRef.current?.querySelectorAll<HTMLElement>("button, a, [tabindex='0']") || []).filter((element) => !element.hasAttribute("disabled"));
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (first && last && event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (first && last && !event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    window.setTimeout(() => modalRef.current?.focus(), 0);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [selected, filtered.length]);

  return (
    <section aria-labelledby={titleId} className="space-y-7">
      {!compact && (
        <div>
          <div className="v2-kicker flex items-center gap-2"><ImageIcon className="h-4 w-4 text-[#da291c]" aria-hidden="true" /> Galeria institucional</div>
          <h2 id={titleId} className="mt-2 font-industrial text-4xl uppercase text-white">Pessoas, tecnologia e aprendizagem</h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-300">Imagens selecionadas para contextualizar a Cummins, a unidade de Osasco, o Formare e o desenvolvimento do projeto. Cada item informa sua origem e o uso recomendado.</p>
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Categorias da galeria">
        {categories.map((item) => (
          <button key={item} type="button" role="tab" aria-selected={category === item} onClick={() => { setCategory(item); setSelectedIndex(null); }} className={`min-h-11 shrink-0 rounded-full border px-4 text-xs font-bold transition ${category === item ? "border-amber-300 bg-amber-400 text-slate-950" : "border-white/15 bg-white/5 text-slate-200 hover:bg-white/10"}`}>
            {item}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {filtered.map((item, index) => (
          <button key={item.id} type="button" onClick={() => setSelectedIndex(index)} className="group overflow-hidden rounded-2xl border border-white/10 bg-[#141822] text-left transition hover:-translate-y-1 hover:border-amber-300/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300">
            <div className="aspect-video overflow-hidden bg-black/40"><img src={item.src} alt={item.alt} loading="lazy" width="1280" height="720" className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" /></div>
            <div className="p-4"><div className="text-[10px] font-mono uppercase tracking-wider text-amber-300">{item.category}</div><h3 className="mt-2 font-industrial text-lg uppercase text-white">{item.title}</h3><p className="mt-2 text-xs leading-relaxed text-slate-400">{item.caption}</p><p className="mt-3 text-[10px] text-slate-500">Crédito: {item.credit}</p></div>
          </button>
        ))}
      </div>

      {selected && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby={`${titleId}-modal-title`} onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedIndex(null); }}>
          <div ref={modalRef} tabIndex={-1} className="relative max-h-[calc(100dvh-2rem)] w-full max-w-5xl overflow-auto rounded-2xl border border-white/15 bg-[#141822] shadow-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300">
            <div className="flex items-center justify-between gap-4 border-b border-white/10 p-4"><div><div className="text-[10px] font-mono uppercase tracking-wider text-amber-300">{selected.category}</div><h2 id={`${titleId}-modal-title`} className="mt-1 font-industrial text-xl uppercase text-white">{selected.title}</h2></div><button type="button" onClick={() => setSelectedIndex(null)} aria-label="Fechar galeria" className="min-h-11 min-w-11 rounded-lg p-2 text-slate-300 hover:bg-white/10 hover:text-white"><X className="mx-auto h-5 w-5" aria-hidden="true" /></button></div>
            <div className="relative bg-black"><img src={selected.src} alt={selected.alt} width="1280" height="720" className="max-h-[65vh] w-full object-contain" /><button type="button" aria-label="Imagem anterior" onClick={() => setSelectedIndex((index) => index === null ? 0 : (index - 1 + filtered.length) % filtered.length)} className="absolute left-3 top-1/2 min-h-11 min-w-11 -translate-y-1/2 rounded-full border border-white/20 bg-black/70 p-2 text-white hover:bg-black"><ChevronLeft className="mx-auto h-6 w-6" /></button><button type="button" aria-label="Próxima imagem" onClick={() => setSelectedIndex((index) => index === null ? 0 : (index + 1) % filtered.length)} className="absolute right-3 top-1/2 min-h-11 min-w-11 -translate-y-1/2 rounded-full border border-white/20 bg-black/70 p-2 text-white hover:bg-black"><ChevronRight className="mx-auto h-6 w-6" /></button></div>
            <div className="space-y-2 p-4 text-sm text-slate-300"><p>{selected.caption}</p><p className="text-xs text-slate-500">Crédito: {selected.credit}{selected.date ? ` • ${selected.date}` : ""}</p>{selected.sourceUrl ? <a href={selected.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 text-xs font-bold text-amber-300 hover:text-white">Ver fonte da imagem <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" /></a> : <p className="text-xs text-amber-200/80">Imagem enviada pela equipe do projeto; confirmar autorização de uso antes de publicação externa.</p>}</div>
          </div>
        </div>
      )}
    </section>
  );
}

export default InstitutionalGallery;
