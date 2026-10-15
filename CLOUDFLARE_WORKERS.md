# Publicação da SIPAT no Cloudflare Workers

A adaptação foi preparada para manter a **mesma interface, páginas, jogos, ranking, mural, administração e assets**. O Worker já serve o frontend e possui um banco D1 criado para a migração; o backend atual continua disponível como fallback até a troca das funções de persistência.

## O que foi adicionado

- `server/worker.ts`: entrypoint Fetch do Cloudflare.
- `server/_core/workerContext.ts`: adaptação do contexto tRPC e cookies para Fetch/Workers.
- `wrangler.jsonc`: configuração do Worker, SPA assets e binding D1 `sipat-cummins-db`.
- `server/db.ts`: suporte ao runtime Node e preparação para a camada D1, preservando `DATABASE_URL` no runtime atual.
- `server/_core/env.ts`: carregamento de secrets por bindings do Worker.
- Proxy `/manus-storage/*` e callback `/api/oauth/callback` no Worker durante a transição.
- Scripts `build:worker`, `dev:worker` e `deploy:worker`.

## Estado atual da migração

- Banco D1 criado: `sipat-cummins-db`.
- UUID D1: `63248b2a-1a3d-4c53-b122-872de924fd85`.
- Schema SQLite equivalente aplicado em `cloudflare/d1-schema.sql`.
- O Worker ainda encaminha `/api/*` e `/manus-storage/*` para `BACKEND_ORIGIN` até a camada D1/R2 ser concluída.
- O R2 ainda precisa ser habilitado na conta Cloudflare para migrar as imagens.

## Pré-requisitos

1. Uma conta Cloudflare.
2. Para a migração completa: R2 habilitado e secrets configurados no Worker. O Hyperdrive não é necessário para o banco D1 novo.
3. O domínio registrado e adicionado à Cloudflare, caso queira usar `sipatcummins.com`.
4. Os valores secretos atuais do projeto, configurados no Cloudflare como secrets. Nunca coloque esses valores no Git.

## Publicação

No terminal, dentro do projeto:

```bash
pnpm install
npx wrangler login
```

### Alternativa de transição: Hyperdrive

Se quiser manter o banco MySQL/TiDB durante a transição, crie uma configuração Hyperdrive apontando para o MySQL atual. O comando pede a connection string do banco; não publique essa string em mensagens ou arquivos:

```bash
npx wrangler hyperdrive create sipat-cummins-db --connection-string="mysql://USUARIO:SENHA@HOST:3306/BANCO"
```

Copie o `id` retornado e adicione o binding `HYPERDRIVE` em `wrangler.jsonc`, usando o UUID real retornado pela Cloudflare. O arquivo foi deixado sem um placeholder propositalmente, porque a Cloudflare rejeita qualquer texto que não seja um UUID válido.

Exemplo do bloco que deve ser acrescentado somente depois de obter o ID real:

```jsonc
"hyperdrive": [
  {
    "binding": "HYPERDRIVE",
    "id": "UUID_REAL_DO_HYPERDRIVE"
  }
]
```

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
- O storage atual da Manus continua sendo usado pelo caminho `/manus-storage/` durante a transição; a migração completa exige R2 e atualização das URLs no catálogo.
- O Express atual não foi removido. Isso permite voltar ao endereço atual se o Worker ainda precisar de ajustes de ambiente.
- Antes do evento, faça um teste real de login, identificação, quatro jogos, ranking, mural, upload administrativo e logout no domínio final.
