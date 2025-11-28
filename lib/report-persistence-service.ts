/**
 * Report Artifact Persistence Service
 * 
 * Manages the creation, storage, and retrieval of generated market reports
 * for Intellectra's analytical artifacts. Ensures paid users can access their
 * full report history with secure user-specific pathing.
 * 
 * This service uses PostgreSQL with Drizzle ORM for persistence, following
 * the conceptual pathing structure: /artifacts/{appId}/users/{userId}/reports/{reportId}
 */

import { db } from '@/db/drizzle';
import { report } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { randomUUID } from 'crypto';

/**
 * Report Artifact Data Structure
 * 
 * Represents a complete market analysis report artifact with all metadata
 * required for storage and retrieval.
 */
export interface ReportArtifact {
  reportId: string;
  userId: string;
  query: string;
  marketSpecialization: string | null;
  reportContent: string;
  resultsCount?: number;
  createdAt: Date;
}

/**
 * Report Artifact Input (for creation)
 * 
 * Used when creating a new report artifact. reportId and createdAt
 * are generated automatically.
 */
export interface ReportArtifactInput {
  userId: string;
  query: string;
  marketSpecialization?: string | null;
  reportContent: string;
  resultsCount?: number;
}

/**
 * Report Artifact Summary (for list views)
 * 
 * Lightweight representation for listing reports without full content.
 */
export interface ReportArtifactSummary {
  reportId: string;
  userId: string;
  query: string;
  marketSpecialization: string | null;
  resultsCount: number | null;
  createdAt: Date;
  // Preview: first 200 characters of report
  preview?: string;
}

/**
 * Save Report Artifact
 * 
 * Persists a complete Report Artifact to the database using secure
 * user-specific pathing structure.
 * 
 * Pathing Concept: /artifacts/{appId}/users/{userId}/reports/{reportId}
 * - Implemented via userId foreign key constraint
 * - reportId ensures unique identification within user's collection
 * 
 * @param artifact - Complete Report Artifact object (or input for creation)
 * @returns The generated reportId and confirmation of success
 * 
 * @throws Error if userId is missing or invalid
 * @throws Error if reportContent is empty
 */
export async function saveReport(
  artifact: ReportArtifactInput
): Promise<{ reportId: string; success: boolean }> {
  try {
    // Validate required fields
    if (!artifact.userId || typeof artifact.userId !== 'string' || artifact.userId.trim().length === 0) {
      throw new Error('userId is required and must be a non-empty string');
    }

    if (!artifact.reportContent || typeof artifact.reportContent !== 'string' || artifact.reportContent.trim().length === 0) {
      throw new Error('reportContent is required and must be a non-empty string');
    }

    if (!artifact.query || typeof artifact.query !== 'string' || artifact.query.trim().length === 0) {
      throw new Error('query is required and must be a non-empty string');
    }

    // Generate unique reportId
    const reportId = randomUUID();

    // Prepare data for insertion
    const reportData = {
      id: reportId,
      userId: artifact.userId,
      query: artifact.query,
      marketSpecialization: artifact.marketSpecialization || null,
      reportContent: artifact.reportContent,
      resultsCount: artifact.resultsCount || null,
    };

    // Persist to database
    // Pathing: /artifacts/{appId}/users/{userId}/reports/{reportId}
    // Implemented via userId foreign key (ensures user isolation)
    await db.insert(report).values(reportData);

    console.log(`✅ Report saved: ${reportId} for user ${artifact.userId}`);

    return {
      reportId,
      success: true,
    };
  } catch (error) {
    console.error('❌ Error saving report:', error);
    throw error instanceof Error ? error : new Error('Failed to save report');
  }
}

/**
 * Fetch Reports by User ID
 * 
 * Retrieves a list of all saved reports for a given user.
 * Only retrieves the user's private collection (/reports).
 * 
 * Pathing: /artifacts/{appId}/users/{userId}/reports
 * - Implemented via userId filter in database query
 * 
 * @param userId - The ID of the user whose reports to retrieve
 * @returns Array of Report Artifact Summaries, sorted by createdAt descending (most recent first)
 * 
 * @throws Error if userId is missing or invalid
 */
export async function fetchReportsByUserId(
  userId: string
): Promise<ReportArtifactSummary[]> {
  try {
    // Validate userId
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      throw new Error('userId is required and must be a non-empty string');
    }

    // Query user's private collection
    // Pathing: /artifacts/{appId}/users/{userId}/reports
    // Include reportContent for preview generation (single query is more efficient)
    const reports = await db
      .select({
        reportId: report.id,
        userId: report.userId,
        query: report.query,
        marketSpecialization: report.marketSpecialization,
        resultsCount: report.resultsCount,
        createdAt: report.createdAt,
        reportContent: report.reportContent,
      })
      .from(report)
      .where(eq(report.userId, userId))
      .orderBy(desc(report.createdAt));

    // Transform to summary format with preview
    const summaries: ReportArtifactSummary[] = reports.map((r) => {
      // Generate preview from first 200 characters
      const preview = r.reportContent
        ? r.reportContent.substring(0, 200).trim() + (r.reportContent.length > 200 ? '...' : '')
        : undefined;

      return {
        reportId: r.reportId,
        userId: r.userId,
        query: r.query,
        marketSpecialization: r.marketSpecialization,
        resultsCount: r.resultsCount,
        createdAt: r.createdAt,
        preview,
      };
    });

    console.log(`✅ Fetched ${summaries.length} reports for user ${userId}`);

    return summaries;
  } catch (error) {
    console.error('❌ Error fetching reports by userId:', error);
    throw error instanceof Error ? error : new Error('Failed to fetch reports');
  }
}

/**
 * Fetch Report by ID
 * 
 * Retrieves the specific content of a single report artifact.
 * Uses both userId and reportId to ensure the correct user is retrieving their data.
 * 
 * Pathing: /artifacts/{appId}/users/{userId}/reports/{reportId}
 * - Implemented via userId + reportId filter (ensures user can only access their own reports)
 * 
 * @param userId - The ID of the user requesting the report
 * @param reportId - The unique identifier of the report to retrieve
 * @returns Complete Report Artifact with full content
 * 
 * @throws Error if userId or reportId is missing or invalid
 * @throws Error if report not found or user doesn't have access
 */
export async function fetchReportById(
  userId: string,
  reportId: string
): Promise<ReportArtifact> {
  try {
    // Validate inputs
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      throw new Error('userId is required and must be a non-empty string');
    }

    if (!reportId || typeof reportId !== 'string' || reportId.trim().length === 0) {
      throw new Error('reportId is required and must be a non-empty string');
    }

    // Query with both userId and reportId for security
    // Pathing: /artifacts/{appId}/users/{userId}/reports/{reportId}
    const reports = await db
      .select()
      .from(report)
      .where(eq(report.id, reportId))
      .limit(1);

    if (reports.length === 0) {
      throw new Error(`Report not found: ${reportId}`);
    }

    const foundReport = reports[0];

    // Verify user ownership (security check)
    if (foundReport.userId !== userId) {
      throw new Error('Access denied: Report does not belong to this user');
    }

    // Transform to ReportArtifact format
    const artifact: ReportArtifact = {
      reportId: foundReport.id,
      userId: foundReport.userId,
      query: foundReport.query,
      marketSpecialization: foundReport.marketSpecialization,
      reportContent: foundReport.reportContent,
      resultsCount: foundReport.resultsCount || undefined,
      createdAt: foundReport.createdAt,
    };

    console.log(`✅ Fetched report ${reportId} for user ${userId}`);

    return artifact;
  } catch (error) {
    console.error('❌ Error fetching report by id:', error);
    throw error instanceof Error ? error : new Error('Failed to fetch report');
  }
}

/**
 * Delete Report by ID
 * 
 * Optional utility function to delete a report artifact.
 * Ensures user can only delete their own reports.
 * 
 * @param userId - The ID of the user requesting deletion
 * @param reportId - The unique identifier of the report to delete
 * @returns Confirmation of deletion
 */
export async function deleteReportById(
  userId: string,
  reportId: string
): Promise<{ success: boolean }> {
  try {
    // Validate inputs
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      throw new Error('userId is required and must be a non-empty string');
    }

    if (!reportId || typeof reportId !== 'string' || reportId.trim().length === 0) {
      throw new Error('reportId is required and must be a non-empty string');
    }

    // Verify ownership before deletion
    const existingReport = await db
      .select()
      .from(report)
      .where(eq(report.id, reportId))
      .limit(1);

    if (existingReport.length === 0) {
      throw new Error(`Report not found: ${reportId}`);
    }

    if (existingReport[0].userId !== userId) {
      throw new Error('Access denied: Report does not belong to this user');
    }

    // Delete the report
    await db.delete(report).where(eq(report.id, reportId));

    console.log(`✅ Deleted report ${reportId} for user ${userId}`);

    return { success: true };
  } catch (error) {
    console.error('❌ Error deleting report:', error);
    throw error instanceof Error ? error : new Error('Failed to delete report');
  }
}

