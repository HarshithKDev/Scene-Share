# Scene-Share

<div align="center">
  <img src="./src/assets/logo.png" alt="Scene-Share Logo" width="150">
  <p align="center">
    A real-time co-watching application for you and your friends.
    <br />
    <a href="https://scene-share.vercel.app/"><strong>View Demo »</strong></a>
    <br />
    <br />
    <a href="https://github.com/HarshithKDev/scene-share/issues">Report Bug</a>
    ·
    <a href="https://github.com/HarshithKDev/scene-share/issues">Request Feature</a>
  </p>
</div>

### Table of Contents

1.  [About The Project](#about-the-project)
2.  [Built With](#built-with)
3.  [Getting Started](#getting-started)
    * [Prerequisites](#prerequisites)
    * [Installation](#installation)
4.  [Features](#features)
5.  [Project Structure](#project-structure)
6.  [Deployment](#deployment)
7.  [License](#license)
8.  [Contact](#contact)

---

## About The Project

**Scene-Share** is a web-based application designed for small groups of friends to watch screen-shared content together in real-time. The primary use-case is for a "host" to stream movies, series, or any other video content from their computer to a private, invite-only room.

Participants can join with their camera and microphone, creating a shared viewing experience. The application is built with security and performance in mind, ensuring a smooth and safe environment for its users.

## Built With

This project leverages a modern and robust technology stack for both the frontend and backend.

**Frontend:**
* ![React](https://img.shields.io/badge/React-19-blue?logo=react)
* ![Vite](https://img.shields.io/badge/Vite-black?logo=vite)
* ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?logo=tailwind-css)
* ![React Router](https://img.shields.io/badge/React_Router-v7-red?logo=react-router)
* ![Agora RTC SDK](https://img.shields.io/badge/Agora-RTC-blue)

**Backend:**
* ![Node.js](https://img.shields.io/badge/Node.js-43853D?logo=node.js)
* ![Express.js](https://img.shields.io/badge/Express.js-000000?logo=express)
* ![Firebase](https://img.shields.io/badge/Firebase-FFCA28?logo=firebase) ![Auth & Firestore](https://img.shields.io/badge/Authentication%20%26%20Firestore-grey)
* ![Agora Token Server](https://img.shields.io/badge/Agora-Tokens-blue)

**Deployment:**
* ![Vercel](https://img.shields.io/badge/Vercel-000000?logo=vercel)

## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

You need to have `npm` (or `yarn`/`pnpm`) and Node.js (v18 or higher) installed on your machine.

You will also need to set up accounts for:
* **Firebase:** To handle user authentication and Firestore database.
* **Agora:** To get your App ID and App Certificate for video streaming.

### Installation

1.  **Clone the repo**
    ```sh
    git clone https://github.com/harshithkdev/scene-share
    cd scene-share
    ```

2.  **Install NPM packages for the frontend**
    ```sh
    npm install
    ```

3.  **Install NPM packages for the backend**
    ```sh
    cd server
    npm install
    cd ..
    ```

4.  **Configure Environment Variables**

    Create a `.env` file in the root of the project for the frontend:
    ```
    VITE_FIREBASE_API_KEY=your_firebase_api_key
    VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
    VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
    VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
    VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
    VITE_FIREBASE_APP_ID=your_firebase_app_id
    VITE_AGORA_APP_ID=your_agora_app_id
    ```

    Create another `.env` file in the `/server` directory for the backend:
    ```
    PORT=8080
    AGORA_APP_ID=your_agora_app_id
    AGORA_APP_CERTIFICATE=your_agora_app_certificate
    FIREBASE_SERVICE_ACCOUNT_KEY=your_firebase_service_account_json_content
    ```
    *Note: `FIREBASE_SERVICE_ACCOUNT_KEY` should be the JSON content of your Firebase service account key, usually as a single line.*

5.  **Run the application**

    To run both the frontend and backend concurrently:
    ```sh
    npm run dev:all
    ```
    This will start the frontend on `http://localhost:5173` and the backend on `http://localhost:8080`.

## Features

* **Real-time Video & Audio:** High-quality, low-latency video and audio powered by Agora.
* **Secure Screen Sharing:** Only the host of the room can share their screen.
* **User Authentication:** Secure login and sign-up using Firebase Authentication (Email/Password & Google Sign-In).
* **Private Rooms:** Room creation with a unique, randomly generated 6-digit ID.
* **Host Controls:** The host initiates and stops the screen share stream for all participants.
* **Active Speaker Indication:** A visual highlight shows who is currently speaking.
* **Responsive Design:** A clean, modern UI that works on both desktop and mobile devices.
* **Dark Mode:** Built-in theme toggling for user comfort.

## Project Structure

The project is a monorepo with a clear separation between the client and server code.
```
/
├── server/               # Node.js & Express Backend
│   └── index.js          # API endpoints for room creation & token generation
│
├── src/                  # React Frontend Application
│   ├── components/       # Reusable UI components (Button, Card, etc.) & Routes
│   ├── context/          # React Context providers (Auth, Theme, Toast)
│   ├── pages/            # Top-level page components (Lobby, Login, StreamRoom)
│   ├── services/         # API service calls (e.g., fetchAgoraToken)
│   ├── utils/            # Utility functions (e.g., input sanitization)
│   ├── App.jsx           # Main component with routing logic
│   └── main.jsx          # Application entry point
│
├── vercel.json           # Deployment configuration for Vercel
├── vite.config.js        # Vite build tool configuration
└── package.json          # Frontend dependencies and scripts
```

## Deployment

This application is configured for seamless deployment to **Vercel**.

1.  **Push your code to a GitHub repository.**
2.  **Import the repository into your Vercel dashboard.**
3.  **Configure Environment Variables:** Add all the environment variables from your `.env` and `server/.env` files to the Vercel project settings. Make sure to correctly handle the `FIREBASE_SERVICE_ACCOUNT_KEY` as a multi-line variable if needed.
4.  **Deploy:** Vercel will automatically use the `vercel.json` and `package.json` build scripts to deploy the application. The `vercel.json` file is configured to handle the serverless functions and client-side routing correctly.

## License

Distributed under the MIT License. See `LICENSE` for more information.

## Contact

Harshith K - [@Harsh0189](https://x.com/Harsh0189) - harshithkotian999@gmail.com

Project Link: [https://github.com/harshithkdev/scene-share](https://github.com/harshithkdev/scene-share)

