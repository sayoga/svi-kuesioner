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

    // Server-side save via Firebase Admin SDK
    if (typeof window === 'undefined') {
      try {
        const { adminDb } = await import('@/lib/firebase-admin');
        const ref = await adminDb.collection(RESPONSES_COLLECTION).add(docPayload);
        return {
          id: ref.id,
          collectionId: RESPONSES_COLLECTION,
          collectionName: RESPONSES_COLLECTION,
          ...docPayload,
        } as ResponseRecord;
      } catch (adminErr) {
        console.warn('[ResponsesService] Admin submitResponse failed, fallback to client SDK:', adminErr);
      }
    }

    if (db) {
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

    throw new Error('Database connection is not available');
  }

  /**
   * Fetches all responses for a form (paginated)
   */
  async getResponsesByForm(formId: string, page = 1, perPage = 100) {
    let items: ResponseRecord[] = [];

    // Server-side fetch via Firebase Admin SDK
    if (typeof window === 'undefined') {
      try {
        const { adminDb } = await import('@/lib/firebase-admin');
        const snap = await adminDb
          .collection(RESPONSES_COLLECTION)
          .where('form_id', '==', formId)
          .get();
        let docs = snap.docs;
        if (docs.length === 0) {
          const fallbackSnap = await adminDb
            .collection(RESPONSES_COLLECTION)
            .where('relation', '==', formId)
            .get();
          docs = fallbackSnap.docs;
        }
        if (docs.length === 0) {
          const fallbackSurveyIdSnap = await adminDb
            .collection(RESPONSES_COLLECTION)
            .where('surveyId', '==', formId)
            .get();
          docs = fallbackSurveyIdSnap.docs;
        }

        items = docs.map((docSnap) => {
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
            respondent_name: data.respondent_name || data.respondentName || 'Anonymous',
            answers: data.answers || {},
            ...data,
          } as ResponseRecord;
        });
      } catch (adminErr) {
        console.warn('[ResponsesService] Admin getResponsesByForm failed, fallback to client SDK:', adminErr);
      }
    }

    // Client-side fetch or fallback
    if (items.length === 0 && db) {
      try {
        const responsesRef = collection(db, RESPONSES_COLLECTION);
        const q = query(responsesRef, where('form_id', '==', formId));

        let querySnapshot = await getDocs(q);

        // Fallback if responses were stored with 'relation'
        if (querySnapshot.empty) {
          const fallbackQ = query(responsesRef, where('relation', '==', formId));
          querySnapshot = await getDocs(fallbackQ);
        }
        if (querySnapshot.empty) {
          const fallbackQ2 = query(responsesRef, where('surveyId', '==', formId));
          querySnapshot = await getDocs(fallbackQ2);
        }

        items = querySnapshot.docs.map((docSnap) => {
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
            respondent_name: data.respondent_name || data.respondentName || 'Anonymous',
            answers: data.answers || {},
            ...data,
          } as ResponseRecord;
        });
      } catch (clientErr) {
        console.warn('[ResponsesService] Client getDocs failed:', clientErr);
      }
    }

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
    let responses: ResponseRecord[] = [];

    // Server-side fetch via Firebase Admin SDK
    if (typeof window === 'undefined') {
      try {
        const { adminDb } = await import('@/lib/firebase-admin');
        const snap = await adminDb
          .collection(RESPONSES_COLLECTION)
          .where('form_id', '==', formId)
          .get();
        let docs = snap.docs;
        if (docs.length === 0) {
          const fallbackSnap = await adminDb
            .collection(RESPONSES_COLLECTION)
            .where('relation', '==', formId)
            .get();
          docs = fallbackSnap.docs;
        }
        if (docs.length === 0) {
          const fallbackSurveyIdSnap = await adminDb
            .collection(RESPONSES_COLLECTION)
            .where('surveyId', '==', formId)
            .get();
          docs = fallbackSurveyIdSnap.docs;
        }

        responses = docs.map((docSnap) => {
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
            respondent_name: data.respondent_name || data.respondentName || 'Anonymous',
            answers: data.answers || {},
            ...data,
          } as ResponseRecord;
        });
      } catch (adminErr) {
        console.warn('[ResponsesService] Admin getFormAnalytics failed, fallback to client SDK:', adminErr);
      }
    }

    // Client-side fetch or server fallback via Client SDK
    if (responses.length === 0 && db) {
      try {
        const responsesRef = collection(db, RESPONSES_COLLECTION);
        const q = query(responsesRef, where('form_id', '==', formId));

        let querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
          const fallbackQ = query(responsesRef, where('relation', '==', formId));
          querySnapshot = await getDocs(fallbackQ);
        }
        if (querySnapshot.empty) {
          const fallbackQ2 = query(responsesRef, where('surveyId', '==', formId));
          querySnapshot = await getDocs(fallbackQ2);
        }

        responses = querySnapshot.docs.map((docSnap) => {
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
            respondent_name: data.respondent_name || data.respondentName || 'Anonymous',
            answers: data.answers || {},
            ...data,
          } as ResponseRecord;
        });
      } catch (clientErr) {
        console.warn('[ResponsesService] Client getDocs failed:', clientErr);
      }
    }

    // Sort newest first
    responses.sort((a, b) => (b.created || b.id).localeCompare(a.created || a.id));

    const totalResponses = responses.length;
    const lastResponseAt =
      totalResponses > 0 ? responses[0].created || null : null;

    // 3. Reduce answers into chart-friendly summaries
    // 3. Reduce answers into chart-friendly summaries
    const summary: Record<string, Record<string, number>> = {};
    const questionAnalyticsList: QuestionAnalytics[] = [];

    // Ekstrak dari modules jika ada, jika tidak, gunakan array questions lama
    const allQuestions =
      form.modules && form.modules.length > 0
        ? form.modules.flatMap((module) => module.questions || [])
        : (form.questions || []);

    for (const qDef of allQuestions) {
      const q_id = (qDef as any).id || (qDef as any).q_id || '';
      const label = (qDef as any).text || (qDef as any).label || (qDef as any).code || q_id;
      const isChoiceType = ['radio', 'checkbox', 'dropdown'].includes(qDef.type);

      if (isChoiceType) {
        // Initialize counts with 0 for all defined options to prevent missing zero-count categories
        const counts: Record<string, number> = {};
        const valueToLabelMap: Record<string, string> = {};

        if (Array.isArray(qDef.options)) {
          for (const opt of qDef.options) {
            if (typeof opt === 'string') {
              valueToLabelMap[opt] = opt;
              counts[opt] = 0;
            } else if (opt && typeof opt === 'object') {
              const optVal = String((opt as any).value);
              const optLabel = (opt as any).label || optVal;
              valueToLabelMap[optVal] = optLabel;
              counts[optLabel] = 0;
            }
          }
        }

        let answeredCount = 0;

        for (const resp of responses) {
          const rawAnswer = resp.answers?.[q_id];
          if (rawAnswer === undefined || rawAnswer === null || rawAnswer === '') {
            continue;
          }

          answeredCount++;

          if (Array.isArray(rawAnswer)) {
            // Checkbox multi-select response
            for (const item of rawAnswer) {
              const val = String(item).trim();
              if (val) {
                const optLabel = valueToLabelMap[val] || val;
                counts[optLabel] = (counts[optLabel] || 0) + 1;
              }
            }
          } else {
            // Radio or dropdown single select response
            const val = String(rawAnswer).trim();
            if (val) {
              const optLabel = valueToLabelMap[val] || val;
              counts[optLabel] = (counts[optLabel] || 0) + 1;
            }
          }
        }

        // Store in summary keyed by q_id
        summary[q_id] = counts;

        questionAnalyticsList.push({
          q_id,
          label,
          type: qDef.type as any,
          totalAnswered: answeredCount,
          optionsCount: counts,
        });
      } else {
        // Free-text, textarea, or number questions
        const textAnswers: string[] = [];
        let answeredCount = 0;

        for (const resp of responses) {
          const rawAnswer = resp.answers?.[q_id];
          if (rawAnswer !== undefined && rawAnswer !== null) {
            const str = String(rawAnswer).trim();
            if (str.length > 0) {
              answeredCount++;
              textAnswers.push(str);
            }
          }
        }

        questionAnalyticsList.push({
          q_id,
          label,
          type: qDef.type as any,
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
