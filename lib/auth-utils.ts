import { auth } from './auth';
import { NextRequest } from 'next/server';

export async function getSession(req: NextRequest) {
  return await auth.api.getSession({ headers: req.headers });
}

export async function getUser(req: NextRequest) {
  const session = await getSession(req);
  return session?.user;
}

export async function requireAuth(req: NextRequest) {
  const session = await getSession(req);
  if (!session) {
    throw new Error('Unauthorized');
  }
  return session;
}

export async function optionalAuth(req: NextRequest) {
  const session = await getSession(req);
  return session;
}

export async function requireAdmin(req: NextRequest) {
  const session = await requireAuth(req);
  if (session.user.role !== 'admin') {
    throw new Error('Forbidden');
  }
  return session;
}