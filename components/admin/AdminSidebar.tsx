'use client';

import * as React from 'react';
import {
  IconUsers,
  IconChartBar,
  IconBookmark,
  IconBulb,
  IconShield,
} from '@tabler/icons-react';
import { NavMain } from '@/components/nav-main';

const adminNavItems = [
  {
    title: 'Admin Dashboard',
    url: '/dashboard/admin',
    icon: IconShield,
  },
  {
    title: 'Users',
    url: '/dashboard/admin/users',
    icon: IconUsers,
  },
  {
    title: 'Analytics',
    url: '/dashboard/admin/analytics',
    icon: IconChartBar,
  },
];

export function AdminSidebar() {
  return (
    <div className="mt-8 pt-8 border-t">
      <div className="px-3 mb-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Admin
        </p>
      </div>
      <NavMain items={adminNavItems} />
    </div>
  );
}

