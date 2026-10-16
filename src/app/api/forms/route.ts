import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { formatFirebaseError } from '@/lib/firebase';
import { formsService } from '@/services/forms.service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const isLatestActive = searchParams.get('latestActive') === 'true';

    if (isLatestActive) {
      const activeForm = await formsService.getLatestActiveForm();
      if (!activeForm) {
        return NextResponse.json(
          { message: 'No active questionnaire form found' },
          { status: 404 }
        );
      }
      return NextResponse.json({ data: activeForm }, { status: 200 });
    }

    const page = parseInt(searchParams.get('page') || '1', 10);
    const perPage = parseInt(searchParams.get('perPage') || '50', 10);
    const search = searchParams.get('search') || undefined;
    const sort = searchParams.get('sort') || '-id';

    const isActiveParam = searchParams.get('isActive');
    const isActive =
      isActiveParam !== null ? isActiveParam === 'true' : undefined;

    const result = await formsService.getForms({
      page,
      perPage,
      isActive,
      sort,
      search,
    });

    return NextResponse.json(
      {
        page: result.page,
        perPage: result.perPage,
        totalItems: result.totalItems,
        totalPages: result.totalPages,
        items: result.items,
      },
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const created = await formsService.createForm(body);

    return NextResponse.json(
      {
        message: 'Form successfully created',
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
