// Tech stack dependency generator utility
export interface TechStackConfig {
  frontend?: string;
  backend?: string;
  database?: string;
  styling?: string;
  deployment?: string;
  language?: string;
}

export interface DependencyFiles {
  packageJson?: string;
  requirementsTxt?: string;
  goMod?: string;
  cargoToml?: string;
  gitignore?: string;
  readme?: string;
}

/**
 * Generate package.json based on tech stack
 */
export function generatePackageJson(
  techStack: TechStackConfig,
  projectName: string = 'my-project'
): string {
  const dependencies: Record<string, string> = {};
  const devDependencies: Record<string, string> = {};
  
  // Frontend dependencies
  if (techStack.frontend === 'Next.js') {
    dependencies['next'] = '^15.0.0';
    dependencies['react'] = '^19.0.0';
    dependencies['react-dom'] = '^19.0.0';
    devDependencies['@types/node'] = '^20.0.0';
    devDependencies['@types/react'] = '^19.0.0';
    devDependencies['@types/react-dom'] = '^19.0.0';
    devDependencies['typescript'] = '^5.0.0';
  } else if (techStack.frontend === 'React') {
    dependencies['react'] = '^19.0.0';
    dependencies['react-dom'] = '^19.0.0';
    devDependencies['@types/react'] = '^19.0.0';
    devDependencies['@types/react-dom'] = '^19.0.0';
    devDependencies['typescript'] = '^5.0.0';
    devDependencies['vite'] = '^5.0.0';
  } else if (techStack.frontend === 'Vue.js') {
    dependencies['vue'] = '^3.4.0';
    devDependencies['@vitejs/plugin-vue'] = '^5.0.0';
    devDependencies['vite'] = '^5.0.0';
    devDependencies['typescript'] = '^5.0.0';
  }

  // Styling dependencies
  if (techStack.styling === 'Tailwind CSS') {
    devDependencies['tailwindcss'] = '^4.0.0';
    devDependencies['postcss'] = '^8.4.0';
    devDependencies['autoprefixer'] = '^10.4.0';
  } else if (techStack.styling === 'Styled Components') {
    dependencies['styled-components'] = '^6.1.0';
    devDependencies['@types/styled-components'] = '^5.1.0';
  }

  // Backend dependencies
  if (techStack.backend === 'Express.js') {
    dependencies['express'] = '^4.18.0';
    dependencies['cors'] = '^2.8.5';
    devDependencies['@types/express'] = '^4.17.0';
    devDependencies['@types/cors'] = '^2.8.0';
    devDependencies['ts-node'] = '^10.9.0';
    devDependencies['nodemon'] = '^3.0.0';
  }

  // Database dependencies
  if (techStack.database === 'PostgreSQL') {
    if (techStack.backend === 'Express.js') {
      dependencies['pg'] = '^8.11.0';
      dependencies['dotenv'] = '^16.3.0';
    } else if (techStack.backend === 'FastAPI') {
      // Python dependencies handled in requirements.txt
    }
  } else if (techStack.database === 'MongoDB') {
    if (techStack.backend === 'Express.js') {
      dependencies['mongodb'] = '^6.3.0';
      dependencies['mongoose'] = '^8.0.0';
    }
  } else if (techStack.database === 'SQLite') {
    if (techStack.backend === 'Express.js') {
      dependencies['better-sqlite3'] = '^9.2.0';
    }
  }

  // Common dev dependencies
  devDependencies['eslint'] = '^9.0.0';
  devDependencies['prettier'] = '^3.0.0';

  return JSON.stringify({
    name: projectName.toLowerCase().replace(/\s+/g, '-'),
    version: '0.1.0',
    private: true,
    scripts: {
      dev: techStack.frontend === 'Next.js' ? 'next dev' : techStack.backend === 'Express.js' ? 'nodemon src/index.ts' : 'vite',
      build: techStack.frontend === 'Next.js' ? 'next build' : techStack.backend === 'Express.js' ? 'tsc' : 'vite build',
      start: techStack.frontend === 'Next.js' ? 'next start' : techStack.backend === 'Express.js' ? 'node dist/index.js' : 'vite preview',
      lint: 'eslint .',
    },
    dependencies,
    devDependencies,
  }, null, 2);
}

/**
 * Generate requirements.txt for Python projects
 */
export function generateRequirementsTxt(techStack: TechStackConfig): string {
  const requirements: string[] = [];

  if (techStack.backend === 'FastAPI') {
    requirements.push('fastapi==0.109.0');
    requirements.push('uvicorn[standard]==0.27.0');
    requirements.push('pydantic==2.5.0');
    requirements.push('python-multipart==0.0.6');
  } else if (techStack.backend === 'Django') {
    requirements.push('Django==5.0.0');
    requirements.push('djangorestframework==3.14.0');
  } else if (techStack.backend === 'Flask') {
    requirements.push('Flask==3.0.0');
    requirements.push('flask-cors==4.0.0');
  }

  if (techStack.database === 'PostgreSQL') {
    requirements.push('psycopg2-binary==2.9.9');
  } else if (techStack.database === 'SQLite') {
    // SQLite is built-in to Python
  }

  requirements.push('python-dotenv==1.0.0');

  return requirements.join('\n');
}

/**
 * Generate .gitignore based on tech stack
 */
export function generateGitignore(techStack: TechStackConfig): string {
  const ignores: string[] = [
    '# Dependencies',
    'node_modules/',
    '/dist/',
    '/build/',
    '.next/',
    '.out/',
    '',
    '# Environment variables',
    '.env',
    '.env.local',
    '.env.*.local',
    '',
    '# IDE',
    '.vscode/',
    '.idea/',
    '*.swp',
    '*.swo',
    '',
    '# OS',
    '.DS_Store',
    'Thumbs.db',
    '',
  ];

  if (techStack.language === 'Python' || techStack.backend === 'Django' || techStack.backend === 'Flask' || techStack.backend === 'FastAPI') {
    ignores.push(
      '',
      '# Python',
      '__pycache__/',
      '*.py[cod]',
      '*$py.class',
      '*.so',
      '.Python',
      'venv/',
      'env/',
      'ENV/',
      '.venv',
    );
  }

  if (techStack.frontend === 'Next.js' || techStack.frontend === 'React' || techStack.frontend === 'Vue.js') {
    ignores.push('', '# Testing', '/coverage', '', '# Misc', '*.log', '*.lock');
  }

  return ignores.join('\n');
}

/**
 * Generate README template
 */
export function generateReadme(
  techStack: TechStackConfig,
  projectName: string,
  summary: string
): string {
  const stackList = [
    techStack.frontend,
    techStack.backend,
    techStack.database,
    techStack.styling,
  ].filter(Boolean).join(', ');

  return `# ${projectName}

${summary}

## Tech Stack

${stackList}

## Getting Started

### Prerequisites

${techStack.language === 'Python' || techStack.backend === 'Django' || techStack.backend === 'Flask' || techStack.backend === 'FastAPI' 
  ? '- Python 3.10+\n- pip' 
  : '- Node.js 18+\n- npm or pnpm'}

### Installation

${techStack.language === 'Python' || techStack.backend === 'Django' || techStack.backend === 'Flask' || techStack.backend === 'FastAPI'
  ? '```bash\npip install -r requirements.txt\n```'
  : '```bash\nnpm install\n# or\npnpm install\n```'}

### Development

${techStack.language === 'Python' || techStack.backend === 'Django' || techStack.backend === 'Flask' || techStack.backend === 'FastAPI'
  ? '```bash\n# For FastAPI\nuvicorn main:app --reload\n\n# For Django\npython manage.py runserver\n\n# For Flask\nflask run\n```'
  : '```bash\nnpm run dev\n```'}

## Project Structure

\`\`\`
.
├── src/
├── public/
├── package.json
└── README.md
\`\`\`

## Features

- [ ] Feature 1
- [ ] Feature 2

## License

MIT
`;
}

/**
 * Convert tech stack config to formatted string
 */
export function formatTechStack(techStack: TechStackConfig): string {
  const parts: string[] = [];
  
  if (techStack.frontend) parts.push(techStack.frontend);
  if (techStack.backend) parts.push(techStack.backend);
  if (techStack.database) parts.push(techStack.database);
  if (techStack.styling) parts.push(techStack.styling);
  
  return parts.join(', ') || 'Custom Tech Stack';
}

