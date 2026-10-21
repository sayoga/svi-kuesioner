import { Suspense } from 'react';
import { connection } from 'next/server';
import { formsService } from '@/services/forms.service';
import { QuestionnaireBuilderView } from '@/components/QuestionnaireBuilderView';
import { FormBuilderSkeleton } from './loading';
import type { Metadata } from 'next';
import type { FormRecord } from '@/types/form';

export const metadata: Metadata = {
  title: 'Kelola Kuesioner | SHARING VISION™',
  description: 'Manajemen formulir survei dan pembuat pertanyaan dinamis',
};

interface PageProps {
  searchParams: Promise<{ formId?: string }>;
}

async function KuesionerPageContent({ searchParams }: PageProps) {
  await connection();
  const { formId } = await searchParams;

  let existingForm: FormRecord | null = null;
  if (formId) {
    try {
      existingForm = await formsService.getFormById(formId);
    } catch {
      existingForm = null;
    }
  }

  const selectedSurveyId = formId || 'new';

  return (
    <QuestionnaireBuilderView
      key={selectedSurveyId}
      surveyId={formId}
      initialData={existingForm}
      existingForm={existingForm}
    />
  );
}

export default function KuesionerPage({ searchParams }: PageProps) {
  return (
    <main className="p-4 sm:p-6 lg:p-8 max-w-5xl w-full mx-auto">
      <Suspense fallback={<FormBuilderSkeleton />}>
        <KuesionerPageContent searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
