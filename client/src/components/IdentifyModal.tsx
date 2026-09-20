import React, { useId, useState } from "react";
import { AlertTriangle, ArrowRight, BadgeCheck, Building2, ShieldCheck, Ticket, UserRound } from "lucide-react";
import { useParticipant } from "@/contexts/ParticipantContext";
import { trpc } from "@/lib/trpc";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface IdentifyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  title?: string;
}

type ParticipantType = "terceiro" | "cummins" | "visitante";

const profiles: Array<{ type: ParticipantType; label: string; detail: string; Icon: typeof BadgeCheck }> = [
  { type: "terceiro", label: "Terceiro", detail: "Acesso pela chapa", Icon: BadgeCheck },
  { type: "cummins", label: "Funcionário Cummins", detail: "Acesso pelo WWID", Icon: Building2 },
  { type: "visitante", label: "Visitante", detail: "Acesso apenas com o nome", Icon: Ticket },
];

export function IdentifyModal({ open, onOpenChange, onSuccess, title = "Identificação para participar" }: IdentifyModalProps) {
  const { participant, setParticipant } = useParticipant();
  const [participantType, setParticipantType] = useState<ParticipantType>("terceiro");
  const [name, setName] = useState(participant?.name || "");
  const [identifier, setIdentifier] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const errorId = useId();
  const helpId = useId();

  const identifyMutation = trpc.participant.identify.useMutation({
    onSuccess: (data) => {
      setParticipant(data.participant);
      toast.success(`Identificação confirmada para ${data.participant.name}.`);
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error) => setErrorMsg(error.message || "Não foi possível validar a identificação."),
  });

  const selectProfile = (type: ParticipantType) => {
    setParticipantType(type);
    setIdentifier("");
    setErrorMsg("");
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMsg("");
    const cleanName = name.trim();
    const cleanIdentifier = identifier.trim().toUpperCase();
    if (cleanName.length < 2) return setErrorMsg("Informe seu nome completo, com pelo menos 2 caracteres.");
    if (participantType !== "visitante" && !cleanIdentifier) return setErrorMsg(`Informe ${participantType === "terceiro" ? "a chapa" : "o WWID"}.`);
    identifyMutation.mutate({ name: cleanName, participantType, identifier: participantType === "visitante" ? undefined : cleanIdentifier });
  };

  const isVisitor = participantType === "visitante";
  const identifierLabel = participantType === "terceiro" ? "Chapa do terceiro" : "WWID corporativo";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border border-white/15 bg-[#11151d] text-slate-100 shadow-2xl sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-lg border border-red-400/40 bg-red-950/50"><ShieldCheck className="h-6 w-6 text-red-300" aria-hidden="true" /></span><span className="v2-kicker">Etapa 1 de 2</span></div>
          <DialogTitle className="font-industrial text-xl font-bold uppercase tracking-wide text-white">{title}</DialogTitle>
          <DialogDescription className="text-sm leading-relaxed text-slate-300">Escolha seu perfil. A identificação serve apenas para salvar e recuperar o progresso; nenhuma senha pessoal é solicitada.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-2" noValidate>
          {errorMsg && <div id={errorId} role="alert" aria-live="assertive" className="flex items-start gap-2 rounded-lg border border-red-400/50 bg-red-950/60 p-3 text-sm text-red-100"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-300" aria-hidden="true" /><span>{errorMsg}</span></div>}

          <fieldset>
            <legend className="mb-2 text-sm font-semibold text-white">Qual é o seu perfil?</legend>
            <div role="radiogroup" className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {profiles.map(({ type, label, detail, Icon }) => {
                const selected = participantType === type;
                return <button key={type} type="button" role="radio" aria-checked={selected} onClick={() => selectProfile(type)} className={`min-h-24 rounded-xl border p-3 text-left transition-colors ${selected ? "border-amber-300 bg-amber-400/15" : "border-white/15 bg-black/30 hover:border-white/40"}`}><Icon className={`mb-2 h-5 w-5 ${selected ? "text-amber-300" : "text-slate-300"}`} aria-hidden="true" /><span className="block text-sm font-black uppercase text-white">{label}</span><span className="mt-1 block text-xs text-slate-300">{detail}</span></button>;
              })}
            </div>
          </fieldset>

          <div className="space-y-2">
            <Label htmlFor="participant-full-name" className="flex items-center gap-2 text-sm font-semibold text-white"><UserRound className="h-4 w-4 text-slate-300" aria-hidden="true" /> Nome completo <span aria-hidden="true">*</span></Label>
            <Input id="participant-full-name" name="name" autoComplete="name" required minLength={2} value={name} onChange={(event) => setName(event.target.value)} aria-invalid={Boolean(errorMsg && name.trim().length < 2)} aria-describedby={errorMsg ? errorId : helpId} placeholder="Ex.: Ana Souza" className="min-h-11 border-white/20 bg-black/40 text-base text-white placeholder:text-slate-500" />
          </div>

          {!isVisitor && <div className="space-y-2"><Label htmlFor="participant-identifier" className="text-sm font-semibold text-white">{identifierLabel} <span aria-hidden="true">*</span></Label><Input id="participant-identifier" name="identifier" autoComplete="off" required value={identifier} onChange={(event) => setIdentifier(event.target.value.toUpperCase())} aria-invalid={Boolean(errorMsg && !identifier.trim())} aria-describedby={errorMsg ? errorId : helpId} placeholder={participantType === "terceiro" ? "Ex.: 123456" : "Ex.: AB12345"} className="min-h-11 border-white/20 bg-black/40 font-mono text-base uppercase text-white placeholder:text-slate-500" /></div>}

          <p id={helpId} className="rounded-lg border border-white/10 bg-white/5 p-3 text-xs leading-relaxed text-slate-300">{isVisitor ? "Visitantes informam somente o nome. Para evitar expor dados, a identificação fica armazenada apenas durante esta sessão do navegador." : `Use ${participantType === "terceiro" ? "a chapa fornecida pela empresa contratada" : "seu WWID corporativo"}. A identificação fica armazenada apenas durante esta sessão do navegador.`}</p>

          <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="min-h-11 border-white/20 text-white hover:bg-white/10">Cancelar</Button>
            <Button type="submit" disabled={identifyMutation.isPending} className="min-h-11 bg-[#da291c] font-bold text-white hover:bg-[#b52216]">{identifyMutation.isPending ? "Validando…" : "Confirmar e continuar"}<ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" /></Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
