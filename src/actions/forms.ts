'use server';

import { revalidatePath } from 'next/cache';
import { ZodError } from 'zod';
import { formatFirebaseError } from '@/lib/firebase';
import { formsService } from '@/services/forms.service';
import { logActivity } from '@/services/audit.service';
import type { CreateFormInput, FormListQueryParams, UpdateFormInput } from '@/types/form';

export type ActionResponse<T> =
  | { success: true; data: T; message?: string }
  | { success: false; error: string; details?: unknown };

export async function getFormsAction(params: FormListQueryParams = {}) {
  try {
    const list = await formsService.getForms(params);
    return { success: true as const, data: list };
  } catch (err) {
    const formatted = formatFirebaseError(err);
    return {
      success: false as const,
      error: formatted.message,
      details: formatted.details,
    };
  }
}

export async function getFormByIdAction(id: string) {
  try {
    const form = await formsService.getFormById(id);
    return { success: true as const, data: form };
  } catch (err) {
    const formatted = formatFirebaseError(err);
    return {
      success: false as const,
      error: formatted.message,
      details: formatted.details,
    };
  }
}

export async function createFormAction(input: CreateFormInput) {
  try {
    const created = await formsService.createForm(input);
    revalidatePath('/forms');
    revalidatePath('/dashboard');

    // Non-blocking background audit log
    void logActivity({
      action: 'CREATE_FORM',
      details: `Created new form: ${created.title}`,
    }).catch((logErr) => console.error('Audit log failed:', logErr));

    return {
      success: true as const,
      data: created,
      message: 'Form successfully created',
    };
  } catch (err) {
    if (err instanceof ZodError) {
      return {
        success: false as const,
        error: 'Validation failed',
        details: err.issues.map((i) => ({
          field: i.path.join('.'),
          message: i.message,
        })),
      };
    }
    const formatted = formatFirebaseError(err);
    return {
      success: false as const,
      error: formatted.message,
      details: formatted.details,
    };
  }
}

export async function updateFormAction(id: string, input: UpdateFormInput) {
  try {
    const updated = await formsService.updateForm(id, input);
    revalidatePath('/forms');
    revalidatePath(`/forms/${id}`);
    revalidatePath('/dashboard');

    // Non-blocking background audit log
    void logActivity({
      action: 'UPDATE_FORM',
      details: `Updated form: ${updated.title || id}`,
    }).catch((logErr) => console.error('Audit log failed:', logErr));

    return {
      success: true as const,
      data: updated,
      message: 'Form successfully updated',
    };
  } catch (err) {
    if (err instanceof ZodError) {
      return {
        success: false as const,
        error: 'Validation failed',
        details: err.issues.map((i) => ({
          field: i.path.join('.'),
          message: i.message,
        })),
      };
    }
    const formatted = formatFirebaseError(err);
    return {
      success: false as const,
      error: formatted.message,
      details: formatted.details,
    };
  }
}

export async function deleteFormAction(id: string) {
  try {
    let formTitle = id;
    try {
      const existing = await formsService.getFormById(id);
      if (existing?.title) formTitle = existing.title;
    } catch {
      // ignore
    }

    await formsService.deleteForm(id);
    revalidatePath('/forms');
    revalidatePath('/dashboard');

    // Non-blocking background audit log
    void logActivity({
      action: 'DELETE_FORM',
      details: `Deleted form: ${formTitle} (ID: ${id})`,
    }).catch((logErr) => console.error('Audit log failed:', logErr));

    return {
      success: true as const,
      data: null,
      message: 'Form successfully deleted',
    };
  } catch (err) {
    const formatted = formatFirebaseError(err);
    return {
      success: false as const,
      error: formatted.message,
      details: formatted.details,
    };
  }
}

export async function toggleFormStatusAction(id: string, isActive: boolean) {
  try {
    const updated = await formsService.setFormStatus(id, isActive);
    revalidatePath('/forms');
    revalidatePath('/dashboard');

    const statusLabel = isActive ? 'Active' : 'Inactive';
    // Non-blocking background audit log
    void logActivity({
      action: 'CHANGE_FORM_STATUS',
      details: `Changed status to ${statusLabel} for form: ${updated.title || id}`,
    }).catch((logErr) => console.error('Audit log failed:', logErr));

    return {
      success: true as const,
      data: updated,
      message: `Form ${isActive ? 'activated' : 'deactivated'} successfully`,
    };
  } catch (err) {
    const formatted = formatFirebaseError(err);
    return {
      success: false as const,
      error: formatted.message,
      details: formatted.details,
    };
  }
}

