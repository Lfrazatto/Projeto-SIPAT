import React, { createContext, useContext, useState } from "react";

export type ParticipantType = "terceiro" | "cummins" | "visitante";

export interface ParticipantData {
  id: number;
  name: string;
  chapa: string;
  wwid: string;
  participantType: ParticipantType;
  totalScore?: number;
  completedGamesCount?: number;
  bestSecurityScore?: number;
  bestEnvironmentScore?: number;
  bestSpotErrorScore?: number;
  bestOrganizeScore?: number;
  totalCorrectAnswers?: number;
  totalWrongAnswers?: number;
  highestDifficulty?: string;
}

interface ParticipantContextType {
  participant: ParticipantData | null;
  setParticipant: (participant: ParticipantData | null) => void;
  isIdentified: boolean;
  logout: () => void;
  logoutParticipant: () => void;
}

const ParticipantContext = createContext<ParticipantContextType | null>(null);
const SESSION_KEY = "cummins_sipat_participant_session";
const LEGACY_SESSION_KEY = "cummins_sipatma_participant_session";
const LEGACY_KEYS = ["cummins_sipatma_player", "cummins_sipat_participant_session"];

function readParticipant(): ParticipantData | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = window.sessionStorage.getItem(SESSION_KEY) ?? window.sessionStorage.getItem(LEGACY_SESSION_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored) as ParticipantData;
    if (!parsed?.name || !parsed?.chapa || !parsed?.wwid) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function ParticipantProvider({ children }: { children: React.ReactNode }) {
  const [participant, setParticipantState] = useState<ParticipantData | null>(readParticipant);

  const setParticipant = (next: ParticipantData | null) => {
    setParticipantState(next);
    try {
      if (next) window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(next));
      else window.sessionStorage.removeItem(SESSION_KEY);
      LEGACY_KEYS.forEach((key) => window.localStorage.removeItem(key));
    } catch {
      // A sessão continua ativa em memória quando o armazenamento está indisponível.
    }
  };

  const logout = () => setParticipant(null);

  return (
    <ParticipantContext.Provider
      value={{
        participant,
        setParticipant,
        isIdentified: Boolean(participant?.name && participant?.chapa && participant?.wwid),
        logout,
        logoutParticipant: logout,
      }}
    >
      {children}
    </ParticipantContext.Provider>
  );
}

export function useParticipant() {
  const context = useContext(ParticipantContext);
  if (!context) throw new Error("useParticipant deve ser usado dentro de ParticipantProvider");
  return context;
}
