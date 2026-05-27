# 🚗 LavaApp — Sistema de Gestão para Lava Jatos

App SaaS multitenant para gestão de lava jatos. Cada cliente tem seu próprio subdomínio, logo e dados isolados.

## Stack
- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Firebase** (Auth + Firestore + Storage)
- **Vercel** (hospedagem)

## Funcionalidades
- ✅ Autenticação por tenant (Firebase Auth)
- ✅ Dashboard com resumo do dia
- ✅ Ordens de Serviço (OS) com número sequencial
- ✅ Cadastro de Clientes + Veículos
- ✅ Cadastro de Serviços e Preços
- ✅ Controle de Estoque (Produtos)
- ✅ Custos Fixos mensais
- ✅ Fechamento do dia (com rateio de custos)
- ✅ Relatórios mensais
- ✅ Upload de logo por tenant
- ✅ Configurações do estabelecimento

## Estrutura Firestore

```
tenants/
  {tenantId}/
    slug, nome, logoUrl, telefone, endereco
    
    clientes/     → nome, telefone, cpf, email, veiculos[]
    servicos/     → nome, preco, duracaoMin, ativo
    produtos/     → nome, estoque, estoqueMinimo, precoCusto
    custos_fixos/ → descricao, valor, vencimentoDia
    atendimentos/ → clienteNome, itens[], total, status, pagamento
    fechamentos/  → data, totalLiquido, lucroEstimado
```

## Começando

### 1. Instalar dependências
```bash
npm install
```

### 2. Configurar Firebase
1. Crie um projeto em [console.firebase.google.com](https://console.firebase.google.com)
2. Ative **Authentication** (Email/Senha)
3. Ative **Firestore** (modo produção)
4. Ative **Storage**
5. Copie as credenciais para `.env.local`:

```bash
cp .env.local.example .env.local
# edite .env.local com suas credenciais
```

### 3. Regras Firestore (Security Rules)
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /tenants/{tenantId}/{document=**} {
      allow read, write: if request.auth != null 
        && request.auth.token.tenantId == tenantId;
    }
  }
}
```

### 4. Rodar localmente
```bash
npm run dev
# Acesse: http://localhost:3000?tenant=demo
```

### 5. Deploy no Vercel
```bash
npm install -g vercel
vercel --prod
```

No painel do Vercel, adicione as mesmas variáveis de ambiente do `.env.local`.

## Configurando subdomínios no Vercel

No painel Vercel → seu projeto → Settings → Domains:
1. Adicione `*.lavaapp.com.br` (wildcard)
2. No seu DNS (Registro.br / Cloudflare), crie:
   - `CNAME *  →  cname.vercel-dns.com`

Cada cliente acessa: `nomedocliente.lavaapp.com.br`

## Criando um novo tenant

No Firebase Console → Firestore, crie um documento em `/tenants/`:
```json
{
  "slug": "nomedocliente",
  "nome": "Lava Jato do Cliente",
  "ativo": true,
  "createdAt": "Timestamp atual"
}
```

E no Firebase Auth, crie o usuário do tenant com Custom Claims:
```js
// Firebase Admin SDK
await admin.auth().setCustomUserClaims(uid, { tenantId: "ID_DO_TENANT" });
```

---
Desenvolvido com ❤️ usando Claude Code
