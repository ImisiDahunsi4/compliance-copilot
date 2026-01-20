# Compliance Copilot

Compliance Copilot is an AI-powered audio analysis tool designed to help agents comply with regulatory requirements during customer interactions. It leverages **ElevenLabs Scribe v2** for state-of-the-art speech-to-text, speaker diarization, and entity detection.

## Key Features

*   **Analyze First, Play Later**: Upload call recordings to receive a detailed analysis before playback.
*   **Synchronized Playback**: Click "Play Script" to listen to the audio while the transcript highlights in real-time.
*   **Automated Compliance Checks**: Defines "Scenarios" with mandatory keyterms. The system verifies if these terms were spoken by the agent.
*   **Speaker Diarization**: Clearly distinguishes between "Agent" and "Customer" in the transcript.
*   **Entity Detection**: Automatically identifies PII (Personally Identifiable Information) using ElevenLabs' entity detection.
*   **Client-Side API Key**: Securely bring your own ElevenLabs API Key (`xi-api-key`). It's stored in your browser's local storage and never sent to our servers.

## Technology Stack

*   **Frontend**: React (Vite), TypeScript, Tailwind CSS, Shadcn UI.
*   **State Management**: Zustand, React Context.
*   **Backend**: Supabase (PostgreSQL, Auth, Row Level Security).
*   **Audio Intelligence**: ElevenLabs Scribe v2 API.

## Setup & Installation

1.  **Clone the repository**:
    ```bash
    git clone <repository-url>
    cd compliance-copilot
    ```

2.  **Install dependencies**:
    ```bash
    pnpm install
    ```

3.  **Environment Variables**:
    Create a `.env` file in the root directory:
    ```env
    VITE_SUPABASE_URL=your_supabase_url
    VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```
    *Note: The ElevenLabs API Key is entered via the UI Settings modal.*

4.  **Run Development Server**:
    ```bash
    pnpm dev
    ```

## Usage Guide

1.  **Configure API Key**: Click the **Settings (Gear)** icon in the top header and enter your ElevenLabs API Key.
2.  **Select a Scenario**: Choose a compliance scenario (e.g., "Mortgage Application") from the Dashboard.
3.  **Upload Audio**: Click the file input to upload an MP3/WAV recording of a call.
4.  **Analyze**: The system will upload the file to ElevenLabs Scribe. Wait for the transcript to appear.
5.  **Review**:
    *   **Transcript**: Read the dialogue with clear speaker labels.
    *   **Compliance Checklist**: Watch the right-hand panel to see keyterms turn green as they are detected in the audio.
    *   **Score**: View the overall compliance score at the top.

## Deployment

This project is configured for deployment on Vercel.
*   **Build Command**: `pnpm build` (configured to ignore TypeScript type errors for smoother deployment).
*   **Output Directory**: `dist`

## License
[MIT](LICENSE)
