import { describe, it, expect } from "vitest";
import { MS120_CATALOG, getComponentById } from "../client/src/data/ms120Catalog";

describe("MS-120 Catalog & Assembly Rules", () => {
  it("deve conter todos os componentes com IDs únicos e números estáveis", () => {
    const ids = new Set<string>();
    const numbers = new Set<number>();

    for (const comp of MS120_CATALOG) {
      expect(ids.has(comp.id)).toBe(false);
      expect(numbers.has(comp.number)).toBe(false);
      ids.add(comp.id);
      numbers.add(comp.number);
      expect(comp.namePt.length).toBeGreaterThan(3);
      expect(comp.function.length).toBeGreaterThan(10);
      expect(comp.location.length).toBeGreaterThan(3);
      expect(comp.technicalNote.length).toBeGreaterThan(10);
    }

    expect(MS120_CATALOG.length).toBeGreaterThanOrEqual(30);
  });

  it("deve ter direções de remoção e estágios de explosão válidos", () => {
    const validAxes = ["x", "y", "z"];
    for (const comp of MS120_CATALOG) {
      expect(validAxes).toContain(comp.removalAxis);
      expect([1, -1]).toContain(comp.removalSign);
      expect(comp.explodeStage).toBeGreaterThanOrEqual(0);
      expect(comp.explodeStage).toBeLessThanOrEqual(6);
      expect(comp.explodeDistance).toBeGreaterThanOrEqual(0);
    }
  });

  it("todas as dependências devem referenciar componentes válidos existentes", () => {
    for (const comp of MS120_CATALOG) {
      for (const depId of comp.dependencies) {
        const found = getComponentById(depId);
        expect(found).toBeDefined();
      }
    }
  });

  it("calcula a posição explodida absoluta sem acúmulo relativo", () => {
    const comp = getComponentById("housing_cover")!;
    const mountedPos = { x: 0, y: 0, z: -0.6 };
    
    const computePos = (depth: number) => {
      const stageOffset = comp.explodeStage <= 4 ? depth : Math.max(0, depth - 0.4);
      return {
        x: mountedPos.x + (comp.removalAxis === "x" ? comp.removalSign * comp.explodeDistance * stageOffset : 0),
        y: mountedPos.y + (comp.removalAxis === "y" ? comp.removalSign * comp.explodeDistance * stageOffset : 0),
        z: mountedPos.z + (comp.removalAxis === "z" ? comp.removalSign * comp.explodeDistance * stageOffset : 0),
      };
    };

    const p0 = computePos(0);
    expect(p0).toEqual(mountedPos);

    const p1 = computePos(1.0);
    expect(p1.z).toBeCloseTo(-0.6 - 2.2, 2);

    const pMid = computePos(0.5);
    expect(pMid.z).toBeLessThan(p0.z);
    expect(pMid.z).toBeGreaterThan(p1.z);
  });

  it("separa lados esquerdo e direito simetricamente no eixo X", () => {
    const leftHub = getComponentById("left_wheel_hub")!;
    const rightHub = getComponentById("right_wheel_hub")!;

    expect(leftHub.removalAxis).toBe("x");
    expect(rightHub.removalAxis).toBe("x");
    expect(leftHub.removalSign).toBe(-1);
    expect(rightHub.removalSign).toBe(1);
  });

  it("pinhão de ataque e nariz utilizam seu próprio eixo de remoção frontal (Z+)", () => {
    const pinion = getComponentById("drive_pinion")!;
    const nose = getComponentById("pinion_nose_housing")!;
    const flange = getComponentById("input_flange")!;

    expect(pinion.removalAxis).toBe("z");
    expect(pinion.removalSign).toBe(1);
    expect(nose.removalAxis).toBe("z");
    expect(nose.removalSign).toBe(1);
    expect(flange.removalAxis).toBe("z");
    expect(flange.removalSign).toBe(1);
  });
});
