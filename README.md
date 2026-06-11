# Kuro - Enterprise AI Dev Companion

Kuro is a high-performance productivity hub designed for enterprise architects and developers working with complex ecosystems like Oracle Fusion and Salesforce. It combines local data persistence with low-latency AI intelligence to provide real-time security mapping, error diagnostics, and knowledge management.

## 🚀 Key Features

- **AI Synthesis Engine**: Powered by **Groq (Llama 3.3)** for near-instant response times.
- **Security & RBAC Mapping**: Specialized logic for Oracle JOB/DUTY roles and Salesforce Permission Sets with direct Security Console references.
- **Local-First Architecture**: High-speed local SQLite database with optional cloud synchronization (Supabase).
- **Glassmorphism UI**: High-fidelity, modern interface with interactive markdown rendering and actionable code blocks.
- **Responsive Layouts**: Full support for container-based fluid grids (`@sm`, `@md`, `@lg`) allowing smooth window drag-and-resize support within the Electron desktop environment.
- **Enterprise Modules**:
  - **Error Decoder**: Real-time diagnostic engine for complex platform logs.
  - **Permission Advisor**: Security mapping with official documentation verification.
  - **Knowledge Hub**: Team-shared wiki for enterprise standards and runbooks.
  - **Task Tracker**: High-performance Kanban board integrated with your workspace.

## 🛠 Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS (v4), Framer Motion.
- **Shell**: Electron (v34) for native desktop integration.
- **Storage**: SQLite (`better-sqlite3`), Zustand with persistence.
- **AI**: Groq API integration (`llama-3.3-70b-versatile`).

## 📁 Documentation

Detailed documentation has been consolidated into the `/docs` folder:
- [Build Instructions](docs/BUILD_INSTRUCTIONS.md)
- [Deployment Checklist](docs/DEPLOYMENT_CHECKLIST.md)
- [Project Roadmap](docs/PLAN.md)
- [Release Notes](docs/RELEASE_NOTES.md)

## 🏁 Getting Started

1. **Clone the repo**
2. **Install dependencies**: `npm install`
3. **Setup environment**: Rename `.env.example` to `.env` and add your `VITE_GROQ_API_KEY`.
4. **Run development mode**: `npm run dev`
5. **Build for production**: `npm run build`

## 🔒 Security

Kuro uses Electron's `safeStorage` for any sensitive API credentials stored locally. Audit logging is enabled by default to track all critical database mutations.

---
*Built for architects who demand high-fidelity tools.*
