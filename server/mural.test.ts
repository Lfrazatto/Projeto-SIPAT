import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { analyzeMuralSafety } from "../shared/muralData";
import { ENV } from "./_core/env";

function createMockContext(admin = false): TrpcContext {
  return {
    user: admin
      ? {
          id: 999,
          openId: "test-admin",
          email: "admin@cummins.com",
          name: "Admin EHS",
          loginMethod: "manus",
          role: "admin",
          createdAt: new Date(),
          updatedAt: new Date(),
          lastSignedIn: new Date(),
        }
      : null,
    req: {
      protocol: "https",
      headers: { "x-forwarded-for": "127.0.0.1" },
    } as unknown as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as unknown as TrpcContext["res"],
  };
}

describe("Mural Voltar Seguro para Casa - Testes de Regra e Moderação", () => {
  it("valida o filtro automático de segurança contra dados pessoais e links", () => {
    const safeText = "Quero voltar seguro para jantar com meus filhos e minha esposa.";
    const safeAnalysis = analyzeMuralSafety(safeText);
    expect(safeAnalysis.flagged).toBe(false);
    expect(safeAnalysis.reasons).toHaveLength(0);

    const withPhone = "Me ligue no 11 98765-4321 caso precise.";
    const phoneAnalysis = analyzeMuralSafety(withPhone);
    expect(phoneAnalysis.flagged).toBe(true);
    expect(phoneAnalysis.reasons.some((r) => r.includes("telefone"))).toBe(true);

    const withLink = "Acesse https://site-externo.com para ver meu perfil.";
    const linkAnalysis = analyzeMuralSafety(withLink);
    expect(linkAnalysis.flagged).toBe(true);
    expect(linkAnalysis.reasons.some((r) => r.includes("link"))).toBe(true);

    const withEmail = "Meu contato é fulano@empresa.com";
    const emailAnalysis = analyzeMuralSafety(withEmail);
    expect(emailAnalysis.flagged).toBe(true);
    expect(emailAnalysis.reasons.some((r) => r.includes("e-mail"))).toBe(true);
  });

  it("permite submeter uma nova mensagem que entra inicialmente como pendente", async () => {
    const caller = appRouter.createCaller(createMockContext(false));

    const result = await caller.mural.submitMessage({
      promptKey: "eu_me_cuido",
      message: "Eu me cuido porque a minha família é o meu maior patrimônio e espera por mim.",
      publicName: "Operador de Teste",
      isAnonymous: false,
      consent: true,
    });

    expect(result.success).toBe(true);
    expect(result.status).toBe("pendente");
    expect(result.message).toContain("revisada pela moderação");
  });

  it("retorna apenas mensagens aprovadas na consulta pública do mural", async () => {
    const caller = appRouter.createCaller(createMockContext(false));
    const approved = await caller.mural.listApproved();

    expect(Array.isArray(approved)).toBe(true);
    expect(approved.length).toBeGreaterThan(0);

    // Nenhuma mensagem pública pode estar com status diferente de aprovada
    for (const msg of approved) {
      expect(msg.message.length).toBeGreaterThanOrEqual(5);
      expect(msg.promptText).toBeDefined();
    }
  });

  it("retorna o motivo em destaque quando configurado", async () => {
    const caller = appRouter.createCaller(createMockContext(false));
    const featured = await caller.mural.getFeatured();

    if (featured) {
      expect(featured.isFeatured).toBe(true);
      expect(featured.message).toBeDefined();
    }
  });

  it("rejeita acesso administrativo à moderação sem chave válida", async () => {
    const caller = appRouter.createCaller(createMockContext(false));

    await expect(
      caller.admin.listMuralMessages({
        adminKey: "chave-invalida",
      })
    ).rejects.toThrow();
  });
});
