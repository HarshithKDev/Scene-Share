# Scene-Share: Technical Implementation Deep Dive

## 1. Introduction

Scene-Share is a real-time video streaming application designed for small groups of friends to watch screen-shared content together. This document provides a detailed breakdown of its implementation, architecture, and security considerations. The core purpose is to stream videos, movies, or series from a host's laptop via screen sharing. The application is intended for small groups of 3-5 people at maximum.

## 2. Core Technologies

The application is built on a modern web stack, leveraging the following technologies:

* **Frontend:**
    * **React 19:** For building the user interface.
    * **Vite:** As the build tool for a fast development experience.
    * **Tailwind CSS:** For utility-first styling.
    * **React Router 7:** For client-side routing.
    * **Agora RTC SDK for React:** For real-time video and audio communication.
* **Backend:**
    * **Node.js with Express:** For the server-side logic.
    * **Firebase Authentication:** For user management and authentication.
    * **Firestore:** As the database to manage room information.
    * **Agora Token Server:** For generating secure RTC tokens.
* **Deployment:**
    * **Vercel:** The application is configured for easy deployment on the Vercel platform.

## 3. Project Structure

The project is organized with a `server` directory for the backend and a `src` directory for the frontend React application.

|-- server/
|   |-- index.js         # Express server for Agora token generation and room management
|   |-- package.json
|-- src/
|   |-- components/      # Reusable UI components and routes
|   |-- context/         # React context for authentication, theme, and toasts
|   |-- pages/           # Main application pages (Lobby, Login, StreamRoom)
|   |-- services/        # API calls to the backend
|   |-- utils/           # Utility functions like input sanitization
|   |-- App.jsx          # Main application component with routing
|   |-- main.jsx         # Entry point of the React application
|-- vercel.json          # Vercel deployment configuration
|-- vite.config.js       # Vite configuration file
|-- tailwind.config.js   # Tailwind CSS configuration
|-- package.json

## 4. Implementation Flow and Features

### 4.1. Authentication

* **Firebase Integration:** The application uses Firebase for user authentication, supporting both email/password and Google Sign-In.
* **Authentication Context:** A `AuthContext` (`src/context/AuthContext.jsx`) is used to manage the user's authentication state throughout the application.
* **Protected Routes:** The `ProtectedRoute` component ensures that only authenticated users can access the main application lobby and streaming rooms.
* **New User Onboarding:** When a new user signs up, they are prompted to set a username via a modal (`src/components/UsernameModal.jsx`). This ensures that all users have a display name.

### 4.2. Lobby and Room Management

* **Lobby Page:** After logging in, users are directed to the `LobbyPage`, where they can either create a new room or join an existing one.
* **Room Creation:**
    * When a user clicks "Create Room," a unique 6-digit room code is generated on the client-side.
    * A request is then sent to the backend's `/create-room` endpoint to register the new room in Firestore, with the creator's UID stored as the `hostUid`.
* **Joining a Room:**
    * Users can join a room by entering the room ID in the lobby.
    * Input sanitization is performed on the room ID to prevent malicious input.

### 4.3. Real-time Communication with Agora

* **Agora Integration:** The core streaming functionality is powered by the Agora RTC SDK. The `StreamRoomPage.jsx` and `useStreamRoomHooks.js` are the central files for managing the Agora client and stream lifecycle.
* **Token Generation:**
    * To join an Agora channel, a secure token is required. When a user navigates to a room, the frontend requests a token from the backend's `/get-agora-token` endpoint.
    * The backend verifies the user's Firebase ID token before generating and returning an Agora token. This ensures that only authenticated users can get a token.
* **Dual-Client Approach for Screen Sharing:**
    * The application uses a "dual-client" approach for screen sharing. The host has two Agora clients: one for their camera and microphone, and a second one specifically for the screen share stream.
    * This allows for separate control over the camera/mic and the screen share.
* **Stream Lifecycle:**
    * The `useStreamRoomHooks` custom hook manages all aspects of the stream, including joining the channel, publishing local tracks (camera and microphone), subscribing to remote users, and handling token expiration.
    * When the host starts a stream, a new screen share client joins the channel with a unique UID (e.g., `{user.uid}-screen`) and publishes the screen video and audio tracks.
    * Other participants in the room are notified of the new stream and automatically subscribe to it. Only the host can share their screen, while all other participants can view everyone's video camera and the host's screen share.

### 4.4. Backend

* **Express Server:** A simple Express server handles all backend logic.
* **Endpoints:**
    * `/create-room`: Creates a new room in Firestore and assigns the host.
    * `/get-agora-token`: Verifies the user's Firebase token and generates an Agora RTC token.
    * `/health`: A health check endpoint to monitor the server's status.
* **Firebase Admin SDK:** The backend uses the Firebase Admin SDK to verify user ID tokens, ensuring that all API requests are authenticated.

## 5. Security Considerations

The application implements several security best practices:

* **Authenticated API Endpoints:** All backend endpoints are protected with a middleware that verifies the user's Firebase ID token. This prevents unauthorized access to the API.
* **Input Sanitization:** User-provided input, such as usernames and room IDs, is sanitized using `DOMPurify` to prevent Cross-Site Scripting (XSS) attacks.
* **Secure Token Generation:** Agora tokens are generated on the server-side, which is a crucial security measure. Exposing your Agora App Certificate on the client-side would be a major security risk.
* **Environment Variables:** All sensitive keys (Firebase config, Agora App ID, etc.) are stored in environment variables and are not hardcoded in the source code. The `.gitignore` file correctly excludes the `.env` file from version control.

## 6. Production Readiness and Potential Improvements

The application is well-structured and follows modern development practices. As per your request to analyze for production readiness and security flaws, here is an assessment:

* **Current State:** The application is in a good state. The separation of concerns between frontend and backend, server-side token generation, and input sanitization are all standard practices that make it robust.
* **Potential Improvements:**
    * **Enhanced Error Handling:** While there is error handling for connections and tokens, more granular user-facing messages for scenarios like "Room not found" or "Invalid room ID" would improve the user experience.
    * **UI/UX Refinements:**
        * The UI for copying the room code in `StreamRoomLayout.jsx` is a good feature.
        * Consider adding a visual indicator (e.g., a highlighted border) to show who is currently speaking.
    * **Testing:** Implementing unit and integration tests would further increase the application's reliability for production.

## 7. Conclusion

Scene-Share is a well-designed application that effectively leverages React, Firebase, and Agora to provide a real-time video streaming experience. The code is clean, organized, and follows security best practices, making it a solid and production-ready foundation.


