import { readFile, writeFile } from "node:fs/promises";

const file = new URL("../client/src/data/realPhotos.ts", import.meta.url);
let source = await readFile(file, "utf8");

const replacements = {
  "/manus-storage/cummins-osasco-linha-producao_72e7e8d9.jpg": "/assets/cummins-osasco-linha-producao.jpg",
  "/manus-storage/cummins-meritor-osasco-montagem_642e64a0.jpg": "/assets/cummins-meritor-osasco-montagem.jpg",
  "/manus-storage/eixo-ms18x-cummins-studio_7abad853.jpg": "/assets/eixo-ms18x-cummins-studio.jpg",
  "/manus-storage/equipe-cummins-sipat-osasco_2647a14f.jpg": "/assets/equipe-cummins-sipat-osasco.jpg",
};

for (const [from, to] of Object.entries(replacements)) {
  source = source.replaceAll(from, to);
}

await writeFile(file, source);
console.log("URLs das quatro imagens atualizadas para /assets/ do R2.");
