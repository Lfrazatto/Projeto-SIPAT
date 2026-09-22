import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { HeartHandshake, Send, Sparkles, Shield, User, HelpCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { MURAL_PROMPTS } from "@shared/muralData";
import { useParticipant } from "@/contexts/ParticipantContext";
import { toast } from "sonner";

interface MuralSubmitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmitted?: () => void;
}

const MAX_CHARS = 280;

export function MuralSubmitModal({ open, onOpenChange, onSubmitted }: MuralSubmitModalProps) {
  const { participant } = useParticipant();
  const [selectedPromptKey, setSelectedPromptKey] = useState<string>(MURAL_PROMPTS[0].key);
  const [message, setMessage] = useState("");
  const [publicName, setPublicName] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [consent, setConsent] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const selectedPrompt = MURAL_PROMPTS.find((p) => p.key === selectedPromptKey) || MURAL_PROMPTS[0];

  useEffect(() => {
    if (open) {
      setHasSubmitted(false);
      setMessage("");
      setConsent(false);
      if (participant?.name) {
        // Sugere o primeiro nome do participante caso queira se identificar
        const firstName = participant.name.trim().split(" ")[0];
        setPublicName(firstName);
        setIsAnonymous(false);
      } else {
        setIsAnonymous(true);
      }
    }
  }, [open, participant]);

  const submitMutation = trpc.mural.submitMessage.useMutation({
    onSuccess: (data) => {
      setHasSubmitted(true);
      toast.success(data.message);
      if (onSubmitted) onSubmitted();
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao enviar a mensagem. Verifique os dados.");
    },
  });

  const remainingChars = MAX_CHARS - message.length;
  const isOverLimit = remainingChars < 0;
  const isValid = message.trim().length >= 5 && !isOverLimit && consent && !submitMutation.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!consent) {
      toast.error("É necessário concordar com a publicação no mural.");
      return;
    }
    if (message.trim().length < 5) {
      toast.error("Por favor, escreva uma frase com no mínimo 5 caracteres.");
      return;
    }
    if (isOverLimit) {
      toast.error(`A mensagem ultrapassou o limite de ${MAX_CHARS} caracteres.`);
      return;
    }

    submitMutation.mutate({
      promptKey: selectedPrompt.key,
      message: message.trim(),
      publicName: isAnonymous ? undefined : (publicName.trim() || undefined),
      isAnonymous,
      consent: true,
      participantId: participant?.id,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl border-white/15 bg-[#10141d] p-0 text-slate-100 shadow-2xl sm:rounded-2xl max-h-[92dvh] flex flex-col overflow-hidden">
        {/* Topo com identidade acolhedora */}
        <div className="border-b border-white/10 bg-gradient-to-r from-red-950/70 via-[#181d28] to-amber-950/40 p-5 sm:p-6 shrink-0">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-950/40 px-3 py-1 text-[11px] font-mono font-bold uppercase tracking-wider text-amber-200">
            <HeartHandshake className="h-3.5 w-3.5 text-amber-300" aria-hidden="true" />
            Mural Voltar Seguro para Casa
          </div>
          <DialogTitle className="mt-2 font-industrial text-2xl uppercase tracking-wide text-white sm:text-3xl">
            Deixar minha mensagem
          </DialogTitle>
          <p className="mt-1 text-xs text-slate-300 leading-relaxed">
            Cada pessoa tem um motivo para se cuidar. Compartilhe o seu e inspire os colegas da fábrica.
          </p>
        </div>

        {hasSubmitted ? (
          <div className="p-6 text-center space-y-4 my-auto overflow-y-auto">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-emerald-400/40 bg-emerald-950/40 text-emerald-300">
              <Sparkles className="h-7 w-7" aria-hidden="true" />
            </div>
            <h3 className="font-industrial text-2xl uppercase text-white">
              Obrigado por compartilhar!
            </h3>
            <p className="mx-auto max-w-md text-sm text-slate-300 leading-relaxed">
              Sua mensagem foi enviada com sucesso para a moderação da equipe EHS da Cummins. Assim que aprovada, ela ficará visível publicamente no mural.
            </p>
            <div className="pt-2">
              <Button
                type="button"
                onClick={() => onOpenChange(false)}
                className="bg-[#da291c] hover:bg-[#b01e12] text-white font-bold uppercase text-xs min-h-11 px-6"
              >
                Concluir
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
            {/* 1. Pergunta orientadora */}
            <div className="space-y-1.5">
              <Label htmlFor="mural-prompt-select" className="text-xs font-bold uppercase tracking-wide text-slate-300 flex items-center gap-1.5">
                <HelpCircle className="h-3.5 w-3.5 text-amber-300" aria-hidden="true" />
                1. Escolha uma pergunta orientadora
              </Label>
              <select
                id="mural-prompt-select"
                value={selectedPromptKey}
                onChange={(e) => setSelectedPromptKey(e.target.value)}
                className="w-full rounded-xl border border-white/20 bg-black/40 px-3 py-2.5 text-sm font-semibold text-white focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
              >
                {MURAL_PROMPTS.map((p) => (
                  <option key={p.key} value={p.key} className="bg-[#141822] text-white py-1">
                    {p.question}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-400 leading-snug">
                {selectedPrompt.lead}
              </p>
            </div>

            {/* 2. Campo da Frase com contador */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="mural-message-input" className="text-xs font-bold uppercase tracking-wide text-slate-300">
                  2. Sua frase ({selectedPrompt.question})
                </Label>
                <span
                  className={`font-mono text-xs font-bold ${
                    isOverLimit
                      ? "text-red-400"
                      : remainingChars <= 30
                      ? "text-amber-300"
                      : "text-slate-400"
                  }`}
                  aria-live="polite"
                >
                  {remainingChars} caracteres
                </span>
              </div>
              <textarea
                id="mural-message-input"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={selectedPrompt.placeholder}
                rows={3}
                required
                className={`w-full rounded-xl border bg-black/40 p-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 ${
                  isOverLimit
                    ? "border-red-500 focus:ring-red-500"
                    : "border-white/20 focus:border-amber-400 focus:ring-amber-400"
                }`}
              />
            </div>

            {/* 3. Privacidade e identificação */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold uppercase text-slate-300 flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-emerald-300" aria-hidden="true" />
                  3. Identificação no mural
                </Label>
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="h-4 w-4 rounded accent-[#da291c]"
                  />
                  <span>Publicar como anônimo</span>
                </label>
              </div>

              {!isAnonymous && (
                <div>
                  <Label htmlFor="mural-name-input" className="text-[11px] text-slate-400">
                    Primeiro nome ou apelido que aparecerá no cartão
                  </Label>
                  <Input
                    id="mural-name-input"
                    value={publicName}
                    onChange={(e) => setPublicName(e.target.value)}
                    placeholder="Ex.: Lucas, Maria (Montagem), etc."
                    maxLength={80}
                    className="mt-1 bg-black/40 border-white/15 text-white text-xs h-9"
                  />
                </div>
              )}
              <p className="text-[10px] text-slate-400 leading-tight">
                Proteção de privacidade: nunca divulgamos chapa, WWID, e-mail ou dados confidenciais publicamente.
              </p>
            </div>

            {/* 4. Consentimento obrigatório */}
            <div className="flex items-start gap-2.5 pt-1">
              <Checkbox
                id="mural-consent"
                checked={consent}
                onCheckedChange={(checked) => setConsent(Boolean(checked))}
                className="mt-0.5 border-white/30 data-[state=checked]:bg-[#da291c] data-[state=checked]:border-[#da291c]"
              />
              <label
                htmlFor="mural-consent"
                className="text-[11px] text-slate-300 leading-snug cursor-pointer select-none"
              >
                Autorizo a exibição pública desta mensagem no <strong>Mural Voltar Seguro para Casa</strong> após a revisão e aprovação pela moderação da Cummins.
              </label>
            </div>

            {/* Ações de envio */}
            <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 pt-3 border-t border-white/10">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="w-full sm:w-auto min-h-11 border-white/20 text-xs text-slate-300 hover:bg-white/10"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={!isValid}
                className="w-full sm:w-auto min-h-11 bg-[#da291c] hover:bg-[#b01e12] text-white font-bold uppercase text-xs px-6 shadow-md shadow-red-950/40 disabled:opacity-50"
              >
                {submitMutation.isPending ? (
                  "Enviando frase..."
                ) : (
                  <>
                    <Send className="mr-1.5 h-4 w-4" aria-hidden="true" />
                    Enviar mensagem
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
