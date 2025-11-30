'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { Loader2 } from 'lucide-react';

const ADMIN_USER_ID = 'OMp4mdqfTj4U1jFUHTJO4eXbtjyafCz3';

interface AdminGuardProps {
  children: React.ReactNode;
}

/**
 * AdminGuard Component
 * 
 * Protects admin routes - only allows admin user ID
 */
export function AdminGuard({ children }: AdminGuardProps) {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (isPending) return;

    if (!session?.user) {
      router.push('/login');
      return;
    }

    if (session.user.id !== ADMIN_USER_ID) {
      router.push('/unauthorized');
      return;
    }
  }, [session, isPending, router]);

  if (isPending) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session?.user || session.user.id !== ADMIN_USER_ID) {
    return null; // Will redirect in useEffect
  }

  return <>{children}</>;
}

