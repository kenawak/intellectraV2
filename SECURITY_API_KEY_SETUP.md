# Secure API Key Management - Setup Guide

## Overview

This system implements secure, encrypted storage of user-provided Gemini API keys with the following security features:

- **Encryption at Rest**: AES-256-CBC encryption with unique IV per key
- **Encryption in Transit**: HTTPS/TLS (handled by Next.js)
- **Never Logged**: Decrypted keys are never logged or exposed
- **API Proxy Pattern**: All Gemini API calls go through backend

## Setup Instructions

### 1. Generate Master Encryption Key

**CRITICAL**: Generate a secure 32-byte encryption key before deploying:

```bash
# Option 1: Using OpenSSL
openssl rand -base64 32

# Option 2: Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 2. Add to Environment Variables

Add the generated key to your `.env` file:

```bash
SECRET_MASTER_ENCRYPTION_KEY=your_generated_32_byte_base64_key_here
```

**⚠️ WARNING**: 
- Never commit this key to git
- Never share this key
- Store it securely (use environment variable managers in production)
- If compromised, all encrypted keys must be re-encrypted

### 3. Run Database Migration

The migration has been generated. Run it:

```bash
pnpm drizzle-kit push
# or
pnpm drizzle-kit migrate
```

This will add the following columns to `userprofile`:
- `gemini_api_key_encrypted` (TEXT) - Encrypted API key
- `gemini_api_key_iv` (TEXT) - Initialization Vector (Base64)
- `gemini_api_key_version` (INTEGER) - For key rotation

And to `user_analytics`:
- `spec_generations_today` (INTEGER) - Daily count
- `spec_generations_reset_date` (TIMESTAMP) - Reset date for daily count

## Security Implementation Details

### Encryption (`lib/encryption.ts`)

- **Algorithm**: AES-256-CBC
- **Key Derivation**: SHA-256 hash if key isn't exactly 32 bytes
- **IV**: Random 16-byte IV generated for each encryption
- **Storage**: Encrypted key and IV stored separately in database

### API Endpoints

#### POST `/api/settings/gemini-api-key`
- Validates API key with test call
- Encrypts and stores securely
- Returns masked key for confirmation

#### GET `/api/settings/gemini-api-key`
- Returns masked key status (never full key)

#### DELETE `/api/settings/gemini-api-key`
- Removes encrypted key from database

### Usage Flow

1. User adds API key in Settings page
2. Backend validates key with test Gemini API call
3. Key is encrypted using master key + unique IV
4. Encrypted key + IV stored in database
5. When generating specs:
   - System checks daily usage (3 free per day)
   - If limit reached and no user key → Error
   - If user key exists → Decrypt and use it
   - Decrypted key used immediately, never stored in memory/logs

## Rate Limiting

- **Free Tier**: 3 spec generations per day (resets at midnight)
- **With API Key**: Unlimited (subject to user's Gemini API quota)
- Usage tracked in `user_analytics.spec_generations_today`

## Testing

1. Generate master key and add to `.env`
2. Run database migration
3. Start dev server: `pnpm dev`
4. Navigate to `/dashboard/settings`
5. Add a test Gemini API key
6. Verify it's saved and masked
7. Try generating specs in workspace (should work)

## Production Checklist

- [ ] Master encryption key generated and stored securely
- [ ] Environment variable set in production
- [ ] Database migration run
- [ ] HTTPS/TLS enabled
- [ ] No sensitive keys in logs
- [ ] Rate limiting configured
- [ ] Error handling tested

