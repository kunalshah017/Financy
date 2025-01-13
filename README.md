# Financy 🤖💰

Financy is a WhatsApp AI solution that helps you manage your finances. Track expenses, savings, and bill splits with ease. It also manages your Web3 finances with Solana - track tokens and send them to others.

- [Financy Demo Video](https://youtu.be/dedMXwm6IHc)

## Features ✨

- 💬 WhatsApp-based interaction
- 📊 Expense tracking
- 💰 Savings management
- 👥 Add Friends by sharing contact
- 🤝 Bill splitting with friends
- 🌐 Solana wallet management
- 🗣️ Voice message support
- 📷 Receipt scanning

## Prerequisites 📋

Before setting up Financy, you'll need:

- Docker and Docker Compose
- Twilio Account
- MongoDB Atlas Account
- Node.js (optional, for local development)
- Ollama (optional, for local development)

## Setup Guide 🚀

### 1. Clone the Repository

```bash
git clone https://github.com/kunalshah017/Financy.git
cd Financy
```

### 2. Environment Variables

Copy the example environment file and update the values with your own:

```bash
cp .example.env .env
```

Fill in your credentials:

```env
TWILIO_ACCOUNT_SID=your_sid_here
TWILIO_AUTH_TOKEN=your_token_here
TWILIO_WHATSAPP_NUMBER=your_whatsapp_number

MONGODB_URI=your_mongodb_uri
```

### 3. Getting API Credentials

Twilio Setup:

1. Create a [Twilio Account](https://www.twilio.com/try-twilio)
2. Enable Whatsapp Sandbox in [Twilio Console](https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn) and get your Twilio Whatsapp Number.
3. Get your Account SID, Auth Token from [Dashboard](https://console.twilio.com)

MongoDB Setup:

1. Create a [MongoDB Atlas Account](https://www.mongodb.com/atlas/database)
2. Create a new cluster and get your connection string.

### 4. Docker Setup

If you don't have Docker installed, you can download it from [here](https://www.docker.com/products/docker-desktop/).

Start Docker Services:

```bash
docker-compose up -d
```

This will start the following services:

- Financy API Server
- Ollama AI Service
- Whisper Voice Transcription Service

### 5. Exposing Your Local Server

**Option 1: VSCode Port Forwarding**

1. Open command palette (Ctrl/Cmd + Shift + P)
2. Search for "Ports: Forward a Port"
3. Enter port 3000
4. Use the provided URL for Twilio webhook

**Option 2: Ngrok**

1. [Install Ngrok](https://ngrok.com/download)
2. Run Ngrok on port 3000

```bash
ngrok http 3000
```

3. Copy the provided URL

### 6. Twilio Webhook Setup

1. Use the provided URL with endpoint in Twilio > Messaging > Try it out > Send a WhatsApp message > Sandbox Settings > When a message comes in

2. Set When a message comes in URL to: `your_url/api/whatsapp/receive-message`

3. Set the HTTP method to `POST`

**Usage** 📱

1. Join your Twilio WhatsApp Sandbox
2. Send "join <sandbox-code>" to your Twilio WhatsApp Number
3. Start Interacting with Financy!

Common Commands:

**Finance Management**

- "Add expense 100 for dinner"
- "Save 100 for vacation"
- "Split 300 with Alice, Bob"

**Adding Friends**

- Share a contact card attachment with Financy
- "Add Alice +911234567890"

**Web3 Features**

- "Create Solana wallet"
- "Show Wallet Balance"
- "Send 0.1 SOL to <address>"
- "Show Wallet Address"

**Voice & Image Features**

- Send a voice message describing your transaction
- Send an photo of receipt for automatic expense tracking

## Tech Stack 🛠️

- Bun.js - Runtime & Package Manager
- Hono - Backend Framework
- MongoDB - Database
- Twilio - Whatsapp Integration
- Ollama
  - [calebfahlgren/natural-functions](https://ollama.com/calebfahlgren/natural-functions) For NLP.
  - [llama3.2-vision](https://ollama.com/llama3.2-vision) For Image Processing.
- OpenAI Whisper - [Whisper ASR Service](https://github.com/ahmetoner/whisper-asr-webservice)
- Solana - Web3 Integration
- Docker - Containerization

## Contributing 🤝

Contributions are always welcome! Please feel free to open an issue or submit a pull request.

## License 📜

This project is licensed under the MIT License.

## Inspiration 💡

- [CashKaKa](https://cashkaka.com)
