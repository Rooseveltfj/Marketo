# Marketo — Marketplace Mobile App

App de compra e venda desenvolvido em React Native + Expo.

## Stack
- React Native + Expo SDK 51
- TypeScript (strict mode)
- Expo Router (file-based navigation)
- Firebase (Auth, Firestore, Storage)
- Zustand + MMKV (state management)
- React Query (server state + cache)
- Reanimated v3 + Gesture Handler
- FlashList (performance lists)
- expo-image (optimized images)

## Setup

1. Clone o repositório
2. `npm install`
3. Copie `.env.example` → `.env` e preencha com suas credenciais Firebase
4. Configure o projeto Firebase (Auth, Firestore, Storage)
5. `npx expo start`

## Estrutura
- `src/app/` - Rotas e Telas (Expo Router)
- `src/components/` - Componentes de UI e Lógica Reutilizável
- `src/constants/` - Temas, Cores, Categorias e Configurações
- `src/hooks/` - Custom Hooks (React Query)
- `src/services/` - Serviços do Firebase (Auth, DB, Storage) e APIs
- `src/stores/` - Gerenciamento de Estado Global (Zustand)
- `src/types/` - Tipagens do TypeScript
- `src/utils/` - Funções utilitárias (formatters, loggers)
- `src/assets/` - Imagens, Fontes e Ícones estáticos

## Scripts
- `npm start` — iniciar o servidor de desenvolvimento
- `npm run android` — rodar no Android
- `npm run ios` — rodar no iOS
- `npm run build:android` — gerar build de produção para Android
- `npm run build:ios` — gerar build de produção para iOS
- `npm run lint` — verificar código
- `npm run type-check` — verificar tipos TypeScript

## Firestore Indexes necessários
- products: (status ASC, createdAt DESC)
- products: (status ASC, category.id ASC, createdAt DESC)
- products: (sellerId ASC, status ASC)
- chats: (participants ARRAY, updatedAt DESC)
