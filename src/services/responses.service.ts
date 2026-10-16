import {
  collection,
  getDocs,
  addDoc,
  query,
  where,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { submitResponseSchema } from '@/lib/schemas/response.schema';
import { formsService } from '@/services/forms.service';
import type {
  AnswerValue,
  FormAnalytics,
  QuestionAnalytics,
  ResponseRecord,
  SubmitResponseInput,
} from '@/types/response';

export const RESPONSES_COLLECTION = 'responses';

export class ResponsesService {
  /**
   * Submits a respondent's answers for a given form
   */
  async submitResponse(
    formId: string,
    payload: Partial<SubmitResponseInput> & Record<string, unknown>
  ): Promise<ResponseRecord> {
    // Normalize payload to ensure form_id is correctly assigned
    const normalizedInput = {
      form_id: formId || (payload.form_id as string) || (payload.formId as string),
      respondent_name:
        (payload.respondent_name as string) ||
        (payload.respondentName as string) ||
        'Anonymous',
      answers: (payload.answers as Record<string, AnswerValue>) || {},
    };

    // Validate with Zod
    const validatedData = submitResponseSchema.parse(normalizedInput);

    // Verify form exists and is active
    const form = await formsService.getFormById(validatedData.form_id);
    if (!form) {
      throw new Error(`Form with ID '${validatedData.form_id}' not found`);
    }

    if (!form.is_active) {
      throw new Error('Mohon maaf, kuesioner ini sudah tidak aktif atau ditutup.');
    }

    const nowIso = new Date().toISOString();
    const docPayload = {
      form_id: validatedData.form_id,
      relation: validatedData.form_id,
      respondent_name: validatedData.respondent_name,
      answers: {
        ...validatedData.answers,
        _submitted_at: nowIso,
      },
      created: nowIso,
      updated: nowIso,
    };

    const docRef = await addDoc(
      collection(db, RESPONSES_COLLECTION),
      docPayload
    );

    return {
      id: docRef.id,
      collectionId: RESPONSES_COLLECTION,
      collectionName: RESPONSES_COLLECTION,
      ...docPayload,
    } as ResponseRecord;
  }

  /**
   * Fetches all responses for a form (paginated)
   */
  async getResponsesByForm(formId: string, page = 1, perPage = 100) {
    const responsesRef = collection(db, RESPONSES_COLLECTION);
    const q = query(responsesRef, where('form_id', '==', formId));

    let querySnapshot = await getDocs(q);

    // Fallback if responses were stored with 'relation'
    if (querySnapshot.empty) {
      const fallbackQ = query(responsesRef, where('relation', '==', formId));
      querySnapshot = await getDocs(fallbackQ);
    }

    const items: ResponseRecord[] = querySnapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      const createdTime =
        data.created ||
        (data.answers?._submitted_at as string) ||
        '';

      return {
        id: docSnap.id,
        collectionId: RESPONSES_COLLECTION,
        collectionName: RESPONSES_COLLECTION,
        created: createdTime,
        updated: data.updated || '',
        form_id: data.form_id || data.relation || formId,
        respondent_name: data.respondent_name || 'Anonymous',
        answers: data.answers || {},
        ...data,
      } as ResponseRecord;
    });

    // Sort newest first
    items.sort((a, b) => (b.created || b.id).localeCompare(a.created || a.id));

    const totalItems = items.length;
    const totalPages = Math.ceil(totalItems / perPage) || 1;
    const paginatedItems = items.slice((page - 1) * perPage, page * perPage);

    return {
      page,
      perPage,
      totalItems,
      totalPages,
      items: paginatedItems,
    };
  }

  /**
   * Aggregates responses and builds chart-ready analytics data
   */
  async getFormAnalytics(formId: string): Promise<FormAnalytics> {
    // 1. Fetch form definition to know question schema and option labels
    const form = await formsService.getFormById(formId);
    if (!form) {
      throw new Error(`Form with ID '${formId}' not found`);
    }

    // 2. Fetch all responses for this form
    const responsesRef = collection(db, RESPONSES_COLLECTION);
    const q = query(responsesRef, where('form_id', '==', formId));

    let querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      const fallbackQ = query(responsesRef, where('relation', '==', formId));
      querySnapshot = await getDocs(fallbackQ);
    }

    const responses: ResponseRecord[] = querySnapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      const createdTime =
        data.created ||
        (data.answers?._submitted_at as string) ||
        '';

      return {
        id: docSnap.id,
        collectionId: RESPONSES_COLLECTION,
        collectionName: RESPONSES_COLLECTION,
        created: createdTime,
        updated: data.updated || '',
        form_id: data.form_id || data.relation || formId,
        respondent_name: data.respondent_name || 'Anonymous',
        answers: data.answers || {},
        ...data,
      } as ResponseRecord;
    });

    // Sort newest first
    responses.sort((a, b) => (b.created || b.id).localeCompare(a.created || a.id));

    const totalResponses = responses.length;
    const lastResponseAt =
      totalResponses > 0 ? responses[0].created || null : null;

    // 3. Reduce answers into chart-friendly summaries
    const summary: Record<string, Record<string, number>> = {};
    const questionAnalyticsList: QuestionAnalytics[] = [];

    for (const qDef of form.questions) {
      const isChoiceType = ['radio', 'checkbox', 'dropdown'].includes(qDef.type);

      if (isChoiceType) {
        // Initialize counts with 0 for all defined options to prevent missing zero-count categories
        const counts: Record<string, number> = {};
        if (Array.isArray(qDef.options)) {
          for (const opt of qDef.options) {
            counts[opt] = 0;
          }
        }

        let answeredCount = 0;

        for (const resp of responses) {
          const rawAnswer = resp.answers?.[qDef.q_id];
          if (rawAnswer === undefined || rawAnswer === null || rawAnswer === '') {
            continue;
          }

          answeredCount++;

          if (Array.isArray(rawAnswer)) {
            // Checkbox multi-select response
            for (const item of rawAnswer) {
              const val = String(item).trim();
              if (val) {
                counts[val] = (counts[val] || 0) + 1;
              }
            }
          } else {
            // Radio or dropdown single select response
            const val = String(rawAnswer).trim();
            if (val) {
              counts[val] = (counts[val] || 0) + 1;
            }
          }
        }

        // Store in summary keyed by q_id
        summary[qDef.q_id] = counts;

        questionAnalyticsList.push({
          q_id: qDef.q_id,
          label: qDef.label,
          type: qDef.type,
          totalAnswered: answeredCount,
          optionsCount: counts,
        });
      } else {
        // Free-text or textarea questions
        const textAnswers: string[] = [];
        let answeredCount = 0;

        for (const resp of responses) {
          const rawAnswer = resp.answers?.[qDef.q_id];
          if (rawAnswer !== undefined && rawAnswer !== null) {
            const str = String(rawAnswer).trim();
            if (str.length > 0) {
              answeredCount++;
              textAnswers.push(str);
            }
          }
        }

        questionAnalyticsList.push({
          q_id: qDef.q_id,
          label: qDef.label,
          type: qDef.type,
          totalAnswered: answeredCount,
          textAnswers,
        });
      }
    }

    return {
      formId: form.id,
      formTitle: form.title,
      formCreatedAt: form.created || null,
      totalResponses,
      summary,
      questions: questionAnalyticsList,
      lastResponseAt,
      rawResponses: responses,
    };
  }
}

export const responsesService = new ResponsesService();
