'use client';

import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TechStackConfig } from '@/lib/tech-stack-generator';

interface TechStackBuilderProps {
  value: TechStackConfig;
  onChange: (stack: TechStackConfig) => void;
  className?: string;
}

const frontendOptions = [
  { value: 'Next.js', label: 'Next.js' },
  { value: 'React', label: 'React' },
  { value: 'Vue.js', label: 'Vue.js' },
  { value: 'Angular', label: 'Angular' },
  { value: 'Svelte', label: 'Svelte' },
  { value: 'None', label: 'Frontend not needed' },
];

const backendOptions = [
  { value: 'Express.js', label: 'Express.js (Node.js)' },
  { value: 'FastAPI', label: 'FastAPI (Python)' },
  { value: 'Django', label: 'Django (Python)' },
  { value: 'Flask', label: 'Flask (Python)' },
  { value: 'None', label: 'Backend not needed' },
];

const databaseOptions = [
  { value: 'PostgreSQL', label: 'PostgreSQL' },
  { value: 'MongoDB', label: 'MongoDB' },
  { value: 'SQLite', label: 'SQLite' },
  { value: 'MySQL', label: 'MySQL' },
  { value: 'Supabase', label: 'Supabase' },
  { value: 'None', label: 'No database' },
];

const stylingOptions = [
  { value: 'Tailwind CSS', label: 'Tailwind CSS' },
  { value: 'CSS Modules', label: 'CSS Modules' },
  { value: 'Styled Components', label: 'Styled Components' },
  { value: 'CSS', label: 'Vanilla CSS' },
  { value: 'None', label: 'No styling framework' },
];

const deploymentOptions = [
  { value: 'Vercel', label: 'Vercel' },
  { value: 'Netlify', label: 'Netlify' },
  { value: 'Railway', label: 'Railway' },
  { value: 'Self-hosted', label: 'Self-hosted' },
];

export function TechStackBuilder({ value, onChange, className }: TechStackBuilderProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleChange = (key: keyof TechStackConfig, selectedValue: string) => {
    const newStack = { ...value };
    if (selectedValue === 'None') {
      delete newStack[key];
    } else {
      newStack[key] = selectedValue;
    }
    onChange(newStack);
  };

  const getSummary = () => {
    const parts = [
      value.frontend,
      value.backend,
      value.database,
      value.styling,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'Select tech stack...';
  };

  return (
    <div className={className}>
      <div className="mb-4">
        <Label className="block text-sm font-medium mb-2">Tech Stack</Label>
        <div className="flex gap-2 items-center">
          <Select
            value={value.frontend || 'Select...'}
            onValueChange={(val) => handleChange('frontend', val)}
          >
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Frontend" />
            </SelectTrigger>
            <SelectContent>
              {frontendOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={value.backend || 'Select...'}
            onValueChange={(val) => handleChange('backend', val)}
          >
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Backend" />
            </SelectTrigger>
            <SelectContent>
              {backendOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={value.database || 'Select...'}
            onValueChange={(val) => handleChange('database', val)}
          >
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Database" />
            </SelectTrigger>
            <SelectContent>
              {databaseOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            type="button"
          >
            {isExpanded ? 'Less' : 'More'}
          </Button>
        </div>
      </div>

      {isExpanded && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-sm">Additional Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium mb-2">Styling Framework</Label>
              <Select
                value={value.styling || 'None'}
                onValueChange={(val) => handleChange('styling', val)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {stylingOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium mb-2">Deployment Platform</Label>
              <Select
                value={value.deployment || 'Select...'}
                onValueChange={(val) => handleChange('deployment', val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Optional" />
                </SelectTrigger>
                <SelectContent>
                  {deploymentOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="pt-2">
              <Label className="text-sm font-medium mb-2">Selected Stack</Label>
              <div className="flex flex-wrap gap-2">
                {value.frontend && <Badge variant="secondary">{value.frontend}</Badge>}
                {value.backend && <Badge variant="secondary">{value.backend}</Badge>}
                {value.database && <Badge variant="secondary">{value.database}</Badge>}
                {value.styling && <Badge variant="secondary">{value.styling}</Badge>}
                {value.deployment && <Badge variant="outline">{value.deployment}</Badge>}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!isExpanded && (
        <div className="mb-4">
          <p className="text-sm text-muted-foreground">
            Stack: <span className="font-medium">{getSummary()}</span>
          </p>
        </div>
      )}
    </div>
  );
}

