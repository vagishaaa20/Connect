# CampusConnect — AI-Powered Campus Group Ordering & Ride Sharing

> A GenAI-first platform for college students to coordinate group food orders, split bills intelligently, and share rides — powered by Google Gemini with persistent memory, agentic AI, and real-time collaboration.

---

## What Makes This a GenAI Project

Most apps that "use AI" make a single API call and display the response. CampusConnect is different — AI is embedded in the core loop of every major feature:

| Feature | What AI Does |
|---|---|
| **Gemini Vision Invoice Parsing** | Reads uploaded food bills (image/PDF) and auto-populates the group cart |
| **Persistent User Memory** | Tracks order history, frequent items, and generates an AI profile summary that evolves over time |
| **Agentic Ordering** | Understands natural language ("order what I normally eat") → retrieves memory → suggests items → confirms → adds to cart autonomously |
| **RAG over Order History** | Answers questions grounded in real MongoDB data ("how much have I spent?", "what did we order last time?") — never hallucinates |
| **Proactive AI** | Detects when 3+ people order the same item and automatically suggests a combo deal without being asked |
| **Multi-turn Chat Context** | Every AI response is aware of the last 10 messages as a real conversation, not one-shot prompts |
| **Structured Output → UI** | `/recommend` returns JSON that renders as interactive add-to-cart cards, not plain text |
| **AI Ride Matching** | Gemini scores route overlap between rides and suggests best matches |
| **AI Fare Split** | Generates a friendly, personalized explanation of cost splits after ride completion |

---

## Tech Stack

### Backend
- **Node.js + Express** — REST API
- **MongoDB + Mongoose** — Database
- **Socket.io** — Real-time group chat and live payment updates
- **Google Gemini 1.5 Flash** — All AI features (vision, text, multi-turn)
- **Razorpay** — In-app payment splitting
- **Multer** — Invoice file uploads
- **node-cron** — Scheduled background jobs
- **JWT** — Authentication

### Frontend
- **React + Vite**
- **Framer Motion** — Animations
- **Tailwind CSS / inline styles**
- **Socket.io-client** — Real-time updates
- **Axios** — API calls

---

## Architecture

```
Frontend (React/Vite)
    │
    ├── REST API calls → Express Backend
    │       ├── cartController    → Cart management + Gemini Vision invoice parsing
    │       ├── chatController    → Socket.io chat + AI commands + Agent routing
    │       ├── agentController   → Multi-step agentic AI with state management
    │       ├── ragController     → RAG over MongoDB order/ride history
    │       ├── rideController    → Ride matching + AI fare explanation
    │       ├── paymentController → Razorpay order creation + verification
    │       └── cronJobs          → Background: expire rides, deadline warnings, cleanup
    │
    ├── Socket.io → Real-time chat, AI responses, payment updates
    │
    └── MongoDB
            ├── User, Group, Cart, Message, Ride
            ├── UserMemory  → Persistent AI memory per user
            └── AgentState  → Multi-turn agent conversation state (TTL: 5min)
```

---

## GenAI Features Deep Dive

### 1. Gemini Vision Invoice Parser
Upload any food bill image or PDF. Gemini reads it visually and extracts all line items with prices, then uses fuzzy matching to update cart prices automatically.

```
Image upload → base64 → Gemini Vision → JSON items → fuzzy match → cart update
```

### 2. Agentic AI Ordering
The agent understands natural language without rigid commands:
```
User: "hey can you order what I normally eat"
Agent: detects intent → retrieves UserMemory.frequentItems
     → "Your usual is Chicken Biryani, Raita. Add to cart? Type yes"
User: "yes"
Agent: calls addItemsToCart → notifies group via socket
     → "✅ Added Chicken Biryani, Raita to the group cart!"
```

Agent state persists across messages with a 5-minute TTL, enabling true multi-turn conversations.

### 3. RAG (Retrieval Augmented Generation)
```
User: /ai how much have I spent this month?
  ↓
System retrieves: all checkedout carts for this group + user's items
  ↓
Gemini answers based on REAL data: "You've spent ₹847 across 3 orders this month"
  ↓
Never hallucinates — if data doesn't exist, it says so
```

### 4. Persistent Memory Loop
```
User places order
  ↓
Checkout → frequentItems updated → totalOrders incremented
  ↓
Gemini writes new aiSummary: "Evening hostel orderer who loves biryani"
  ↓
Next /recommend call uses this summary → truly personalized suggestions
```

### 5. Proactive AI
Runs silently after every chat message. When 3+ people order the same item:
```
checkProactive() detects: Biryani × 3
  ↓
Gemini: "3 of you ordered biryani — ask the restaurant for a group discount! 🍛"
  ↓
Emitted to group chat without anyone asking
```

---

## Getting Started

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)
- Google AI Studio API key (Gemini)
- Razorpay account (test mode)

### Backend Setup
```bash
cd backend
npm install
```

Create `.env`:
```env
MONGO_URI=mongodb://localhost:27017/campusconnect
JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_gemini_api_key
RAZORPAY_KEY_ID=rzp_test_xxxx
RAZORPAY_KEY_SECRET=xxxx
PORT=5000
```

```bash
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

---

## API Routes

### Auth
| Method | Route | Description |
|---|---|---|
| POST | `/api/users/register` | Register user |
| POST | `/api/users/login` | Login |

### Groups & Cart
| Method | Route | Description |
|---|---|---|
| POST | `/api/groups` | Create group |
| GET | `/api/groups` | Get user's groups |
| POST | `/api/cart/add` | Add item to cart |
| POST | `/api/cart/remove` | Remove item |
| GET | `/api/cart/:groupId` | View cart |
| POST | `/api/cart/parse-invoice-ai` | **AI** Parse invoice image |
| POST | `/api/cart/checkout` | Checkout with invoice |
| POST | `/api/cart/quick-checkout` | Quick checkout |

### Rides
| Method | Route | Description |
|---|---|---|
| POST | `/api/rides/create` | Create ride |
| GET | `/api/rides/nearby` | **AI** Get matched rides |
| POST | `/api/rides/join` | Join ride |
| POST | `/api/rides/complete` | **AI** Complete + split fare |

### Payments
| Method | Route | Description |
|---|---|---|
| POST | `/api/payments/create-order` | Create Razorpay order |
| POST | `/api/payments/verify` | Verify payment |
| GET | `/api/payments/status/:groupId` | Get payment status |

### RAG
| Method | Route | Description |
|---|---|---|
| POST | `/api/rag/query` | **AI** Natural language query over user data |

---

## Chat AI Commands

| Command | What it does |
|---|---|
| `/recommend` | Personalized food suggestions as add-to-cart cards |
| `/summarize` | AI summary of recent group chat |
| `/split` | Bill split explanation |
| `/ai <question>` | RAG-powered answer from your real order/ride data |
| Natural language | Agent detects intent automatically — no command needed |

---

## Background Jobs (node-cron)

| Job | Schedule | What it does |
|---|---|---|
| Expire rides | Every 15 mins | Marks past rides as expired |
| Deadline warnings | Every 30 mins | Notifies groups nearing checkout deadline |
| Reset proactive AI | Midnight | Clears triggered suggestions for fresh day |
| Invoice cleanup | 2am daily | Deletes invoice files older than 30 days |

---

## What Separates This from "Just API Calling"

| Just API Calling | CampusConnect |
|---|---|
| One-shot prompt → text response | AI output drives application state (cart, payments) |
| Same response for everyone | Personalized per user via persistent memory |
| User triggers AI manually | Proactive AI acts without being asked |
| Stateless | Agent state persists across conversation turns |
| AI answers from training data | RAG answers from real user data in MongoDB |
| Text output only | Structured JSON → interactive UI components |

---

## Project Structure

```
campusconnect/
├── backend/
│   ├── controllers/
│   │   ├── agentController.js    ← Agentic AI with tool use
│   │   ├── cartController.js     ← Cart + Gemini Vision
│   │   ├── chatController.js     ← Socket.io + AI routing
│   │   ├── ragController.js      ← RAG over MongoDB
│   │   ├── rideController.js     ← Rides + AI matching
│   │   └── paymentController.js  ← Razorpay integration
│   ├── models/
│   │   ├── agentStateModel.js    ← Agent conversation state (TTL)
│   │   ├── userMemoryModel.js    ← Persistent AI memory
│   │   ├── cartModel.js          ← Cart + payment records
│   │   ├── groupModel.js
│   │   ├── messageModel.js
│   │   ├── rideModel.js
│   │   └── userModel.js
│   ├── jobs/
│   │   └── cronJobs.js           ← Background scheduled tasks
│   ├── routes/
│   └── server.js
└── frontend/
    └── src/
        ├── pages/
        │   ├── CartPage.jsx       ← Invoice upload + quick checkout
        │   ├── ChatPage.jsx       ← Real-time chat + AI commands
        │   ├── PaymentPage.jsx    ← Razorpay split payment
        │   └── RidePage.jsx       ← AI ride matching
        └── components/
```

---

## Built By
CampusConnect — built as a GenAI-first campus utility platform.# CampusConnect — AI-Powered Campus Group Ordering & Ride Sharing

> A GenAI-first platform for college students to coordinate group food orders, split bills intelligently, and share rides — powered by Google Gemini with persistent memory, agentic AI, and real-time collaboration.

---

## What Makes This a GenAI Project

Most apps that "use AI" make a single API call and display the response. CampusConnect is different — AI is embedded in the core loop of every major feature:

| Feature | What AI Does |
|---|---|
| **Gemini Vision Invoice Parsing** | Reads uploaded food bills (image/PDF) and auto-populates the group cart |
| **Persistent User Memory** | Tracks order history, frequent items, and generates an AI profile summary that evolves over time |
| **Agentic Ordering** | Understands natural language ("order what I normally eat") → retrieves memory → suggests items → confirms → adds to cart autonomously |
| **RAG over Order History** | Answers questions grounded in real MongoDB data ("how much have I spent?", "what did we order last time?") — never hallucinates |
| **Proactive AI** | Detects when 3+ people order the same item and automatically suggests a combo deal without being asked |
| **Multi-turn Chat Context** | Every AI response is aware of the last 10 messages as a real conversation, not one-shot prompts |
| **Structured Output → UI** | `/recommend` returns JSON that renders as interactive add-to-cart cards, not plain text |
| **AI Ride Matching** | Gemini scores route overlap between rides and suggests best matches |
| **AI Fare Split** | Generates a friendly, personalized explanation of cost splits after ride completion |

---

## Tech Stack

### Backend
- **Node.js + Express** — REST API
- **MongoDB + Mongoose** — Database
- **Socket.io** — Real-time group chat and live payment updates
- **Google Gemini 1.5 Flash** — All AI features (vision, text, multi-turn)
- **Razorpay** — In-app payment splitting
- **Multer** — Invoice file uploads
- **node-cron** — Scheduled background jobs
- **JWT** — Authentication

### Frontend
- **React + Vite**
- **Framer Motion** — Animations
- **Tailwind CSS / inline styles**
- **Socket.io-client** — Real-time updates
- **Axios** — API calls

---

## Architecture

```
Frontend (React/Vite)
    │
    ├── REST API calls → Express Backend
    │       ├── cartController    → Cart management + Gemini Vision invoice parsing
    │       ├── chatController    → Socket.io chat + AI commands + Agent routing
    │       ├── agentController   → Multi-step agentic AI with state management
    │       ├── ragController     → RAG over MongoDB order/ride history
    │       ├── rideController    → Ride matching + AI fare explanation
    │       ├── paymentController → Razorpay order creation + verification
    │       └── cronJobs          → Background: expire rides, deadline warnings, cleanup
    │
    ├── Socket.io → Real-time chat, AI responses, payment updates
    │
    └── MongoDB
            ├── User, Group, Cart, Message, Ride
            ├── UserMemory  → Persistent AI memory per user
            └── AgentState  → Multi-turn agent conversation state (TTL: 5min)
```

---

## GenAI Features Deep Dive

### 1. Gemini Vision Invoice Parser
Upload any food bill image or PDF. Gemini reads it visually and extracts all line items with prices, then uses fuzzy matching to update cart prices automatically.

```
Image upload → base64 → Gemini Vision → JSON items → fuzzy match → cart update
```

### 2. Agentic AI Ordering
The agent understands natural language without rigid commands:
```
User: "hey can you order what I normally eat"
Agent: detects intent → retrieves UserMemory.frequentItems
     → "Your usual is Chicken Biryani, Raita. Add to cart? Type yes"
User: "yes"
Agent: calls addItemsToCart → notifies group via socket
     → "✅ Added Chicken Biryani, Raita to the group cart!"
```

Agent state persists across messages with a 5-minute TTL, enabling true multi-turn conversations.

### 3. RAG (Retrieval Augmented Generation)
```
User: /ai how much have I spent this month?
  ↓
System retrieves: all checkedout carts for this group + user's items
  ↓
Gemini answers based on REAL data: "You've spent ₹847 across 3 orders this month"
  ↓
Never hallucinates — if data doesn't exist, it says so
```

### 4. Persistent Memory Loop
```
User places order
  ↓
Checkout → frequentItems updated → totalOrders incremented
  ↓
Gemini writes new aiSummary: "Evening hostel orderer who loves biryani"
  ↓
Next /recommend call uses this summary → truly personalized suggestions
```

### 5. Proactive AI
Runs silently after every chat message. When 3+ people order the same item:
```
checkProactive() detects: Biryani × 3
  ↓
Gemini: "3 of you ordered biryani — ask the restaurant for a group discount! 🍛"
  ↓
Emitted to group chat without anyone asking
```

---

## Getting Started

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)
- Google AI Studio API key (Gemini)
- Razorpay account (test mode)

### Backend Setup
```bash
cd backend
npm install
```

Create `.env`:
```env
MONGO_URI=mongodb://localhost:27017/campusconnect
JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_gemini_api_key
RAZORPAY_KEY_ID=rzp_test_xxxx
RAZORPAY_KEY_SECRET=xxxx
PORT=5000
```

```bash
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

---

## API Routes

### Auth
| Method | Route | Description |
|---|---|---|
| POST | `/api/users/register` | Register user |
| POST | `/api/users/login` | Login |

### Groups & Cart
| Method | Route | Description |
|---|---|---|
| POST | `/api/groups` | Create group |
| GET | `/api/groups` | Get user's groups |
| POST | `/api/cart/add` | Add item to cart |
| POST | `/api/cart/remove` | Remove item |
| GET | `/api/cart/:groupId` | View cart |
| POST | `/api/cart/parse-invoice-ai` | **AI** Parse invoice image |
| POST | `/api/cart/checkout` | Checkout with invoice |
| POST | `/api/cart/quick-checkout` | Quick checkout |

### Rides
| Method | Route | Description |
|---|---|---|
| POST | `/api/rides/create` | Create ride |
| GET | `/api/rides/nearby` | **AI** Get matched rides |
| POST | `/api/rides/join` | Join ride |
| POST | `/api/rides/complete` | **AI** Complete + split fare |

### Payments
| Method | Route | Description |
|---|---|---|
| POST | `/api/payments/create-order` | Create Razorpay order |
| POST | `/api/payments/verify` | Verify payment |
| GET | `/api/payments/status/:groupId` | Get payment status |

### RAG
| Method | Route | Description |
|---|---|---|
| POST | `/api/rag/query` | **AI** Natural language query over user data |

---

## Chat AI Commands

| Command | What it does |
|---|---|
| `/recommend` | Personalized food suggestions as add-to-cart cards |
| `/summarize` | AI summary of recent group chat |
| `/split` | Bill split explanation |
| `/ai <question>` | RAG-powered answer from your real order/ride data |
| Natural language | Agent detects intent automatically — no command needed |

---

## Background Jobs (node-cron)

| Job | Schedule | What it does |
|---|---|---|
| Expire rides | Every 15 mins | Marks past rides as expired |
| Deadline warnings | Every 30 mins | Notifies groups nearing checkout deadline |
| Reset proactive AI | Midnight | Clears triggered suggestions for fresh day |
| Invoice cleanup | 2am daily | Deletes invoice files older than 30 days |

---

## What Separates This from "Just API Calling"

| Just API Calling | CampusConnect |
|---|---|
| One-shot prompt → text response | AI output drives application state (cart, payments) |
| Same response for everyone | Personalized per user via persistent memory |
| User triggers AI manually | Proactive AI acts without being asked |
| Stateless | Agent state persists across conversation turns |
| AI answers from training data | RAG answers from real user data in MongoDB |
| Text output only | Structured JSON → interactive UI components |

---

## Project Structure

```
campusconnect/
├── backend/
│   ├── controllers/
│   │   ├── agentController.js    ← Agentic AI with tool use
│   │   ├── cartController.js     ← Cart + Gemini Vision
│   │   ├── chatController.js     ← Socket.io + AI routing
│   │   ├── ragController.js      ← RAG over MongoDB
│   │   ├── rideController.js     ← Rides + AI matching
│   │   └── paymentController.js  ← Razorpay integration
│   ├── models/
│   │   ├── agentStateModel.js    ← Agent conversation state (TTL)
│   │   ├── userMemoryModel.js    ← Persistent AI memory
│   │   ├── cartModel.js          ← Cart + payment records
│   │   ├── groupModel.js
│   │   ├── messageModel.js
│   │   ├── rideModel.js
│   │   └── userModel.js
│   ├── jobs/
│   │   └── cronJobs.js           ← Background scheduled tasks
│   ├── routes/
│   └── server.js
└── frontend/
    └── src/
        ├── pages/
        │   ├── CartPage.jsx       ← Invoice upload + quick checkout
        │   ├── ChatPage.jsx       ← Real-time chat + AI commands
        │   ├── PaymentPage.jsx    ← Razorpay split payment
        │   └── RidePage.jsx       ← AI ride matching
        └── components/
```

---

## Built By
CampusConnect — built as a GenAI-first campus utility platform.