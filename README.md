Build a production-ready full stack mobile-first app called **fricker** — *the friend picker*.

Core Concept:
A social-lite layer for real friends: find people by @username, send mutual friend requests, then pick who to see next. Swipe or browse AI-suggested activities, send a plan, and your friend can accept or decline.

Public profiles are minimal (display name, avatar, @username) for discovery; richer hangout preferences stay private until you connect.

Platforms:
1. React Native app (primary platform)
2. Optional Next.js web dashboard
3. Shared backend API

Preferred Stack:
- React Native + Expo + TypeScript
- Next.js + TypeScript + Tailwind
- Express.js + TypeScript
- Firebase Auth
- Firestore
- Firebase Storage
- Zod validation
- Zustand or Context
- Clean scalable folder structure

Core AI Requirement:
Create an abstraction layer so the app can connect to any AI provider later.

Supported providers should be easy to swap:

- LM Studio local models
- OpenAI
- Anthropic
- Ollama
- Custom REST endpoints
- Future providers

Use provider adapter pattern.

Example:

AiProvider interface:
- generateSuggestions(friendProfile): Promise<Suggestion[]>

Implement providers:
- LMStudioProvider
- OpenAIProvider
- AnthropicProvider
- MockProvider

Backend chooses provider from config/env.

Main Features:

Authentication:
- Sign up
- Login
- Logout
- Persistent session

Friend Records (private only):
Users manually store their real-life friends.

Fields:
- name
- nickname
- photo
- phone number
- address / suburb
- hobbies
- favourite foods
- favourite activities
- personality notes
- budget level
- availability notes
- tags
- birthday (optional)

Swipe Flow:

Main screen shows friend cards.

Swipe Left:
- skip for now

Swipe Right:
- want to hang out

After swipe right:
Generate 3 personalized suggestions using AI.

Example outputs:
- Coffee in Carlton then bookstore visit
- Basketball at local courts then burgers
- Beach drive and lunch
- Trivia night nearby
- Arcade then ramen

Suggestions Screen:

Each suggestion should include:
- title
- short reason why it matches friend
- estimated cost
- estimated duration
- optional nearby place ideas

Actions:
- Save suggestion
- Generate more
- Copy invite text
- Open SMS
- Mark completed

History:
Track completed hangouts.

Fields:
- friend
- activity
- date
- notes
- rating

Firestore Structure:

users/{userId}
users/{userId}/friends/{friendId}
users/{userId}/hangoutHistory/{historyId}
users/{userId}/savedSuggestions/{suggestionId}
users/{userId}/settings/app

API Requirements:

REST API with Express.

Routes example:

POST /api/auth/signup
POST /api/auth/login

GET /api/friends
POST /api/friends
PUT /api/friends/:id
DELETE /api/friends/:id

POST /api/suggestions/:friendId
POST /api/history
GET /api/history

AI Architecture:

Create:

/services/ai/provider.interface.ts
/services/ai/lmstudio.provider.ts
/services/ai/openai.provider.ts
/services/ai/anthropic.provider.ts
/services/ai/mock.provider.ts

LM Studio provider should support local endpoint such as:
http://127.0.0.1:1234/v1

Frontend calls backend only.
Backend talks to AI provider.

UI Requirements:

- Modern polished UI
- Mobile-first
- Swipeable animated cards
- Smooth transitions
- Reusable components
- Dark mode
- Great empty/loading states

Deliverables:

1. Full project folder structure
2. Firestore schema
3. Backend route structure
4. AI provider adapter implementation
5. React Native screens
6. Swipe card implementation plan
7. Step-by-step build order

Start by generating the complete architecture and folder structure first.