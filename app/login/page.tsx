import { LoginForm } from '@/components/login-form';
import { getCampuses } from '@/lib/campuses';

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  const campuses = await getCampuses();
  return (
    <LoginForm
      campuses={campuses.map((campus) => ({
        id: campus.id,
        name: campus.name,
        services: campus.services.map((service) => service.name),
      }))}
    />
  );
}
