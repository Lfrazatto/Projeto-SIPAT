import { MS120_CATALOG, type ComponentDefinition } from "./ms120Catalog";

const canonicalId = (id: string) =>
  id === "ring_gear" || id === "differential_carrier" ? "welded_crown_carrier" : id;

// Catálogo de reconstrução didática; não é uma lista oficial de peças de reposição.
export const MS18X_CATALOG: ComponentDefinition[] = MS120_CATALOG
  .filter((component) => component.id !== "ring_gear")
  .map((component) => ({
    ...component,
    id: canonicalId(component.id),
    groupId: canonicalId(component.groupId),
    parentId: component.parentId ? canonicalId(component.parentId) : undefined,
    dependencies: Array.from(new Set(component.dependencies.map(canonicalId)))
      .filter((id) => id !== canonicalId(component.id)),
    technicalNote: "Representação visual aproximada. Dimensões, materiais e configuração reais devem ser confirmados na documentação homologada do fabricante.",
    ...(component.id === "differential_carrier" ? {
      namePt: "Conjunto soldado de coroa e caixa dos satélites",
      nameEn: "Welded Crown Gear and Differential Case",
      function: "Recebe o torque do pinhão e suporta as engrenagens do diferencial. Coroa e caixa permanecem unidas na vista explodida.",
      technicalNote: "O manual público 18X/18X HD descreve coroa e caixa dos satélites soldadas. A geometria deste modelo é aproximada, sem escala de fabricação validada.",
      dependencies: ["main_axle_housing"],
    } : {}),
  }));

function extra(id: string, name: string, category: ComponentDefinition["category"], axis: ComponentDefinition["removalAxis"], distance: number, stage: number): ComponentDefinition {
  return {
    id, groupId: id, number: 0, namePt: name, category,
    function: id.includes("panel") ? "Painel virtual de inspeção para mostrar o interior; não representa uma peça removível real do fabricante." : "Componente representado para leitura técnica do conjunto.",
    location: "Conjunto do eixo", material: "steel",
    optional: category === "optional",
    visibleInMounted: true, visibleInExploded: true,
    removalAxis: axis, removalSign: id.startsWith("left_") ? -1 : 1,
    explodeDistance: distance, explodeStage: stage, dependencies: [],
    technicalNote: "Modelo didático em unidades relativas; não usar para fabricação, dimensionamento ou reparo.",
  };
}

MS18X_CATALOG.push(
  { ...extra("pinion_pilot_bearing", "Rolamento piloto cilíndrico do pinhão", "internal", "z", 1.2, 6),
    function: "Terceiro apoio do pinhão, complementando os dois rolamentos cônicos.",
    technicalNote: "Arquitetura confirmada no manual público 18X/18X HD; dimensões do modelo são aproximadas." },
  extra("inspection_panel", "Painel virtual de inspeção da carcaça", "external", "z", 2.1, 4),
  extra("left_drum_inspection_panel", "Painel virtual do tambor esquerdo", "optional", "x", 3.2, 2),
  extra("right_drum_inspection_panel", "Painel virtual do tambor direito", "optional", "x", 3.2, 2),
  extra("identification_plate_blank", "Plaqueta de identificação sem número fictício", "external", "y", 0.8, 1),
);
MS18X_CATALOG.forEach((component, index) => { component.number = index + 1; });

export function getMS18XComponentById(id: string) {
  return MS18X_CATALOG.find((component) => component.id === canonicalId(id));
}
