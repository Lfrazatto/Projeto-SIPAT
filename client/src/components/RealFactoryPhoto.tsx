import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

type RealFactoryPhotoProps = {
  src: string;
  alt: string;
  caption: string;
  credit: string;
  sourceUrl: string;
  className?: string;
  imageClassName?: string;
};

export function RealFactoryPhoto({
  src,
  alt,
  caption,
  credit,
  sourceUrl,
  className,
  imageClassName,
}: RealFactoryPhotoProps) {
  return (
    <figure className={cn("overflow-hidden rounded-2xl border border-white/10 bg-[#141822] shadow-xl", className)}>
      <div className="aspect-[16/9] overflow-hidden bg-black/30">
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          className={cn("h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]", imageClassName)}
        />
      </div>
      <figcaption className="grid gap-2 border-t border-white/10 px-4 py-3 sm:grid-cols-[1fr_auto] sm:items-center">
        <span className="text-xs leading-relaxed text-slate-300">{caption}</span>
        <a
          href={sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-red-300 transition hover:text-white focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-[#141822]"
          aria-label={`Abrir fonte da foto: ${credit}`}
        >
          {credit}
          <ExternalLink className="h-3 w-3 shrink-0" aria-hidden="true" />
        </a>
      </figcaption>
    </figure>
  );
}
