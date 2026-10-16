import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { formatFirebaseError } from '@/lib/firebase';
import { responsesService } from '@/services/responses.service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const formId = body.form_id || body.formId || '';

    const created = await responsesService.submitResponse(formId, body);

    return NextResponse.json(
      {
        message: 'Response successfully submitted',
        data: created,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          issues: error.issues.map((i) => ({
            field: i.path.join('.'),
            message: i.message,
          })),
        },
        { status: 400 }
      );
    }

    const formatted = formatFirebaseError(error);
    return NextResponse.json(
      { error: formatted.message, details: formatted.details },
      { status: formatted.status }
    );
  }
}
