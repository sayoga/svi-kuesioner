import { NextRequest, NextResponse } from 'next/server';
import { formatFirebaseError } from '@/lib/firebase';
import { responsesService } from '@/services/responses.service';

interface RouteContext {
  params: Promise<{ formId: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const { formId } = await params;
    const analytics = await responsesService.getFormAnalytics(formId);

    return NextResponse.json({ data: analytics }, { status: 200 });
  } catch (error) {
    const formatted = formatFirebaseError(error);
    return NextResponse.json(
      { error: formatted.message, details: formatted.details },
      { status: formatted.status }
    );
  }
}
