# Intelligent Bistro

A mobile restaurant ordering app with a conversational AI interface. Browse the menu and manage your cart through normal UI or by chatting.

## Stack

- **Frontend** — Expo (React Native) + TypeScript + NativeWind v4 + Zustand
- **Backend** — Node.js + Express + TypeScript, Groq SDK (`llama3-8b-8192`) for NL parsing

## Run

```bash
# backend
cd backend
npm install
# set GROQ_API_KEY in .env
npm run dev          # http://localhost:3001

# frontend
cd frontend
npm install
# set EXPO_PUBLIC_API_URL=http://localhost:3001 in .env
npx expo start
```
