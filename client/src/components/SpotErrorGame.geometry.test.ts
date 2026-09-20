import { describe, expect, it } from "vitest";
import { isPointInHazard, type Hazard } from "./SpotErrorGame";

const base = (overrides: Partial<Hazard>): Hazard => ({
  id: "test",
  name: "Risco de teste",
  desc: "Descrição",
  hint: null,
  category: "Segurança",
  x: 50,
  y: 50,
  width: 10,
  height: 10,
  tolerance: 1,
  shape: "retangulo",
  curated: true,
  ...overrides,
});

describe("geometria dos hotspots do Ache o Erro", () => {
  it("aceita o centro e rejeita o fundo em um retângulo preciso", () => {
    const hazard = base({ x: 30, y: 40, width: 8, height: 6, tolerance: 1 });
    expect(isPointInHazard(30, 40, hazard)).toBe(true);
    expect(isPointInHazard(34.3, 40, hazard)).toBe(false);
    expect(isPointInHazard(50, 50, hazard)).toBe(false);
  });

  it("trata círculo/elipse com largura e altura proporcionais", () => {
    const hazard = base({ shape: "circulo", x: 60, y: 30, width: 12, height: 6, tolerance: 1 });
    expect(isPointInHazard(60, 30, hazard)).toBe(true);
    expect(isPointInHazard(65, 30, hazard)).toBe(true);
    expect(isPointInHazard(67, 30, hazard)).toBe(false);
    expect(isPointInHazard(60, 34, hazard)).toBe(false);
  });

  it("aceita pontos internos e bordas de um polígono, mas não o vizinho", () => {
    const hazard = base({
      shape: "poligono",
      x: 50,
      y: 50,
      width: 20,
      height: 20,
      tolerance: 1,
      points: [
        { x: 40, y: 45 },
        { x: 60, y: 45 },
        { x: 55, y: 58 },
        { x: 45, y: 58 },
      ],
    });
    expect(isPointInHazard(50, 50, hazard)).toBe(true);
    expect(isPointInHazard(50, 45.05, hazard)).toBe(true);
    expect(isPointInHazard(50, 60, hazard)).toBe(false);
    expect(isPointInHazard(70, 70, hazard)).toBe(false);
  });

  it("não cria um raio fixo grande em hotspots pequenos", () => {
    const hazard = base({ x: 20, y: 20, width: 1, height: 1, tolerance: 2 });
    expect(isPointInHazard(20, 20, hazard)).toBe(true);
    expect(isPointInHazard(21, 20, hazard)).toBe(false);
  });
});
