'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { IconKey, IconCheck, IconX, IconLoader2, IconEye, IconEyeOff } from '@tabler/icons-react';
import { toast } from 'sonner';

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [hasKey, setHasKey] = useState(false);
  const [maskedKey, setMaskedKey] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch current API key status
    const fetchKeyStatus = async () => {
      try {
        const res = await fetch('/api/settings/gemini-api-key');
        if (res.ok) {
          const data = await res.json();
          setHasKey(data.hasKey || false);
          setMaskedKey(data.masked || '');
        }
      } catch (err) {
        console.error('Failed to fetch API key status:', err);
      }
    };
    fetchKeyStatus();
  }, []);

  const handleSave = async () => {
    if (!apiKey.trim()) {
      setError('API key is required');
      return;
    }

    setError(null);
    setValidating(true);
    setLoading(true);

    try {
      const res = await fetch('/api/settings/gemini-api-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to save API key');
        toast.error(data.error || 'Failed to save API key');
        return;
      }

      // Success
      setApiKey('');
      setHasKey(true);
      setMaskedKey(data.masked);
      toast.success('API key saved and validated successfully!');
    } catch (err) {
      setError('Network error. Please try again.');
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
      setValidating(false);
    }
  };

  const handleRemove = async () => {
    if (!confirm('Are you sure you want to remove your API key? You will need to add it again to continue using the workspace feature after your free daily limit.')) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/settings/gemini-api-key', {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Failed to remove API key');
      }

      setHasKey(false);
      setMaskedKey('');
      toast.success('API key removed successfully');
    } catch (err) {
      toast.error('Failed to remove API key');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your API keys and preferences
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <IconKey className="h-5 w-5" />
            <CardTitle>Gemini API Key</CardTitle>
          </div>
          <CardDescription>
            Add your own Gemini API key to use the workspace feature beyond the free daily limit (3 uses per day).
            Your key is encrypted and stored securely. We validate it before saving.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {hasKey && (
            <Alert>
              <IconCheck className="h-4 w-4" />
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <span>
                    API key is configured: <Badge variant="outline" className="font-mono ml-2">{maskedKey}</Badge>
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRemove}
                    disabled={loading}
                  >
                    Remove
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {!hasKey && (
            <div className="space-y-2">
              <Label htmlFor="api-key">Gemini API Key</Label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Input
                    id="api-key"
                    type={showApiKey ? 'text' : 'password'}
                    placeholder="Enter your Gemini API key (e.g., AIza...)"
                    value={apiKey}
                    onChange={(e) => {
                      setApiKey(e.target.value);
                      setError(null);
                    }}
                    disabled={loading || validating}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowApiKey(!showApiKey)}
                    disabled={loading || validating}
                  >
                    {showApiKey ? (
                      <IconEyeOff className="h-4 w-4" />
                    ) : (
                      <IconEye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <Button
                  onClick={handleSave}
                  disabled={loading || validating || !apiKey.trim()}
                >
                  {validating ? (
                    <>
                      <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
                      Validating...
                    </>
                  ) : (
                    <>
                      <IconCheck className="h-4 w-4 mr-2" />
                      Save & Validate
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Get your API key from{' '}
                <a
                  href="https://aistudio.google.com/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Google AI Studio
                </a>
                . Your key will be encrypted and validated before saving.
              </p>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <IconX className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="pt-4 border-t">
            <h4 className="text-sm font-semibold mb-2">Free Usage Limits</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• 3 free spec generations per day without an API key</li>
              <li>• After the free limit, you must add your own Gemini API key to continue</li>
              <li>• With your own API key, usage is only limited by your Gemini API quota</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

