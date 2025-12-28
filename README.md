# Veda

![CI](https://github.com/prakashsamanta/Veda/actions/workflows/ci.yml/badge.svg)

**Veda** is a privacy-first, AI-powered personal assistant that intelligently tracks daily activities, tasks, reminders, and expenses—learning user patterns to automate lifecycle management with zero cloud costs.

## Features

- **Unified Activity Logging:** Notes, Tasks, Reminders, Expenses in one place.
- **AI-Powered Task Intelligence:** Local OCR, auto-categorization, smart recurrence suggestions.
- **Hybrid Processing:** Offline-first (local ML) + Built-in Gemini (Free) + Optional Cloud LLMs (user keys).
- **Zero Cloud Dependency:** Entire app works offline; cloud features are opt-in enhancements.
- **Privacy First:** Data stays on device (SQLite), synced only if enabled.

## Technology Stack

- **Frontend:** React Native + Expo
- **Language:** TypeScript
- **State Management:** Zustand
- **Database:** SQLite (Local)
- **Auth:** Firebase Auth
- **AI:** TensorFlow Lite (Local) + Google Gemini (Cloud)

## Prerequisites

- Node.js (v18+)
- npm or yarn
- Expo Go app on your mobile device (Android/iOS) or Android Studio/Xcode for emulators.

## Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository_url>
    cd Veda
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

## Running the App

To start the development server:

```bash
npm run start
```

-   **Run on Android:** Press `a` in the terminal (requires Android Studio or connected device).
-   **Run on iOS:** Press `i` in the terminal (requires Xcode or connected device).
-   **Run on Web:** Press `w` in the terminal.

## Project Structure

```
Veda/
├── App.tsx             # Entry point
├── app.json            # Expo configuration
├── src/
│   ├── components/     # Reusable UI components
│   ├── config/         # App configuration (Firebase, LLM, etc.)
│   ├── screens/        # Screen components
│   ├── services/       # Business logic (AI, DB, API)
│   ├── store/          # State management (Zustand)
│   ├── types/          # TypeScript definitions
│   └── utils/          # Helper functions
└── ...
```

## Testing

Run unit tests (setup in progress):

```bash
npm test
```

## Contributing

1.  Fork the repo
2.  Create your feature branch (`git checkout -b feature/amazing-feature`)
3.  Commit your changes (`git commit -m 'Add some amazing feature'`)
4.  Push to the branch (`git push origin feature/amazing-feature`)
5.  Open a Pull Request
