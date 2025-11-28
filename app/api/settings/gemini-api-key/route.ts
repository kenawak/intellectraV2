import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db/drizzle';
import { userprofile } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { encrypt, decrypt } from '@/lib/encryption';
import { GoogleGenAI } from '@google/genai';
import crypto from 'crypto';

/**
 * POST /api/settings/gemini-api-key
 * Save and validate user's Gemini API key
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });
    const userId = session?.user.id;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { apiKey } = await req.json();

    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length === 0) {
      return NextResponse.json({ error: 'API key is required' }, { status: 400 });
    }

    // Validate the API key by making a test call to Gemini
    try {
      const testGemini = new GoogleGenAI({ apiKey: apiKey.trim() });
      // Make a minimal test call to verify the key works
      // Use a timeout to prevent hanging on network issues
      const validationPromise = testGemini.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{
          role: 'user',
          parts: [{ text: 'test' }]
        }]
      });
      
      // Add timeout (10 seconds)
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Validation timeout')), 10000)
      );
      
      await Promise.race([validationPromise, timeoutPromise]);
    } catch (validationError: unknown) {
      // Check for invalid API key errors
      const apiError = validationError as { message?: string; error?: { code?: number; status?: number | string }; code?: number; status?: number };
      const errorMessage = apiError?.message || JSON.stringify(validationError || {});
      const errorCode = apiError?.error?.code || apiError?.code;
      const errorStatus = apiError?.error?.status || apiError?.status;
      
      // Handle invalid API key errors (multiple possible formats)
      if (
        errorStatus === 401 || 
        errorStatus === 403 || 
        errorCode === 400 ||
        errorMessage?.includes('API key not valid') ||
        errorMessage?.includes('INVALID_ARGUMENT') ||
        apiError?.error?.status === 'INVALID_ARGUMENT' ||
        apiError?.error?.code === 400
      ) {
        console.error('Invalid API key rejected:', errorMessage);
        return NextResponse.json(
          { error: 'Invalid API key. Please check your Gemini API key and try again.' },
          { status: 400 }
        );
      }
      
      // Network errors or timeouts - reject saving (security: don't save unvalidated keys)
      if (apiError.message?.includes('timeout') || (apiError as { code?: string }).code === 'ETIMEDOUT') {
        console.error('API key validation timeout - rejecting save:', apiError.message);
        return NextResponse.json(
          { error: 'Validation timeout. Please check your internet connection and try again.' },
          { status: 400 }
        );
      }
      
      // Other errors - reject for security
      console.error('API key validation failed - rejecting save:', apiError.message || validationError);
      return NextResponse.json(
        { error: 'Failed to validate API key. Please check your key and try again.' },
        { status: 400 }
      );
    }

    // Encrypt the API key
    const { encrypted, iv } = encrypt(apiKey.trim());

    // Get or create user profile
    const [existingProfile] = await db
      .select()
      .from(userprofile)
      .where(eq(userprofile.userId, userId))
      .limit(1);

    if (existingProfile) {
      // Update existing profile
      await db
        .update(userprofile)
        .set({
          geminiApiKeyEncrypted: encrypted,
          geminiApiKeyIv: iv,
          geminiApiKeyVersion: (existingProfile.geminiApiKeyVersion || 1) + 1,
          updatedAt: new Date(),
        })
        .where(eq(userprofile.userId, userId));
    } else {
      // Create new profile (shouldn't happen but handle it)
      await db.insert(userprofile).values({
        id: crypto.randomUUID(),
        userId,
        geminiApiKeyEncrypted: encrypted,
        geminiApiKeyIv: iv,
        geminiApiKeyVersion: 1,
      });
    }

    return NextResponse.json({
      message: 'API key saved and validated successfully',
      masked: apiKey.substring(0, 7) + '*'.repeat(Math.max(0, apiKey.length - 11)) + apiKey.substring(apiKey.length - 4),
    });
  } catch (err) {
    console.error('Error saving API key:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/settings/gemini-api-key
 * Get user's API key status (masked)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });
    const userId = session?.user.id;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [profile] = await db
      .select()
      .from(userprofile)
      .where(eq(userprofile.userId, userId))
      .limit(1);

    if (!profile || !profile.geminiApiKeyEncrypted) {
      return NextResponse.json({ hasKey: false });
    }

    // Decrypt to get masked version (only for display)
    try {
      const decrypted = decrypt(profile.geminiApiKeyEncrypted, profile.geminiApiKeyIv || '');
      const masked = decrypted.substring(0, 7) + '*'.repeat(Math.max(0, decrypted.length - 11)) + decrypted.substring(decrypted.length - 4);
      
      return NextResponse.json({
        hasKey: true,
        masked,
        version: profile.geminiApiKeyVersion || 1,
      });
    } catch (err) {
      // If decryption fails, key might be corrupted
      return NextResponse.json({
        hasKey: false,
        error: 'Unable to retrieve API key',
      });
    }
  } catch (err) {
    console.error('Error fetching API key:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/settings/gemini-api-key
 * Remove user's API key
 */
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });
    const userId = session?.user.id;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await db
      .update(userprofile)
      .set({
        geminiApiKeyEncrypted: null,
        geminiApiKeyIv: null,
        geminiApiKeyVersion: null,
        updatedAt: new Date(),
      })
      .where(eq(userprofile.userId, userId));

    return NextResponse.json({ message: 'API key removed successfully' });
  } catch (err) {
    console.error('Error removing API key:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

