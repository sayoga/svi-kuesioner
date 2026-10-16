import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { formatFirebaseError } from '@/lib/firebase';
import { formsService } from '@/services/forms.service';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const form = await formsService.getFormById(id);

    return NextResponse.json({ data: form }, { status: 200 });
  } catch (error) {
    const formatted = formatFirebaseError(error);
    return NextResponse.json(
      { error: formatted.message, details: formatted.details },
      { status: formatted.status }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const body = await request.json();
    const updated = await formsService.updateForm(id, body);

    return NextResponse.json(
      {
        message: 'Form successfully updated',
        data: updated,
      },
      { status: 200 }
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

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    await formsService.deleteForm(id);

    return NextResponse.json(
      { message: 'Form successfully deleted' },
      { status: 200 }
    );
  } catch (error) {
    const formatted = formatFirebaseError(error);
    return NextResponse.json(
      { error: formatted.message, details: formatted.details },
      { status: formatted.status }
    );
  }
}
