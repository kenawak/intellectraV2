'use client';

import { UsersTable } from '@/components/admin/UsersTable';
import { usePostHog } from '@posthog/react';
import { useEffect } from 'react';

export default function AdminUsersPage() {
  const posthog = usePostHog();

  useEffect(() => {
    posthog?.capture('Admin User Action', {
      action: 'view_users',
    });
  }, [posthog]);

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Users Management</h1>
        <p className="text-muted-foreground">
          View and manage all platform users
        </p>
      </div>
      <UsersTable />
    </div>
  );
}

