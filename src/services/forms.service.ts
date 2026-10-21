import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  createFormSchema,
  updateFormSchema,
} from '@/lib/schemas/form.schema';
import type {
  CreateFormInput,
  FormListQueryParams,
  FormRecord,
  UpdateFormInput,
} from '@/types/form';

export const FORMS_COLLECTION = 'forms';

export class FormsService {
  /**
   * Retrieves a paginated list of forms with optional filtering
   */
  async getForms(params: FormListQueryParams = {}) {
    const {
      page = 1,
      perPage = 50,
      isActive,
      sort = '-id',
      search,
    } = params;

    let items: FormRecord[] = [];

    // 1. Server-side fetch via Firebase Admin SDK
    if (typeof window === 'undefined') {
      try {
        const { adminDb } = await import('@/lib/firebase-admin');
        const snap = await adminDb.collection(FORMS_COLLECTION).get();
        if (!snap.empty) {
          items = snap.docs.map((docSnap) => {
            const data = docSnap.data();
            const is_active = Boolean(data.is_active ?? data.isActive ?? true);
            return {
              id: docSnap.id,
              collectionId: FORMS_COLLECTION,
              collectionName: FORMS_COLLECTION,
              created: data.created || data.createdAt || new Date().toISOString(),
              updated: data.updated || data.updatedAt || new Date().toISOString(),
              title: data.title || '',
              description: data.description || '',
              is_active,
              isActive: is_active,
              questions: data.questions || [],
              modules: data.modules || [],
              ...data,
            } as FormRecord;
          });
        }
      } catch (adminErr) {
        console.warn('[FormsService] Server-side adminDb getForms failed, will try client SDK:', adminErr);
      }
    }

    // 2. Client-side fetch or server fallback via Client SDK
    if (items.length === 0 && db) {
      try {
        const formsRef = collection(db, FORMS_COLLECTION);
        const querySnapshot = await getDocs(formsRef);

        items = querySnapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          const is_active = Boolean(data.is_active ?? data.isActive ?? true);
          return {
            id: docSnap.id,
            collectionId: FORMS_COLLECTION,
            collectionName: FORMS_COLLECTION,
            created: data.created || data.createdAt || new Date().toISOString(),
            updated: data.updated || data.updatedAt || new Date().toISOString(),
            title: data.title || '',
            description: data.description || '',
            is_active,
            isActive: is_active,
            questions: data.questions || [],
            modules: data.modules || [],
            ...data,
          } as FormRecord;
        });
      } catch (clientErr) {
        console.warn('[FormsService] Client getDocs failed:', clientErr);
      }
    }

    // 3. Fallback: ensure survey-umkm-bri is present if missing
    if (!items.some((f) => f.id === 'survey-umkm-bri')) {
      try {
        const briSurvey = await import('@/data/bri-survey.json');
        items.push({
          id: 'survey-umkm-bri',
          collectionId: FORMS_COLLECTION,
          collectionName: FORMS_COLLECTION,
          created: new Date().toISOString(),
          updated: new Date().toISOString(),
          title: briSurvey.title || 'Kuesioner Survei Layanan UMKM BRI',
          description: briSurvey.description || '',
          is_active: true,
          isActive: true,
          questions: [],
          modules: (briSurvey.modules as unknown as FormRecord['modules']) || [],
          version: briSurvey.version,
        } as FormRecord);
      } catch {
        // ignore
      }
    }

    // 4. In-memory filter for active status (matches both isActive and is_active)
    if (typeof isActive === 'boolean') {
      items = items.filter((form) => {
        const active = Boolean(
          form.is_active ?? (form as unknown as Record<string, unknown>).isActive ?? true
        );
        return active === isActive;
      });
    }

    // 5. In-memory filter for search query
    if (search && search.trim().length > 0) {
      const lowerSearch = search.toLowerCase().trim();
      items = items.filter(
        (form) =>
          form.title?.toLowerCase().includes(lowerSearch) ||
          form.description?.toLowerCase().includes(lowerSearch)
      );
    }

    // 6. Sort items
    items.sort((a, b) => {
      const aRec = a as unknown as Record<string, unknown>;
      const bRec = b as unknown as Record<string, unknown>;
      if (sort.startsWith('-')) {
        const field = sort.slice(1);
        if (field === 'created' || field === 'id') {
          return (b.created || b.id).localeCompare(a.created || a.id);
        }
        return String(bRec[field] ?? '').localeCompare(String(aRec[field] ?? ''));
      } else {
        const field = sort;
        if (field === 'created' || field === 'id') {
          return (a.created || a.id).localeCompare(b.created || b.id);
        }
        return String(aRec[field] ?? '').localeCompare(String(bRec[field] ?? ''));
      }
    });

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
   * Retrieves a single form by its ID
   */
  async getFormById(id: string): Promise<FormRecord> {
    // 1. Server-side using Firebase Admin SDK
    if (typeof window === 'undefined') {
      try {
        const { adminDb } = await import('@/lib/firebase-admin');
        if (adminDb) {
          const snap = await adminDb.collection(FORMS_COLLECTION).doc(id).get();
          if (snap.exists) {
            const data = snap.data() || {};
            return {
              id: snap.id,
              collectionId: FORMS_COLLECTION,
              collectionName: FORMS_COLLECTION,
              created: data.created || new Date().toISOString(),
              updated: data.updated || new Date().toISOString(),
              title: data.title || '',
              description: data.description || '',
              is_active: data.is_active ?? true,
              questions: data.questions || [],
              modules: data.modules || [],
              ...data,
            } as FormRecord;
          }
        }
      } catch (adminErr) {
        console.warn(`[FormsService] Admin getDoc for form ${id} failed:`, adminErr);
      }
    }

    // 2. Client-side using Firebase Client SDK
    if (typeof window !== 'undefined' && db) {
      try {
        const docRef = doc(db, FORMS_COLLECTION, id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            collectionId: FORMS_COLLECTION,
            collectionName: FORMS_COLLECTION,
            created: data.created || new Date().toISOString(),
            updated: data.updated || new Date().toISOString(),
            title: data.title || '',
            description: data.description || '',
            is_active: data.is_active ?? true,
            questions: data.questions || [],
            modules: data.modules || [],
            ...data,
          } as FormRecord;
        }
      } catch (clientErr) {
        console.warn(`[FormsService] Client getDoc for form ${id} failed:`, clientErr);
      }
    }

    // 3. Local JSON fallback if id is survey-umkm-bri
    if (id === 'survey-umkm-bri') {
      try {
        const surveyData = await import('@/data/bri-survey.json');
        return {
          id: 'survey-umkm-bri',
          collectionId: FORMS_COLLECTION,
          collectionName: FORMS_COLLECTION,
          created: new Date().toISOString(),
          updated: new Date().toISOString(),
          title: surveyData.title,
          description: surveyData.description || '',
          is_active: true,
          questions: [],
          modules: (surveyData.modules as unknown as FormRecord['modules']) || [],
          version: surveyData.version,
        } as FormRecord;
      } catch (jsonErr) {
        console.error('[FormsService] Local JSON fallback failed:', jsonErr);
      }
    }

    throw new Error(`Form with ID '${id}' not found`);
  }

  /**
   * Retrieves the latest active form for respondent presentation
   */
  async getLatestActiveForm(): Promise<FormRecord | null> {
    try {
      const res = await this.getForms({ isActive: true, perPage: 1 });
      return res.items[0] || null;
    } catch {
      return null;
    }
  }

  /**
   * Validates and creates a new form record
   */
  async createForm(data: CreateFormInput): Promise<FormRecord> {
    // Validate schema
    const validatedData = createFormSchema.parse(data);
    const nowIso = new Date().toISOString();

    const formPayload = {
      ...validatedData,
      is_active: validatedData.is_active ?? true,
      created: nowIso,
      updated: nowIso,
    };

    if (typeof window === 'undefined') {
      const { adminDb } = await import('@/lib/firebase-admin');
      if (adminDb) {
        const docRef = await adminDb.collection(FORMS_COLLECTION).add(formPayload);
        return {
          id: docRef.id,
          collectionId: FORMS_COLLECTION,
          collectionName: FORMS_COLLECTION,
          ...formPayload,
        } as FormRecord;
      }
    }

    if (db) {
      const docRef = await addDoc(collection(db, FORMS_COLLECTION), formPayload);
      return {
        id: docRef.id,
        collectionId: FORMS_COLLECTION,
        collectionName: FORMS_COLLECTION,
        ...formPayload,
      } as FormRecord;
    }

    throw new Error('Firestore is not initialized');
  }

  /**
   * Validates and updates an existing form record
   */
  async updateForm(id: string, data: UpdateFormInput): Promise<FormRecord> {
    // Validate partial schema
    const validatedData = updateFormSchema.parse(data);
    const nowIso = new Date().toISOString();

    const updatePayload = {
      ...validatedData,
      updated: nowIso,
    };

    if (typeof window === 'undefined') {
      const { adminDb } = await import('@/lib/firebase-admin');
      if (adminDb) {
        await adminDb.collection(FORMS_COLLECTION).doc(id).update(updatePayload);
        return this.getFormById(id);
      }
    }

    if (db) {
      const docRef = doc(db, FORMS_COLLECTION, id);
      await updateDoc(docRef, updatePayload);
      return this.getFormById(id);
    }

    throw new Error('Firestore is not initialized');
  }

  /**
   * Deletes a form record by its ID
   */
  async deleteForm(id: string): Promise<boolean> {
    if (typeof window === 'undefined') {
      const { adminDb } = await import('@/lib/firebase-admin');
      if (adminDb) {
        await adminDb.collection(FORMS_COLLECTION).doc(id).delete();
        return true;
      }
    }

    if (db) {
      const docRef = doc(db, FORMS_COLLECTION, id);
      await deleteDoc(docRef);
      return true;
    }

    throw new Error('Firestore is not initialized');
  }

  /**
   * Convenience method to toggle or set the active status of a form
   */
  async setFormStatus(id: string, isActive: boolean): Promise<FormRecord> {
    return this.updateForm(id, { is_active: isActive });
  }
}

export const formsService = new FormsService();
