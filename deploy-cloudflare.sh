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

# Migra as imagens locais para o bucket R2.
npx wrangler r2 object put sipat-cummins-assets/cummins-osasco-linha-producao.jpg --file cloudflare/migration-assets/cummins-osasco-linha-producao.jpg --content-type image/jpeg
npx wrangler r2 object put sipat-cummins-assets/cummins-meritor-osasco-montagem.jpg --file cloudflare/migration-assets/cummins-meritor-osasco-montagem.jpg --content-type image/jpeg
npx wrangler r2 object put sipat-cummins-assets/eixo-ms18x-cummins-studio.jpg --file cloudflare/migration-assets/eixo-ms18x-cummins-studio.jpg --content-type image/jpeg
npx wrangler r2 object put sipat-cummins-assets/equipe-cummins-sipat-osasco.jpg --file cloudflare/migration-assets/equipe-cummins-sipat-osasco.jpg --content-type image/jpeg

# Troca as URLs da Manus pelas rotas R2 e publica novamente.
node scripts/switch-to-r2-assets.mjs
pnpm build:worker
npx wrangler deploy

echo "Deploy concluído. Teste o endereço informado pelo Wrangler."
