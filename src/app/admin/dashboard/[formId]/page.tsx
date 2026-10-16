import { redirect } from 'next/navigation';

interface PageProps {
  params: Promise<{ formId: string }>;
}

export default async function LegacyDashboardPage({ params }: PageProps) {
  const { formId } = await params;
  redirect(`/admin/dashboard?formId=${formId}`);
}
