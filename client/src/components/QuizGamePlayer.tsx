import React, { useState, useEffect, useRef, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useParticipant } from "@/contexts/ParticipantContext";
import { useAccessibility } from "@/contexts/AccessibilityContext";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { QuizFinalResultModal } from "@/components/QuizFinalResultModal";
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  ArrowRight, 
  ShieldAlert, 
  HeartPulse,
  RotateCcw,
  Zap,
  Pause,
  Play
} from "lucide-react";
import { toast } from "sonner";

interface QuizGamePlayerProps {
  gameType: "quiz_seguranca" | "quiz_ergonomia";
  difficulty: "facil" | "medio" | "dificil" | "muito_dificil";
  onBackToGames: () => void;
}

export const QuizGamePlayer: React.FC<QuizGamePlayerProps> = ({
  gameType,
  difficulty,
  onBackToGames,
}) => {
  const { participant } = useParticipant();
  const { extendedTime } = useAccessibility();
  const secondsPerQuestion = extendedTime ? 120 : 60;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [optionOrderSeed] = useState(() => Math.floor(Math.random() * 233280));
  const [selectedOption, setSelectedOption] = useState<"A" | "B" | "C" | "D" | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(secondsPerQuestion);
  const [isAnswered, setIsAnswered] = useState(false);
  const [answerFeedback, setAnswerFeedback] = useState<{
    isCorrect: boolean;
    earnedPoints: number;
    explanation?: string | null;
  } | null>(null);

  // Match statistics
  const [totalScore, setTotalScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [gameStartTime, setGameStartTime] = useState<number>(Date.now());
  const [isFinished, setIsFinished] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [finalSubmitData, setFinalSubmitData] = useState<{
    rank: number;
    isNewBest: boolean;
  } | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const submittedRef = useRef(false);

  // Fetch 12 questions from server
  const questionsQuery = trpc.games.getQuestions.useQuery(
    { gameType },
    { refetchOnWindowFocus: false }
  );

  const verifyMutation = trpc.games.verifyAnswer.useMutation();
  const submitResultMutation = trpc.games.submitResult.useMutation();
  const dailyAttemptsQuery = trpc.games.getDailyAttempts.useQuery(
    { participantWwid: participant?.wwid || "", gameType },
    { enabled: Boolean(participant?.wwid), refetchOnWindowFocus: false }
  );

  const questions = questionsQuery.data || [];
  const currentQuestion = questions[currentIndex];

  const displayOptions = useMemo(() => {
    if (!currentQuestion) return [];
    const options = [
      { key: "A" as const, text: currentQuestion.optionA },
      { key: "B" as const, text: currentQuestion.optionB },
      { key: "C" as const, text: currentQuestion.optionC },
      { key: "D" as const, text: currentQuestion.optionD },
    ];
    // A ordem muda por sessão e por questão, sem revelar a alternativa correta.
    let seed = currentQuestion.id * 97 + currentIndex * 53 + optionOrderSeed;
    return [...options].sort(() => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280 - 0.5;
    });
  }, [currentQuestion, currentIndex, optionOrderSeed]);

  const basePointsPerQuestion = difficulty === "dificil" ? 300 : difficulty === "medio" ? 200 : 100;
  const maxPossibleScore = questions.length * basePointsPerQuestion;

  // Countdown timer logic (60 seconds per question)
  useEffect(() => {
    if (isFinished || isAnswered || isPaused || !currentQuestion) return;

    timerRef.current = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleTimeOut();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIndex, isAnswered, isFinished, isPaused, currentQuestion]);

  const handleTimeOut = () => {
    if (isAnswered) return;
    setIsAnswered(true);
    setWrongCount((c) => c + 1);

    // Call server with remainingSeconds = 0 and an arbitrary invalid option to get correct answer
    if (currentQuestion) {
      verifyMutation.mutate(
        {
          questionId: currentQuestion.id,
          selectedOption: "A",
          remainingSeconds: 0,
          difficulty: difficulty === "muito_dificil" ? "dificil" : difficulty,
        },
        {
          onSuccess: (data) => {
            setAnswerFeedback({
              isCorrect: false,
              earnedPoints: 0,
              explanation: `Tempo esgotado! Você não respondeu dentro dos ${secondsPerQuestion} segundos.`,
            });
          },
          onError: () => setAnswerFeedback({ isCorrect: false, earnedPoints: 0, explanation: "O tempo terminou. Você pode seguir para a próxima questão." }),
        }
      );
    }
  };

  const handleSelectOption = (option: "A" | "B" | "C" | "D") => {
    if (isAnswered || !currentQuestion) return;
    if (timerRef.current) clearInterval(timerRef.current);

    setSelectedOption(option);
    setIsAnswered(true);

    verifyMutation.mutate(
      {
        questionId: currentQuestion.id,
        selectedOption: option,
        remainingSeconds,
        difficulty: difficulty === "muito_dificil" ? "dificil" : difficulty,
      },
      {
        onSuccess: (data) => {
          setAnswerFeedback(data);
          if (data.isCorrect) {
            setCorrectCount((c) => c + 1);
            setTotalScore((s) => s + data.earnedPoints);
          } else {
            setWrongCount((w) => w + 1);
          }
        },
        onError: (error) => {
          setSelectedOption(null);
          setIsAnswered(false);
          setAnswerFeedback(null);
          toast.error(error.message || "Não foi possível verificar a resposta. Tente novamente.");
        },
      }
    );
  };

  const handleNextQuestion = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((idx) => idx + 1);
      setSelectedOption(null);
      setIsAnswered(false);
      setAnswerFeedback(null);
      setRemainingSeconds(secondsPerQuestion);
    } else {
      finishGame();
    }
  };

  const finishGame = () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setIsFinished(true);
    const timeSpentSeconds = Math.max(1, Math.round((Date.now() - gameStartTime) / 1000));

    if (participant) {
      submitResultMutation.mutate(
        {
          participantChapa: participant.chapa,
          participantName: participant.name,
          participantWwid: participant.wwid,
          gameType,
          difficulty,
          score: totalScore,
          correctCount,
          wrongCount,
          timeSpentSeconds,
        },
        {
          onSuccess: (res) => {
            setFinalSubmitData({
              rank: res.rank,
              isNewBest: res.isNewBest,
            });
          },
          onError: (error) => toast.error(error.message || "O quiz terminou, mas não foi possível salvar o resultado."),
        }
      );
    }
  };

  const resetGame = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setAnswerFeedback(null);
    setTotalScore(0);
    setCorrectCount(0);
    setWrongCount(0);
    setIsFinished(false);
    setIsPaused(false);
    setRemainingSeconds(secondsPerQuestion);
    setGameStartTime(Date.now());
    submittedRef.current = false;
    setFinalSubmitData(null);
  };

  if (questionsQuery.isLoading) {
    return (
      <div className="py-24 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-[#da291c] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-slate-300 font-mono text-sm">Carregando perguntas de ergonomia SIPAT CDBS...</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="py-20 text-center space-y-4 max-w-md mx-auto">
        <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto" />
        <h3 className="text-xl font-bold font-industrial uppercase text-white">Nenhuma Pergunta Ativa</h3>
        <p className="text-xs text-slate-400">
          As perguntas para este quiz estão temporariamente desativadas na administração.
        </p>
        <Button onClick={onBackToGames} variant="outline" className="text-xs">
          Voltar aos Jogos
        </Button>
      </div>
    );
  }

  const progressPercent = Math.round(((currentIndex + 1) / questions.length) * 100);
  const potentialPointsNow = Math.round(basePointsPerQuestion * (remainingSeconds / secondsPerQuestion));

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      {/* Quiz Top Bar */}
      <div className="p-4 rounded-xl bg-[#141822] border border-white/10 shadow-xl mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-red-950/80 border border-red-500/40 text-[#da291c]">
            {gameType === "quiz_seguranca" ? (
              <ShieldAlert className="w-6 h-6" />
            ) : (
              <HeartPulse className="w-6 h-6 text-cyan-400" />
            )}
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold tracking-widest text-[#da291c] uppercase">
              DESAFIO OFICIAL SIPAT
            </span>
            <h2 className="text-lg sm:text-xl font-bold font-industrial uppercase text-white">
              {gameType === "quiz_seguranca" ? "Quiz de Segurança" : "Quiz de Ergonomia"}
            </h2>
            {participant && dailyAttemptsQuery.data && (
              <span className="text-[11px] font-mono text-slate-400">
                Tentativas hoje: <strong className="text-white">{dailyAttemptsQuery.data.attemptsToday}</strong> / {dailyAttemptsQuery.data.maxDailyAttempts}
              </span>
            )}
          </div>
        </div>

        {/* Dynamic Live Timer: 60s - Prominent as requested */}
        <div className="flex items-center gap-4">
          <div role="timer" aria-label={`${remainingSeconds} segundos restantes`} className="px-4 py-2 rounded-lg bg-black/60 border border-white/15 flex items-center gap-2">
            <Clock
              className={`w-5 h-5 ${
                remainingSeconds <= 15 ? "text-red-500 animate-pulse" : "text-amber-400"
              }`}
            />
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 font-mono leading-none">TEMPO</span>
              <span
                className={`text-xl sm:text-2xl font-black font-industrial tracking-wider leading-none ${
                  remainingSeconds <= 15 ? "text-red-400" : "text-white"
                }`}
              >
                {remainingSeconds}s
              </span>
            </div>
          </div>

          <Button type="button" variant="outline" onClick={() => setIsPaused(true)} aria-pressed={isPaused} disabled={isAnswered || isFinished || isPaused} className="min-h-11 border-white/20 text-white">
            {isPaused ? <Play className="mr-2 h-4 w-4" aria-hidden="true" /> : <Pause className="mr-2 h-4 w-4" aria-hidden="true" />}
            {isPaused ? "Continuar" : "Pausar"}
          </Button>

          <div className="text-right">
            <span className="text-[10px] text-slate-400 font-mono">PONTUAÇÃO ATUAL</span>
            <div className="text-2xl font-black font-industrial text-[#da291c]">{totalScore} pts</div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6 space-y-2">
        <div className="flex justify-between items-center text-xs text-slate-400">
          <span>
            Questão <strong className="text-white">{currentIndex + 1}</strong> de{" "}
            <strong>{questions.length}</strong>
          </span>
          <span className="font-mono text-[11px] text-amber-400">
            Dificuldade: {difficulty.toUpperCase()} ({basePointsPerQuestion} pts base)
          </span>
        </div>
        <Progress value={progressPercent} className="h-2 bg-slate-800" />
      </div>

      {/* Question Card */}
      {currentQuestion && (
        <div className="rounded-2xl bg-[#161a24] border border-white/10 p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex items-center justify-between">
            <span className="px-3 py-1 rounded text-xs font-mono font-semibold bg-white/5 border border-white/10 text-slate-300">
              Tema: {currentQuestion.theme}
            </span>
            <span className="text-xs font-mono text-slate-400">
              Potencial nesta questão: <strong className="text-emerald-400">{potentialPointsNow} pts</strong>
            </span>
          </div>

          <h3 id="quiz-question" className="text-lg sm:text-2xl font-bold font-industrial text-white leading-relaxed">
            {currentQuestion.question}
          </h3>

          {/* 4 Options Grid */}
          <div className="grid grid-cols-1 gap-3 pt-2" role="group" aria-labelledby="quiz-question">
            {displayOptions.map((opt) => {
              const isSelected = selectedOption === opt.key;

              let btnStyle = "bg-black/40 border-white/10 hover:border-white/30 text-slate-200";

              if (isAnswered) {
                if (isSelected && !answerFeedback?.isCorrect) {
                  btnStyle = "bg-red-950/60 border-red-500 text-red-200 ring-2 ring-red-500/40";
                } else if (isSelected && answerFeedback?.isCorrect) {
                  btnStyle = "bg-white/10 border-white/35 text-white ring-2 ring-white/20";
                } else {
                  btnStyle = "bg-black/30 border-white/5 text-slate-500 opacity-60";
                }
              }

              return (
                <button
                  key={opt.key}
                  type="button"
                  disabled={isAnswered || isPaused}
                  onClick={() => handleSelectOption(opt.key)}
                  className={`p-4 rounded-xl border text-left flex items-start gap-3 transition-all duration-150 ${btnStyle}`}
                >
                  <span
                    className={`w-7 h-7 rounded flex items-center justify-center font-bold text-xs shrink-0 font-industrial ${
                      isSelected
                        ? "bg-[#da291c] text-white"
                        : "bg-white/10 text-slate-300"
                    }`}
                  >
                    {opt.key}
                  </span>
                  <span className="text-sm font-medium leading-normal pt-0.5">{opt.text}</span>
                </button>
              );
            })}
          </div>

          {/* Prompt specific feedback message after answer */}
          {answerFeedback && (
            <div
              role="status"
              aria-live="polite"
              className={`p-4 rounded-xl border text-sm animate-fadeIn space-y-2 ${
                answerFeedback.isCorrect
                  ? "bg-emerald-950/50 border-emerald-500/50 text-emerald-200"
                  : "bg-red-950/50 border-red-500/50 text-red-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-black font-industrial text-base uppercase">
                  {answerFeedback.isCorrect ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      <span>CORRETO! +{answerFeedback.earnedPoints} PONTOS</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5 text-red-400" />
                      <span>INCORRETO! +0 PONTOS</span>
                    </>
                  )}
                </div>
              </div>

              {answerFeedback.explanation && (
                <p className="text-xs text-slate-300 leading-relaxed border-t border-white/10 pt-2">
                  <strong>Justificativa Técnica:</strong> {answerFeedback.explanation}
                </p>
              )}

              <div className="pt-2 flex justify-end">
                <Button
                  onClick={handleNextQuestion}
                  className="bg-white text-black hover:bg-slate-200 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5"
                >
                  {currentIndex + 1 < questions.length ? "Próxima Pergunta" : "Ver Resultado Final"}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {isPaused && !isFinished && (
        <div role="dialog" aria-modal="true" aria-label="Quiz pausado" className="fixed inset-0 z-40 flex items-center justify-center bg-black/85 p-4">
          <div className="max-w-sm rounded-2xl border border-white/20 bg-[#141822] p-6 text-center shadow-2xl">
            <Pause className="mx-auto h-9 w-9 text-amber-300" aria-hidden="true" />
            <h3 className="mt-3 text-xl font-black text-white">Quiz pausado</h3>
            <p className="mt-2 text-sm text-slate-300">O cronômetro está parado. Continue quando estiver pronto.</p>
            <Button autoFocus type="button" onClick={() => setIsPaused(false)} className="mt-5 min-h-11 w-full bg-[#da291c] text-white"><Play className="mr-2 h-4 w-4" aria-hidden="true" /> Continuar</Button>
          </div>
        </div>
      )}

      {/* Final Results Modal */}
      <QuizFinalResultModal
        open={isFinished}
        onOpenChange={setIsFinished}
        playerName={participant?.name || "Colaborador"}
        playerWwid={participant?.wwid || "WWID"}
        gameTitle={gameType === "quiz_seguranca" ? "Quiz de Segurança" : "Quiz de Ergonomia"}
        score={totalScore}
        maxScore={maxPossibleScore}
        correctCount={correctCount}
        wrongCount={wrongCount}
        totalTimeSeconds={Math.round((Date.now() - gameStartTime) / 1000)}
        difficulty={difficulty}
        currentRank={finalSubmitData?.rank || 1}
        isNewBest={finalSubmitData?.isNewBest}
        onPlayAgain={resetGame}
        onOtherChallenge={onBackToGames}
      />
    </div>
  );
};
