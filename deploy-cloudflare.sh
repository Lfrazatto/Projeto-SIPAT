#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

command -v node >/dev/null || { echo "Node.js não encontrado."; exit 1; }
command -v npx >/dev/null || { echo "npm/npx não encontrado."; exit 1; }
command -v pnpm >/dev/null || { echo "pnpm não encontrado. Instale com: npm install -g pnpm"; exit 1; }

npx wrangler whoami
pnpm install

# Primeiro deploy: garante que o Worker e os bindings D1/R2 estejam publicados.
pnpm build:worker
npx wrangler deploy

# Aplica as migrações no banco D1 remoto.
npx wrangler d1 migrations apply sipat-cummins-db --remote

# Migra todos os assets locais para o bucket R2 usando exatamente os nomes
# referenciados pelo código (/assets/<nome>). O lote inclui fotos, logo e
# imagens dos cinco cenários do jogo Ache o Erro.
ASSET_DIR="cloudflare/migration-assets/all"
find "$ASSET_DIR" -maxdepth 1 -type f -print0 | while IFS= read -r -d '' asset; do
  key="${asset#"$ASSET_DIR/"}"
  case "$key" in
    *.svg) content_type="image/svg+xml" ;;
    *.jpg|*.jpeg) content_type="image/jpeg" ;;
    *.png) content_type="image/png" ;;
    *.webp) content_type="image/webp" ;;
    *.glb) content_type="model/gltf-binary" ;;
    *.json) content_type="application/json" ;;
    *) content_type="application/octet-stream" ;;
  esac
  echo "Uploading R2 asset: $key"
  npx wrangler r2 object put "sipat-cummins-assets/$key" --file "$asset" --content-type "$content_type"
done

# Public URLs already point to /assets/, so this deploy only needs to publish
# the final Worker after the R2 upload.
pnpm build:worker
npx wrangler deploy

echo "Deploy concluído. Teste o endereço informado pelo Wrangler."
