<div align="center">

# 🔐 VanishVault — Frontend

**Share secrets that self-destruct. Military-grade encryption, zero-knowledge architecture.**

[![CI/CD](https://github.com/your-org/Vanish-Vault-FE/actions/workflows/deploy.yml/badge.svg)](https://github.com/your-org/Vanish-Vault-FE/actions/workflows/deploy.yml)
![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)
![License](https://img.shields.io/badge/license-MIT-green)

</div>

---

## ✨ Features

- 🔒 **End-to-end AES-256 encryption** — data is encrypted before leaving your device
- 💣 **Self-destructing links** — expire by time (1h → 30d) or view count
- 📁 **Secure file uploads** — up to 100MB on Pro, with signed URL uploads
- 🔑 **Password-protected secrets** — optional extra layer of security
- 📱 **QR code generation** — shareable QR for every secure link
- 👑 **Plan-based access control** — Free & Pro plans with Razorpay billing
- 🌗 **Dark / Light mode** — system-aware theme switching

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 |
| UI Components | Radix UI + custom design system |
| State Management | Redux Toolkit |
| Animations | Motion (Framer Motion) |
| Payments | Razorpay |
| Containerisation | Docker (standalone Next.js build) |
| CI/CD | GitHub Actions → GHCR → SSH deploy |

---

## 🚀 Getting Started

### Prerequisites

- Node.js ≥ 20
- Yarn

### 1. Clone & install

```bash
git clone https://github.com/your-org/Vanish-Vault-FE.git
cd Vanish-Vault-FE
yarn install
```

### 2. Configure environment

Create a `.env.local` file in the project root:

```env
# Backend API (server-side)
BACKEND_URL=http://localhost:4000

# Backend API (client-side, baked into the JS bundle)
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000

# Razorpay public key (safe to expose)
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXXXXXXX
```

### 3. Run the dev server

```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🐳 Docker

### Build the image

```bash
docker build \
  --build-arg NEXT_PUBLIC_BACKEND_URL=https://api.yourdomain.com \
  --build-arg NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_XXXXXXXXXXXXXXXX \
  -t vanish-vault-fe .
```

### Run the container

```bash
docker run -d \
  --name vanish-vault-fe \
  --restart unless-stopped \
  -p 3000:3000 \
  -e BACKEND_URL=https://api.yourdomain.com \
  vanish-vault-fe
```

> **Note:** `NEXT_PUBLIC_*` variables are baked into the JS bundle at build time and must be passed as `--build-arg`. `BACKEND_URL` (server-side only) is passed at runtime via `-e`.

---

## ⚙️ CI/CD Pipeline

The GitHub Actions workflow (`.github/workflows/deploy.yml`) runs on every push to `main`:

```
Push to main
     │
  ┌──▼──────────┐
  │  Lint +     │  ESLint + tsc --noEmit  (also runs on PRs)
  │  Type Check │
  └──┬──────────┘
     │
  ┌──▼──────────────┐
  │ Build & Push    │  Docker build → push to GitHub Container Registry (GHCR)
  │ Docker Image    │  Tags: latest + sha-<commit>
  └──┬──────────────┘
     │
  ┌──▼──────────┐
  │  SSH Deploy │  Pull new image on production server → restart container
  └─────────────┘
```

### Required GitHub Secrets

Go to **Settings → Secrets and variables → Actions** and add:

| Secret | Description |
|---|---|
| `NEXT_PUBLIC_BACKEND_URL` | Production backend URL (baked into build) |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Razorpay public key (baked into build) |
| `BACKEND_URL` | Server-side backend URL (runtime env var) |
| `SSH_HOST` | Production server IP or hostname |
| `SSH_USER` | SSH username (e.g. `ubuntu`) |
| `SSH_PRIVATE_KEY` | Private SSH key for server access |
| `PRODUCTION_URL` | Public URL of the deployed app |

> `GITHUB_TOKEN` is provided automatically by GitHub — no need to add it.

---

## 📁 Project Structure

```
src/
├── app/                  # Next.js App Router pages
│   ├── (auth)/           # Sign-in / Sign-up
│   ├── create/           # Secret creation page
│   ├── dashboard/        # User dashboard & account settings
│   ├── link/[id]/        # Secret viewer (decrypt & display)
│   ├── payment/          # Payment success / failure / callback
│   └── pricing/          # Pricing page
├── components/
│   ├── animation/        # AnimatedSection wrapper
│   ├── landing/          # Hero section & landing components
│   ├── layout/           # Navigation, providers
│   └── ui/               # Design system (Button, Card, Input…)
├── lib/                  # Encryption utilities (AES-256)
├── services/             # API client, auth, plans, secrets, files
├── store/                # Redux store & slices
└── utils/                # Shared utilities
```

---

## 📜 Available Scripts

| Command | Description |
|---|---|
| `yarn dev` | Start development server |
| `yarn build` | Production build |
| `yarn start` | Start production server (after build) |
| `yarn lint` | Run ESLint |

---

## 📄 License

MIT © 2026 VanishVault
