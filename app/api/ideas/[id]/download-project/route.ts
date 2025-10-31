import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db/drizzle';
import { bookmarkedIdea } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import JSZip from 'jszip';
import {
  generatePackageJson,
  generateRequirementsTxt,
  generateGitignore,
  generateReadme,
  TechStackConfig,
} from '@/lib/tech-stack-generator';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });
    const userId = session?.user.id;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const techStackParam = req.nextUrl.searchParams.get('techStack');
    
    // Parse tech stack - can be either string or JSON
    let techStack: TechStackConfig = {};
    try {
      techStack = techStackParam ? JSON.parse(techStackParam) : {};
    } catch {
      // If not JSON, treat as old string format and try to parse
      if (techStackParam) {
        const parts = techStackParam.split(',').map(s => s.trim());
        techStack = {
          frontend: parts.find(p => ['Next.js', 'React', 'Vue.js', 'Angular'].some(f => p.includes(f))),
          backend: parts.find(p => ['Express.js', 'FastAPI', 'Django', 'Flask'].some(b => p.includes(b))),
          database: parts.find(p => ['PostgreSQL', 'MongoDB', 'SQLite', 'MySQL'].some(d => p.includes(d))),
          styling: parts.find(p => ['Tailwind CSS', 'CSS', 'Styled Components'].some(s => p.includes(s))),
        };
      }
    }

    // Get the bookmarked idea
    const [ideaData] = await db
      .select()
      .from(bookmarkedIdea)
      .where(and(eq(bookmarkedIdea.id, id), eq(bookmarkedIdea.userId, userId)));

    if (!ideaData) {
      return NextResponse.json({ error: 'Idea not found' }, { status: 404 });
    }

    if (!ideaData.codeStubs || !Array.isArray((ideaData.codeStubs as any).files)) {
      return NextResponse.json({ error: 'Code stubs not found. Please generate specs first.' }, { status: 400 });
    }

    const codeStubs = ideaData.codeStubs as { files: { path: string; content: string }[] };
    const zip = new JSZip();

    // Add all code stub files
    codeStubs.files.forEach((file) => {
      zip.file(file.path, file.content);
    });

    // Generate and add dependency files
    const projectName = ideaData.title.toLowerCase().replace(/\s+/g, '-');
    
    // Determine language based on tech stack
    if (techStack.backend === 'Django' || techStack.backend === 'Flask' || techStack.backend === 'FastAPI') {
      techStack.language = 'Python';
      
      // Add requirements.txt
      const requirementsTxt = generateRequirementsTxt(techStack);
      zip.file('requirements.txt', requirementsTxt);
      
      // Add README
      const readme = generateReadme(techStack, ideaData.title, ideaData.summary);
      zip.file('README.md', readme);
    } else {
      // Default to Node.js/JavaScript
      // Add package.json
      const packageJson = generatePackageJson(techStack, ideaData.title);
      zip.file('package.json', packageJson);
      
      // Add README
      const readme = generateReadme(techStack, ideaData.title, ideaData.summary);
      zip.file('README.md', readme);
    }

    // Add .gitignore
    const gitignore = generateGitignore(techStack);
    zip.file('.gitignore', gitignore);

    // Generate ZIP buffer
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

    // Return ZIP file
    return new NextResponse(zipBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${projectName}-starter.zip"`,
      },
    });
  } catch (err) {
    console.error('Error generating ZIP:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

