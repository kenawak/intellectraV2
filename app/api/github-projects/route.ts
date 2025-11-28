import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db/drizzle';
import { githubProject } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { Octokit } from '@octokit/rest';

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN || undefined
});

// GET /api/github-projects - List user's GitHub projects
export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers
    });
    const userId = session?.user.id;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const projects = await db.select().from(githubProject).where(eq(githubProject.userId, userId));

    return NextResponse.json(projects);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/github-projects - Add a new GitHub project
export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers
    });
    const userId = session?.user.id;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { repoUrl } = await req.json();

    if (!repoUrl) {
      return NextResponse.json({ error: 'repoUrl is required' }, { status: 400 });
    }

    // Validate GitHub URL
    const githubUrlRegex = /^https:\/\/github\.com\/[^\/]+\/[^\/]+$/;
    if (!githubUrlRegex.test(repoUrl)) {
      return NextResponse.json({ error: 'Invalid GitHub repository URL' }, { status: 400 });
    }

    // Check if project already exists for this user
    const existingProject = await db.select().from(githubProject).where(eq(githubProject.repoUrl, repoUrl)).limit(1);
    if (existingProject.length > 0) {
      return NextResponse.json({ error: 'This repository is already added to your workspace' }, { status: 409 });
    }

    // Parse repo URL
    const [, , , owner, repo] = repoUrl.split('/');

    // Fetch repo metadata
    let repoData;
    try {
      const response = await octokit.repos.get({ owner, repo });
      repoData = response.data;
    } catch (githubErr: unknown) {
      console.error('GitHub API Error:', githubErr);
      const apiError = githubErr as { status?: number };
      if (apiError.status === 404) {
        return NextResponse.json({ error: 'Repository not found. Please check the URL and ensure the repository exists.' }, { status: 404 });
      }
      if (apiError.status === 403) {
        return NextResponse.json({ error: 'Access denied. The repository might be private or you may have exceeded the rate limit.' }, { status: 403 });
      }
      if (apiError.status === 401) {
        return NextResponse.json({ error: 'Authentication failed. Please check the GitHub token configuration.' }, { status: 401 });
      }
      return NextResponse.json({ error: 'Failed to fetch repository information. Please try again later.' }, { status: 500 });
    }

    if (repoData.private) {
      return NextResponse.json({ error: 'Private repositories are not supported. Please make the repository public and try again.' }, { status: 403 });
    }

    // Create the project
    const newProject = {
      id: crypto.randomUUID(),
      userId,
      repoUrl,
      repoName: repoData.name,
      repoDescription: repoData.description || null,
      repoLanguage: repoData.language || null,
      inferredTechStack: null, // Will be inferred during prompt generation
      cursorPrompt: null,
    };

    await db.insert(githubProject).values(newProject);

    return NextResponse.json(newProject, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}