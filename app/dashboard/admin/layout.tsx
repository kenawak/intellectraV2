import { Metadata } from 'next';
import { AdminGuard } from '@/components/admin/AdminGuard';

export const metadata: Metadata = {
  title: 'Admin Dashboard | Intellectra',
  description: 'Admin dashboard for managing users and analytics',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminGuard>
      {children}
    </AdminGuard>
  );
}

