import { redirect } from 'next/navigation';
import { getRoleHomePath } from '@/lib/routes';
import { tryGetServerSession } from '@/lib/server-auth';

export default async function HomePage() {
  const session = await tryGetServerSession();
  redirect(session ? getRoleHomePath(session.user.role) : '/login');
}
