
# Real-time Chat App (WebSocket + React + Express)

This is a simple real-time chat application built using:

- **Backend:** Node.js, Express, WebSocket (`ws`)
- **Frontend:** React (Vite/CRA)
- **Communication:** WebSocket protocol

Users can:
- Enter a **username** before joining
- Send messages in real time
- See all messages broadcasted with usernames (like `Alice: Hello!`)

---

## Features
- Real-time messaging with WebSockets
- Usernames stored per connection
- Broadcast chat messages to all connected users
- Clean separation of **frontend** and **backend**

---

## Project Structure
```
real-time-chat-app/
│
├── backend/                 # Node.js + Express + ws server
│   ├── src/
│   │   └── server.ts
│   ├── package.json
│   └── tsconfig.json
│
└── frontend/                # React client
├── src/
│   └── App.tsx
├── package.json
└── vite.config.ts / webpack.config.js
```
````

---

## 🛠️ Setup Instructions

### 1. Clone the repo
```bash
git clone <url>
cd Realtime-Chat-Application
````

### 2. Setup Backend

```bash
cd backend
npm install
npm run dev   # or: npx ts-node src/server.ts
```

Backend runs on **[http://localhost:8080](http://localhost:8080)** with WebSocket enabled.

### 3. Setup Frontend

```bash
cd ../frontend
npm install
npm run dev
```

Frontend runs on **[http://localhost:5173](http://localhost:5173)** (Vite default) or **[http://localhost:3000](http://localhost:3000)** (CRA).

---

## 📡 How It Works

1. When a client connects, they first **send their username**:

   ```json
   { "type": "set-username", "username": "Alice" }
   ```

2. When sending a chat message:

   ```json
   { "type": "chat-message", "message": "Hello everyone!" }
   ```

3. Server prepends username and broadcasts:

   ```
   Alice: Hello everyone!
   ```

---

##  Example Backend Code

```ts
const wss = new WebSocketServer({ server: httpServer });
const userNames = new Map<WebSocket, string>();

wss.on("connection", (socket) => {
  socket.on("message", (raw) => {
    const msgObj = JSON.parse(raw.toString());

    if (msgObj.type === "set-username") {
      userNames.set(socket, msgObj.username);
      socket.send(`Welcome, ${msgObj.username}!`);
      return;
    }

    const username = userNames.get(socket) || "Anonymous";
    const broadcastMessage = `${username}: ${msgObj.message}`;

    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(broadcastMessage);
      }
    });
  });

  socket.on("close", () => userNames.delete(socket));
});

```
