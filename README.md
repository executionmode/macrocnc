# Macro CNC: PWA para FANUC (v2)

App instalável (PWA), funciona offline:

- **Programas**: a biblioteca do operador. São 9 macros G65 (O16xx com o principal O00xx) e 9 parametrizados, cada um marcado como *Aprovado na máquina*, *Revisado, sem teste*, *Não testado* ou *Com problema*. Você toca no programa, troca as letras do G65 ou as variáveis #, e o app gera o programa, simula e entrega o arquivo `.txt` do principal e do sub. A aba **Treinamento** ensina Custom Macro B do zero, com as macros da biblioteca explicadas bloco a bloco, exercícios, teste rápido e o padrão da oficina.
- **Pedir programa**: você descreve a peça e o assistente (Claude) monta o programa no mesmo padrão. As regras e os programas da biblioteca vão junto como exemplo.
- **Editor**: cole ou abra qualquer programa, simule (o simulador executa Macro B de verdade: #, IF/GOTO, THEN, WHILE, G65, G52, G2/G3) e confira erros.
- **Meus**: programas salvos. Marque *testado na máquina* para o assistente usar o programa como exemplo também.

Para mudar a biblioteca que vem no app, edite `programs.js`.

---

## 1. Publicar o app (GitHub Pages, de graça)

1. Crie uma conta em github.com e um repositório novo, por exemplo `macro-cnc`.
2. Envie todos os arquivos desta pasta, **menos a pasta `proxy/`** (pelo site: *Add file → Upload files*).
3. Vá em *Settings → Pages → Branch: main / (root) → Save*.
4. Em 1 ou 2 minutos o app fica em `https://SEU-USUARIO.github.io/macro-cnc/`.

Para instalar o app no celular:

- **Android (Chrome)**: abra o link e toque em **Instalar** no topo do app, ou use o menu ⋮ → *Instalar app*.
- **iPhone (Safari)**: abra o link e toque em Compartilhar → *Adicionar à Tela de Início*.

> O PWA precisa de HTTPS. Netlify, Vercel e Cloudflare Pages também funcionam: basta arrastar a pasta.

## 2. Ligar o assistente para todo mundo (proxy com Cloudflare Workers)

A chave da API **nunca** pode ficar dentro do app, porque qualquer pessoa conseguiria copiá-la. Por isso o app chama um pequeno servidor seu (o proxy), e só esse servidor guarda a chave.

1. Crie uma chave em **console.anthropic.com** → *API Keys*. Coloque crédito e **defina um limite de gasto mensal** em *Limits*.
2. Crie uma conta gratuita em **dash.cloudflare.com** → *Workers & Pages → Create → Worker*.
3. Dê um nome (ex.: `macro-cnc-proxy`), clique em *Edit code*, apague o código de exemplo, cole o conteúdo de `proxy/worker.js` e clique em *Deploy*.
4. Em *Settings → Variables and Secrets*, adicione:
   - `ANTHROPIC_API_KEY` como **Secret**, com a sua chave `sk-ant-...`
   - `ALLOWED_ORIGINS` como texto, com `https://SEU-USUARIO.github.io`
5. Copie o endereço do worker (ex.: `https://macro-cnc-proxy.SEU-USUARIO.workers.dev`).
6. No arquivo `config.js` do app, coloque esse endereço em `proxyUrl` e envie o arquivo de novo para o GitHub.
7. **Mude a versão do cache** em `sw.js` (ex.: `macro-cnc-v2` → `macro-cnc-v3`) sempre que atualizar o app. Assim os celulares baixam a versão nova.

Pronto: quem instalar o app já usa o assistente sem configurar nada.

**Custos e proteção.** Cada mensagem é cobrada na sua conta da Anthropic. Para se proteger:

- mantenha o limite de gasto no console da Anthropic;
- no Cloudflare, crie uma regra de *Rate limiting* para o worker (ex.: 20 pedidos por minuto por IP);
- o `ALLOWED_ORIGINS` bloqueia outros sites, mas **não** impede chamadas feitas por fora do navegador, então o limite de gasto é a proteção principal;
- para cobrar dos usuários, o próximo passo é login + assinatura (ex.: Firebase Auth / Supabase + Stripe ou Mercado Pago), com o worker checando o login.

**Opção sem servidor.** Em ⚙ Configurações, cada usuário pode escolher *"Minha chave da API Anthropic"* e usar a própria chave, que fica só no aparelho dele.

## 3. Testar no computador

```
cd macro-cnc
python3 -m http.server 8080
```
Depois abra `http://localhost:8080`. O service worker funciona em localhost.

## 4. Adicionar programas aprovados à biblioteca

Cada programa é um item em `programs.js` com:

- `cat`: `macro` ou `param`;
- `status`: `aprovado`, `revisado`, `nao-testado` ou `problema`;
- `main`: o programa principal;
- `subs`: os subprogramas (só nas macros);
- `edit`: as variáveis # que o operador altera (só nos parametrizados).

Quem não quer editar o arquivo pode salvar o programa em **Meus** e marcar *testado na máquina*. Isso já vale para o assistente naquele aparelho.

Depois de mudar arquivos, troque `macro-cnc-v2` em `sw.js` (por exemplo, para `macro-cnc-v3`).

## Segurança

Os programas gerados são um ponto de partida. Antes de usinar:

- confira o código;
- simule no controle;
- rode em vazio (dry run) e bloco a bloco, com override baixo.

Nas macros, os subprogramas O9000–O9999 podem estar protegidos por parâmetro no controle. Faça backup dos parâmetros antes de qualquer alteração na máquina.
