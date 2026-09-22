import { ArrowRight, Zap } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { IdentifyModal } from "@/components/IdentifyModal";
import { useParticipant } from "@/contexts/ParticipantContext";
import { useState } from "react";

/** CTA móvel persistente: fica fora dos jogos para não cobrir controles durante uma partida. */
export function MobileStartBar() {
  const [location, navigate] = useLocation();
  const { participant } = useParticipant();
  const [identifyOpen, setIdentifyOpen] = useState(false);
  const hidden = location.startsWith("/jogos") || location.startsWith("/admin");

  if (hidden) return null;

  const start = () => {
    if (participant) navigate("/jogos");
    else setIdentifyOpen(true);
  };

  return (
    <>
      <div className="mobile-start-bar md:hidden" role="region" aria-label="Acesso rápido aos desafios">
        <Button type="button" onClick={start} className="min-h-12 w-full bg-[#da291c] px-4 text-sm font-black uppercase tracking-wide text-white shadow-lg shadow-red-950/50 hover:bg-[#b01e12]">
          <Zap className="mr-2 h-4 w-4" aria-hidden="true" />
          Começar desafio
          <ArrowRight className="ml-auto h-4 w-4" aria-hidden="true" />
        </Button>
        <Link href="/ranking" className="mobile-start-ranking min-h-12 min-w-12 rounded-xl border border-amber-300/35 bg-[#161a22] px-3 text-center text-[10px] font-bold uppercase tracking-wide text-amber-200">
          Ranking
        </Link>
      </div>
      <IdentifyModal open={identifyOpen} onOpenChange={setIdentifyOpen} onSuccess={() => navigate("/jogos")} />
    </>
  );
}

export default MobileStartBar;
