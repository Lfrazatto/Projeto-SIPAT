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
    placeholder: "Ex.: Eu me cuido porque quero voltar para casa e estar perto de quem amo.",
  },
  {
    key: "voltar_para_casa",
    question: "Quero voltar para casa para...",
    lead: "Qual é o momento do seu dia que faz todo cuidado valer a pena?",
    placeholder: "Ex.: Quero voltar para casa para jantar com minha família no fim do dia.",
  },
  {
    key: "maior_motivacao",
    question: "Minha maior motivação é...",
    lead: "O que te dá forças para nunca abrir mão de um procedimento seguro?",
    placeholder: "Ex.: Minha maior motivação é cuidar da minha saúde e construir meu futuro.",
  },
  {
    key: "mensagem_especial",
    question: "Deixo esta mensagem para...",
    lead: "Uma homenagem sincera para quem espera pelo seu retorno no fim do turno.",
    placeholder: "Ex.: Deixo esta mensagem para alguém especial: cada cuidado importa.",
  },
  {
    key: "significado_seguranca",
    question: "Segurança, para mim, significa...",
    lead: "Como você resume a atitude de proteção no seu posto de trabalho?",
    placeholder: "Ex.: Segurança significa cuidar de mim e de quem trabalha ao meu lado.",
  },
  {
    key: "escolho_voltar_seguro",
    question: "Eu escolho voltar seguro porque...",
    lead: "Qual é o seu compromisso inegociável ao iniciar qualquer atividade?",
    placeholder: "Ex.: Eu escolho voltar seguro porque a vida vem antes da pressa.",
  },
];

/**
 * Exemplos exibidos apenas como inspiração no formulário.
 * Eles não são inseridos no banco e nunca aparecem como mensagens públicas.
 */
export const MURAL_WRITING_EXAMPLES = [
  "Eu me cuido porque quero voltar para casa com saúde e estar perto de quem amo.",
  "Segurança, para mim, significa parar, comunicar e escolher o jeito certo de fazer.",
  "Quero voltar para casa para aproveitar os momentos simples ao lado da minha família.",
  "Eu escolho voltar seguro porque cada pessoa tem uma história e alguém esperando por ela.",
] as const;

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
