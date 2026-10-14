# Publicação da SIPAT no Cloudflare Workers

A adaptação foi preparada para manter a **mesma interface, páginas, jogos, ranking, mural, administração e assets**. O servidor Express continua disponível como fallback; o novo entrypoint do Worker fica em `server/worker.ts`.

## O que foi adicionado

- `server/worker.ts`: entrypoint Fetch do Cloudflare.
- `server/_core/workerContext.ts`: adaptação do contexto tRPC e cookies para Fetch/Workers.
- `wrangler.jsonc`: configuração do Worker, SPA assets e Hyperdrive.
- `server/db.ts`: suporte a binding Hyperdrive, preservando `DATABASE_URL` no runtime Node.
- `server/_core/env.ts`: carregamento de secrets por bindings do Worker.
- Proxy `/manus-storage/*` e callback `/api/oauth/callback` no Worker.
- Scripts `build:worker`, `dev:worker` e `deploy:worker`.

## Pré-requisitos

1. Uma conta Cloudflare.
2. O banco MySQL/TiDB atual acessível pela Cloudflare Hyperdrive.
3. O domínio registrado e adicionado à Cloudflare, caso queira usar `sipatcummins.com`.
4. Os valores secretos atuais do projeto, configurados no Cloudflare como secrets. Nunca coloque esses valores no Git.

## Publicação

No terminal, dentro do projeto:

```bash
pnpm install
npx wrangler login
```

Crie a configuração Hyperdrive apontando para o MySQL atual. O comando pede a connection string do banco; não publique essa string em mensagens ou arquivos:

```bash
npx wrangler hyperdrive create sipat-cummins-db --connection-string="mysql://USUARIO:SENHA@HOST:3306/BANCO"
```

Copie o `id` retornado e substitua apenas `REPLACE_WITH_HYPERDRIVE_ID` em `wrangler.jsonc`.

Configure os secrets no Worker:

```bash
npx wrangler secret put JWT_SECRET
npx wrangler secret put ADMIN_ACCESS_KEY
npx wrangler secret put VITE_APP_ID
npx wrangler secret put OAUTH_SERVER_URL
npx wrangler secret put OWNER_OPEN_ID
npx wrangler secret put BUILT_IN_FORGE_API_URL
npx wrangler secret put BUILT_IN_FORGE_API_KEY
```

O `DATABASE_URL` não é necessário quando o binding `HYPERDRIVE` está configurado. Se for usado sem Hyperdrive em um ambiente de teste, pode ser definido como secret, mas Hyperdrive é o caminho recomendado para o evento.

Valide antes de publicar:

```bash
pnpm check
pnpm test
pnpm build:worker
```

Publique:

```bash
pnpm deploy:worker
```

Depois, no painel Cloudflare, abra **Workers & Pages → sipat-cummins-2026 → Settings → Domains & Routes** e adicione o domínio personalizado. Se a zona já estiver na Cloudflare, o apontamento é feito pela própria Cloudflare.

## Observações importantes

- O `wrangler deploy --dry-run` já foi validado localmente, com o frontend React compilado e os bindings reconhecidos.
- O dry-run usa um placeholder de Hyperdrive de propósito. O deploy real só deve ocorrer depois que você substituir o ID verdadeiro.
- A aparência não foi redesenhada nesta adaptação. O objetivo foi trocar a camada de hospedagem/runtime.
- O storage atual da Manus continua sendo usado pelo caminho `/manus-storage/`; para uma migração completa de arquivos para R2, seria necessária uma etapa separada.
- O Express atual não foi removido. Isso permite voltar ao endereço atual se o Worker ainda precisar de ajustes de ambiente.
- Antes do evento, faça um teste real de login, identificação, quatro jogos, ranking, mural, upload administrativo e logout no domínio final.
