# shivagpt (Frontend + Backend)

Ye project ab pure Next.js App Router par hai.
- Frontend: `src/app/page.tsx`
- Backend APIs: `src/app/api/**`
- DB: MongoDB (`mongoose`)
- AI: Gemini (`@google/generative-ai`)

## Setup

1. Install dependencies:

```bash
npm install
```

2. Env file banao:

```bash
cp .env.example .env
```

`.env` me values set karo:

```env
MONGODB_URI=mongodb://localhost:27017/next-chatbot
GEMINI_API_KEY=your_real_key
```

3. Run app:

```bash
npm run dev
```

Open: http://localhost:3000

## Available Scripts

- `npm run dev` - development server
- `npm run build` - production build
- `npm run start` - production server
- `npm run lint` - linting

## API Routes

- `GET /api/chats`
- `POST /api/chats`
- `GET /api/chats/:id`
- `POST /api/chats/:id/messages`

## Notes

- Agar `npm run dev` fail ho to ensure MongoDB running hai.
- Gemini key invalid ho to message send route error dega.
