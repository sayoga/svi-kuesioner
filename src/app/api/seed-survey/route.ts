import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import surveyData from '@/data/bri-survey.json';

export async function GET() {
  try {
    const nowIso = new Date().toISOString();

    await adminDb.collection('forms').doc('survey-umkm-bri').set({
      ...surveyData,
      id: 'survey-umkm-bri',
      createdAt: nowIso,
      updatedAt: nowIso,
      created: nowIso,
      updated: nowIso,
      isActive: true,
      is_active: true,
    });

    return NextResponse.json({
      success: true,
      message: 'Survey data seeded successfully!',
      surveyId: 'survey-umkm-bri',
      title: surveyData.title,
      modulesCount: surveyData.modules?.length ?? 0,
    });
  } catch (error) {
    console.error('Error seeding survey:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to seed survey data',
      },
      { status: 500 }
    );
  }
}
