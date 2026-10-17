import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { formatFirebaseError } from '@/lib/firebase';
import { formsService } from '@/services/forms.service';
import { logActivity } from '@/services/audit.service';

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

    // Non-blocking background audit log
    const isStatusChangeOnly =
      Object.keys(body).length === 1 && typeof body.is_active === 'boolean';
    if (isStatusChangeOnly) {
      const statusLabel = body.is_active ? 'Active' : 'Inactive';
      void logActivity({
        action: 'CHANGE_FORM_STATUS',
        details: `Changed status to ${statusLabel} for form: ${updated.title || id}`,
      }).catch((err) => console.error('Audit log failed:', err));
    } else {
      void logActivity({
        action: 'UPDATE_FORM',
        details: `Updated form: ${updated.title || id}`,
      }).catch((err) => console.error('Audit log failed:', err));
    }

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

    let formTitle = id;
    try {
      const existing = await formsService.getFormById(id);
      if (existing?.title) formTitle = existing.title;
    } catch {
      // ignore
    }

    await formsService.deleteForm(id);

    // Non-blocking background audit log
    void logActivity({
      action: 'DELETE_FORM',
      details: `Deleted form: ${formTitle} (ID: ${id})`,
    }).catch((err) => console.error('Audit log failed:', err));

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
