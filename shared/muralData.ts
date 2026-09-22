export interface MuralPrompt {
  key: string;
  question: string;
  lead: string;
  placeholder: string;
}

export const MURAL_PROMPTS: MuralPrompt[] = [
  {
    key: "eu_me_cuido",
    question: "Eu me cuido porque...",
    lead: "Por quem ou pelo que você escolhe trabalhar com atenção máxima?",
    placeholder: "Ex.: Eu me cuido porque quero ver meus filhos crescerem e estarem sempre perto de mim.",
  },
  {
    key: "voltar_para_casa",
    question: "Quero voltar para casa para...",
    lead: "Qual é o momento do seu dia que faz todo cuidado valer a pena?",
    placeholder: "Ex.: Quero voltar para casa para jantar com minha família e abraçar quem me ama.",
  },
  {
    key: "maior_motivacao",
    question: "Minha maior motivação é...",
    lead: "O que te dá forças para nunca abrir mão de um procedimento seguro?",
    placeholder: "Ex.: Minha maior motivação é construir um futuro tranquilo com saúde e integridade.",
  },
  {
    key: "mensagem_especial",
    question: "Deixo esta mensagem para...",
    lead: "Uma homenagem sincera para quem espera pelo seu retorno no fim do turno.",
    placeholder: "Ex.: Deixo esta mensagem para meus pais: cada cuidado que tomo aqui é por vocês.",
  },
  {
    key: "significado_seguranca",
    question: "Segurança, para mim, significa...",
    lead: "Como você resume a atitude de proteção no seu posto de trabalho?",
    placeholder: "Ex.: Segurança significa respeito pela minha vida e pela vida de quem trabalha ao meu lado.",
  },
  {
    key: "escolho_voltar_seguro",
    question: "Eu escolho voltar seguro porque...",
    lead: "Qual é o seu compromisso inegociável ao iniciar qualquer atividade?",
    placeholder: "Ex.: Escolho voltar seguro porque a produção termina, mas a minha vida e minha família continuam.",
  },
];

export interface InitialSeedMuralMessage {
  promptKey: string;
  promptText: string;
  message: string;
  publicName: string;
  isAnonymous: boolean;
  status: "aprovada";
  isFeatured: boolean;
}

export const INITIAL_APPROVED_MURAL_MESSAGES: InitialSeedMuralMessage[] = [
  {
    promptKey: "eu_me_cuido",
    promptText: "Eu me cuido porque...",
    message: "Eu me cuido porque quero voltar para casa e continuar construindo meus sonhos ao lado de quem amo.",
    publicName: "Carlos Eduardo (CDBS)",
    isAnonymous: false,
    status: "aprovada",
    isFeatured: true,
  },
  {
    promptKey: "voltar_para_casa",
    promptText: "Quero voltar para casa para...",
    message: "Quero voltar para casa para ouvir as histórias do meu filho antes de dormir. Segurança é o maior presente que dou a ele.",
    publicName: "Juliana Santos",
    isAnonymous: false,
    status: "aprovada",
    isFeatured: false,
  },
  {
    promptKey: "significado_seguranca",
    promptText: "Segurança, para mim, significa...",
    message: "Segurança é não aceitar o desvio. Se vejo um risco, eu paro, aviso e cuido do meu colega como gostaria que cuidassem de mim.",
    publicName: "Operador de Montagem",
    isAnonymous: true,
    status: "aprovada",
    isFeatured: false,
  },
  {
    promptKey: "maior_motivacao",
    promptText: "Minha maior motivação é...",
    message: "Minha maior motivação são os momentos simples de paz no fim do dia. Nenhum prazo vale uma lesão.",
    publicName: "Marcos Vinicius",
    isAnonymous: false,
    status: "aprovada",
    isFeatured: false,
  },
  {
    promptKey: "mensagem_especial",
    promptText: "Deixo esta mensagem para...",
    message: "Para minha mãe: entro na fábrica sabendo do que aprendi com você e saio inteiro todos os dias para te abraçar.",
    publicName: "Turma Formare",
    isAnonymous: false,
    status: "aprovada",
    isFeatured: false,
  },
  {
    promptKey: "escolho_voltar_seguro",
    promptText: "Eu escolho voltar seguro porque...",
    message: "A máquina pode ser consertada amanhã, o produto pode ser refeito. A nossa saúde e a nossa vida são únicas.",
    publicName: "Equipe EHS",
    isAnonymous: true,
    status: "aprovada",
    isFeatured: false,
  },
];

/**
 * Filtro automático inicial para auxiliar a moderação e sinalizar suspeitas de dados pessoais ou conteúdo inadequado.
 */
export function analyzeMuralSafety(message: string, publicName?: string | null): { flagged: boolean; reasons: string[] } {
  const reasons: string[] = [];
  const text = `${message} ${publicName || ""}`.toLowerCase();

  // Detecção de telefones
  if (/(?:\+?55\s?)?(?:\(?\d{2}\)?\s?)?(?:9\s?\d{4}[-\s]?\d{4}|\d{4}[-\s]?\d{4})/g.test(text)) {
    reasons.push("Possível número de telefone ou contato pessoal");
  }

  // Detecção de e-mails
  if (/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(text)) {
    reasons.push("Contém endereço de e-mail");
  }

  // Detecção de links
  if (/https?:\/\/|www\.[a-z0-9.-]+\.[a-z]{2,}/i.test(text)) {
    reasons.push("Contém link externo");
  }

  // Detecção de documentos ou chapas expostas
  if (/\b(?:\d{3}\.?\d{3}\.?\d{3}-?\d{2}|\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2})\b/.test(text)) {
    reasons.push("Possível documento de identificação (CPF/CNPJ)");
  }

  // Palavras sensíveis de ofensa ou desvio grave
  const offensivePattern = /\b(idiota|burro|merda|lixo|puta|caralho|desgraça|foda|fdp|porra)\b/i;
  if (offensivePattern.test(text)) {
    reasons.push("Linguagem inadequada ou termos ofensivos");
  }

  return {
    flagged: reasons.length > 0,
    reasons,
  };
}
