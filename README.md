# Núcleo Parental Pro

App de gestão de coparentalidade para progenitors em Portugal.

## Stack

- **Next.js 15** (App Router)
- **Supabase** (Auth + Database + RLS)
- **Tailwind CSS** (Design System)
- **PWA** (Manifest + Service Worker)

## Funcionalidades

- **Dashboard**: Resumo financeiro, próximo evento de custódia, alertas
- **Chat Mediado**: Mensagens com deteção de tom e mediação IA (Evaristo.ai)
- **Calendário**: Feriados nacionais e municipais Portugal 2026
- **Finanças**: Gestão de despesas em cêntimos, split 50/50, aprovação >250€

## Setup

### 1. Configurar Supabase

1. Criar projeto em [supabase.com](https://supabase.com)
2. Executar `supabase/schema.sql` no SQL Editor
3. Copiar URL e ANON Key para `.env.local`

### 2. Variáveis de Ambiente

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx
EVARISTO_API_KEY=your-evaristo-key  # Optional
```

### 3. Instalar e Executar

```bash
npm install
npm run dev
```

## Estrutura

```
src/
├── app/                 # Next.js 15 App Router
│   ├── (app)/          # Rotas protegidas
│   │   ├── dashboard/
│   │   ├── chat/
│   │   ├── calendar/
│   │   └── finances/
│   ├── (auth)/         # Login/Register
│   └── api/            # API Routes
├── components/         # UI Components
│   ├── ui/            # Button, Input, Card
│   └── layout/        # Sidebar, BottomNav
├── lib/               # Utilities
│   ├── supabase.ts    # Supabase client
│   ├── utils.ts       # Helpers (cêntimos, datas PT)
│   └── holidays-pt.ts # Feriados Portugal
└── types/             # TypeScript interfaces
```

## Design System

- **Primary**: `#00464a` (Teal)
- **Tertiary**: `#004914` (Verde - positivo)
- **Orange Soft**: `#FF7043` (Avisos)
- **Fonts**: Manrope (headlines), Inter (body)

## PWA

O app funciona offline e pode ser instalado no telemóvel via manifest.json.

## Autenticação

- Supabase Auth (email/password)
- Middleware protege rotas não autenticadas
- Perfis: `parent_a` ou `parent_b`

## Licença

MIT