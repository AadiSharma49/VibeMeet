# VibeMeet

Real time chat application with AI powered insights.

## Features

- Real time messaging
- Public and private channels
- Direct messages
- File attachments and image uploads
- Message polls
- AI message rewriting
- AI channel insights for decisions, action items and risks
- Message pinning
- Message replies and forwarding
- User profiles
- Custom permissions

## Tech Stack

Frontend:
- React
- Tailwind CSS
- Vite
- Stream Chat
- Clerk Authentication
- TanStack Query

Backend:
- Node.js
- Express
- OpenAI API
- Stream Chat Server

## Local Development

### Frontend

```
cd frontend
npm install
npm run dev
```

### Backend

```
cd backend
npm install
npm run dev
```

## Environment Variables

Frontend:
- VITE_CLERK_PUBLISHABLE_KEY
- VITE_STREAM_API_KEY
- VITE_API_URL

Backend:
- PORT
- CLERK_SECRET_KEY
- STREAM_API_KEY
- STREAM_API_SECRET
- OPENAI_API_KEY

## Deployment

Frontend deployed on Vercel
Backend deployed on Vercel

## Usage

1. Create account or login
2. Create or join channels
3. Add friends
4. Start messaging
5. Use AI features for message improvements and channel insights

## Project Structure

```
VibeMeet/
├── frontend/
│   ├── public/                 Static assets
│   ├── src/
│   │   ├── components/         Reusable UI components
│   │   │   ├── ChannelInsightsPanel.jsx
│   │   │   ├── CreateChannelModal.jsx
│   │   │   ├── CreatePollModal.jsx
│   │   │   ├── CustomChannelHeader.jsx
│   │   │   ├── JoinChannelModal.jsx
│   │   │   └── UsersList.jsx
│   │   ├── hooks/              Custom react hooks
│   │   │   └── useStreamChat.js
│   │   ├── lib/                Utilities and api clients
│   │   │   └── api.js
│   │   └── pages/              Page components
│   │       ├── HomePage.jsx
│   │       └── AccountPage.jsx
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
└── backend/
    ├── src/
    │   ├── config/             Configuration files
    │   ├── controllers/        Request handlers
    │   ├── middleware/         Express middleware
    │   ├── models/             Data models
    │   ├── routes/             Api endpoints
    │   ├── services/           Business logic
    │   └── server.js           Server entry point
    ├── instrument.mjs
    ├── .env
    ├── vercel.json
    └── package.json
```

## Status

Project completed. All features implemented and working.
Fully responsive design. Documentation complete.
Ready for production deployment.