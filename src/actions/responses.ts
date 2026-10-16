'use server';

import { revalidatePath } from 'next/cache';
import { ZodError } from 'zod';
import { formatFirebaseError } from '@/lib/firebase';
import { responsesService } from '@/services/responses.service';
import type { FormAnalytics, ResponseRecord, SubmitResponseInput } from '@/types/response';

export type ActionResponse<T> =
  | { success: true; data: T; message?: string }
  | { success: false; error: string; details?: unknown };

export async function submitResponseAction(
  formId: string,
  payload: Partial<SubmitResponseInput> & Record<string, unknown>
): Promise<ActionResponse<ResponseRecord>> {
  try {
    const created = await responsesService.submitResponse(formId, payload);

    // Revalidate analytics paths
    revalidatePath(`/analytics/${formId}`);
    revalidatePath(`/dashboard`);
    revalidatePath(`/forms/${formId}`);

    return {
      success: true,
      data: created,
      message: 'Response submitted successfully',
    };
  } catch (err) {
    if (err instanceof ZodError) {
      return {
        success: false,
        error: 'Validation failed',
        details: err.issues.map((i) => ({
          field: i.path.join('.'),
          message: i.message,
        })),
      };
    }

    const formatted = formatFirebaseError(err);
    return {
      success: false,
      error: formatted.message,
      details: formatted.details,
    };
  }
}

export async function getFormAnalyticsAction(
  formId: string
): Promise<ActionResponse<FormAnalytics>> {
  try {
    const analytics = await responsesService.getFormAnalytics(formId);
    return {
      success: true,
      data: analytics,
    };
  } catch (err) {
    const formatted = formatFirebaseError(err);
    return {
      success: false,
      error: formatted.message,
      details: formatted.details,
    };
  }
}

export async function getResponsesByFormAction(
  formId: string,
  page = 1,
  perPage = 50
) {
  try {
    const responses = await responsesService.getResponsesByForm(formId, page, perPage);
    return {
      success: true,
      data: responses,
    };
  } catch (err) {
    const formatted = formatFirebaseError(err);
    return {
      success: false,
      error: formatted.message,
      details: formatted.details,
    };
  }
}
