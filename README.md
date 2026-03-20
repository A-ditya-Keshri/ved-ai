# Ved.AI – AI Assessment Creator

An intelligent assessment creation platform that allows teachers to generate structured question papers using AI. Built with Next.js, Node.js/Express, MongoDB, Redis, BullMQ, and Google Gemini.

---

## 🏗️ Architecture Overview

```
┌──────────────────────┐       WebSocket         ┌──────────────────────┐
│     Next.js Frontend │◄─────────────────────────►│   Express Backend    │
│     (Port 3000)      │       REST API           │    (Port 5000)       │
│                      │◄────────────────────────►│                      │
│  • Zustand Store     │                          │  • Assignment API    │
│  • Socket.IO Client  │                          │  • Socket.IO Server  │
│  • PDF Export        │                          │  • BullMQ Worker     │
└──────────────────────┘                          └──────────┬───────────┘
                                                             │
                                              ┌──────────────┼──────────────┐
                                              │              │              │
                                         ┌────▼────┐  ┌──────▼─────┐ ┌─────▼──────┐
                                         │ MongoDB │  │   Redis    │ │  Gemini AI │
                                         │         │  │  (BullMQ)  │ │   (LLM)    │
                                         └─────────┘  └────────────┘ └────────────┘
```

### Flow

1. **Teacher** fills the assignment creation form (subject, topic, question types)
2. **Frontend** sends POST request to `/api/assignments`
3. **Backend** creates assignment in MongoDB, adds a generation job to BullMQ queue
4. **Worker** picks up the job, builds a structured prompt, calls Google Gemini AI
5. **AI** generates questions grouped into sections with difficulty levels
6. **Worker** stores the structured question paper in MongoDB
7. **WebSocket** notifies the frontend in real-time with progress updates
8. **Frontend** renders the question paper with sections, difficulty badges, and marks
9. **Teacher** can download as PDF or regenerate

---

## 🛠️ Tech Stack

| Layer      | Technology                                   |
|------------|----------------------------------------------|
| Frontend   | Next.js 15, TypeScript, Zustand, Socket.IO   |
| Backend    | Node.js, Express, TypeScript                 |
| Database   | MongoDB (Mongoose)                           |
| Cache/Queue| Redis, BullMQ                                |
| AI         | Google Gemini 3 Flash Preview (Latest SDK)   |
| Real-time  | Socket.IO (WebSocket)                        |
| PDF Export | html2canvas + jsPDF                          |

---

## 📁 Project Structure

```
ved-ai/
├── backend/
│   ├── src/
│   │   ├── config/          # DB, Redis, env configs
│   │   ├── models/          # Mongoose schemas (Assignment, QuestionPaper)
│   │   ├── routes/          # Express REST API routes
│   │   ├── services/        # AI service (Gemini prompt engineering)
│   │   ├── workers/         # BullMQ job workers
│   │   ├── websocket/       # Socket.IO server
│   │   └── index.ts         # Entry point
│   ├── .env
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── app/             # Next.js App Router pages
│   │   ├── components/      # Sidebar, reusable UI
│   │   ├── store/           # Zustand state management
│   │   └── lib/             # API client, WebSocket client
│   ├── .env.local
│   └── package.json
└── README.md
```

---

## 🎨 Approach

1. **Figma-Driven Design**: UI closely follows the provided Figma designs with coral (#E8604C) primary color, dark sidebar, and clean card-based layout
2. **Structured AI Prompting**: Instead of rendering raw AI output, structured JSON prompts ensure the AI returns properly formatted sections, questions, difficulty tags, and answers
3. **Background Processing**: BullMQ handles AI generation as background jobs with retry logic, preventing API timeouts
4. **Real-Time Updates**: WebSocket pushes generation progress (started → progress → completed) to the frontend
5. **Separation of Concerns**: Clean MVC architecture with models, routes, services, and workers in separate modules

---

## ✨ Key Features

- ✅ Assignment creation with multiple question types (MCQ, Short Answer, Long Answer, Diagram, Numerical)
- ✅ AI-powered question generation with difficulty levels (Easy, Moderate, Hard)
- ✅ Real-time generation progress via WebSocket
- ✅ Structured question paper output with sections
- ✅ PDF download with proper formatting
- ✅ Regeneration support
- ✅ Mobile responsive design
- ✅ Form validation (no empty/negative values)
- ✅ Zustand state management
- ✅ BullMQ background job processing
- ✅ Redis caching layer
- ✅ MongoDB for persistent storage
