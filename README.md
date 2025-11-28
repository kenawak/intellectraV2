This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Environment Variables

Required environment variables:

```bash
# Database
DATABASE_URL=your_postgresql_connection_string

# Gemini API (for system use when users don't have their own key)
GEMINI_API_KEY=your_gemini_api_key

# Encryption Master Key (REQUIRED for API key encryption)
# Generate a secure 32-byte key using: openssl rand -base64 32
SECRET_MASTER_ENCRYPTION_KEY=your_32_byte_base64_encoded_key

# Exa Search API
EXASEARCH_API_KEY=your_exa_api_key

# Auth (optional)
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
```

### Generating the Master Encryption Key

**CRITICAL**: You must generate a secure master encryption key for storing user API keys:

```bash
# Generate a 32-byte (256-bit) key
openssl rand -base64 32

# Or using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Never share or commit this key**. Store it securely in your environment variables.

## Features

- **Side Project Idea Generation**: Discover buildable developer projects from real developer content
- **Granular Tech Stack Selection**: Choose frontend, backend, database, and styling independently
- **Project Scaffolding**: Download complete starter projects with all dependencies
- **Secure API Key Management**: Users can add their own Gemini API keys (encrypted at rest)
- **Rate Limiting**: 3 free spec generations per day, unlimited with your own API key

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
