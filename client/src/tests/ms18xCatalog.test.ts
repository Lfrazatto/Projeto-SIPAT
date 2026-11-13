import { describe, expect, it } from "vitest";
import { MS18X_CATALOG, getMS18XComponentById } from "../data/ms18xCatalog";

describe("Reconstrução MS-18X HD", () => {
  it("mantém 57 identificadores únicos e numeração sequencial", () => {
    expect(MS18X_CATALOG).toHaveLength(57);
    expect(new Set(MS18X_CATALOG.map((component) => component.id)).size).toBe(57);
    MS18X_CATALOG.forEach((component, index) => expect(component.number).toBe(index + 1));
  });
  it("mantém coroa e caixa em um único conjunto", () => {
    const welded = getMS18XComponentById("welded_crown_carrier");
    expect(welded?.namePt).toContain("soldado");
    expect(getMS18XComponentById("ring_gear")).toBe(welded);
    expect(MS18X_CATALOG.some((component) => component.id === "ring_gear")).toBe(false);
  });
  it("inclui o terceiro rolamento e identifica painéis virtuais", () => {
    expect(getMS18XComponentById("pinion_pilot_bearing")?.category).toBe("internal");
    const panels = MS18X_CATALOG.filter((component) => component.id.includes("inspection_panel"));
    expect(panels).toHaveLength(3);
    panels.forEach((panel) => expect(panel.function).toContain("virtual"));
  });
  it("mantém referências de montagem válidas e sem autodependência", () => {
    const ids = new Set(MS18X_CATALOG.map((component) => component.id));
    MS18X_CATALOG.forEach((component) => {
      expect(component.dependencies).not.toContain(component.id);
      component.dependencies.forEach((id) => expect(ids.has(id)).toBe(true));
      if (component.parentId) expect(ids.has(component.parentId)).toBe(true);
    });
  });
});
