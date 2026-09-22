export interface AchievementDefinition {
  key: string;
  title: string;
  description: string;
  icon: string;
  category: "jornada" | "precisao" | "tema" | "velocidade";
  target: number;
}

export const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  { key: "primeiro_desafio", title: "Primeiro Desafio", description: "Completou seu primeiro desafio.", icon: "trophy", category: "jornada", target: 1 },
  { key: "precisao", title: "Precisão", description: "Alcançou pelo menos 10 acertos em desafios.", icon: "target", category: "precisao", target: 10 },
  { key: "mestre_seguranca", title: "Mestre da Segurança", description: "Concluiu o Quiz de Segurança.", icon: "shield", category: "tema", target: 1 },
  { key: "especialista_lean", title: "Especialista Lean", description: "Concluiu o Quiz Lean Manufacturing.", icon: "factory", category: "tema", target: 1 },
  { key: "olho_de_aguia", title: "Olho de Águia", description: "Encontrou riscos no Ache o Erro.", icon: "eye", category: "tema", target: 1 },
  { key: "velocidade", title: "Velocidade", description: "Concluiu uma atividade em menos de 10 segundos.", icon: "zap", category: "velocidade", target: 1 },
  { key: "perfeito", title: "Perfeito", description: "Concluiu uma atividade sem erros.", icon: "sparkles", category: "precisao", target: 1 },
  { key: "jogador_completo", title: "Jogador Completo", description: "Concluiu os quatro desafios da SIPAT.", icon: "award", category: "jornada", target: 4 },
];
