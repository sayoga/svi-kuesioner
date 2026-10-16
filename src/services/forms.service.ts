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

    const formsRef = collection(db, FORMS_COLLECTION);
    let q = query(formsRef);

    if (typeof isActive === 'boolean') {
      q = query(formsRef, where('is_active', '==', isActive));
    }

    const querySnapshot = await getDocs(q);

    let items: FormRecord[] = querySnapshot.docs.map((docSnap) => {
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
        ...data,
      } as FormRecord;
    });

    // In-memory filter for search query
    if (search && search.trim().length > 0) {
      const lowerSearch = search.toLowerCase().trim();
      items = items.filter(
        (form) =>
          form.title?.toLowerCase().includes(lowerSearch) ||
          form.description?.toLowerCase().includes(lowerSearch)
      );
    }

    // Sort items
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
    const docRef = doc(db, FORMS_COLLECTION, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error(`Form with ID '${id}' not found`);
    }

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
      ...data,
    } as FormRecord;
  }

  /**
   * Retrieves the latest active form for respondent presentation
   */
  async getLatestActiveForm(): Promise<FormRecord | null> {
    try {
      const formsRef = collection(db, FORMS_COLLECTION);
      const q = query(formsRef, where('is_active', '==', true));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return null;
      }

      const docs: FormRecord[] = querySnapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          collectionId: FORMS_COLLECTION,
          collectionName: FORMS_COLLECTION,
          created: data.created || '',
          updated: data.updated || '',
          title: data.title || '',
          description: data.description || '',
          is_active: data.is_active ?? true,
          questions: data.questions || [],
          ...data,
        } as FormRecord;
      });

      docs.sort((a, b) => (b.created || b.id).localeCompare(a.created || a.id));
      return docs[0] || null;
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

    const docRef = await addDoc(collection(db, FORMS_COLLECTION), formPayload);

    return {
      id: docRef.id,
      collectionId: FORMS_COLLECTION,
      collectionName: FORMS_COLLECTION,
      ...formPayload,
    } as FormRecord;
  }

  /**
   * Validates and updates an existing form record
   */
  async updateForm(id: string, data: UpdateFormInput): Promise<FormRecord> {
    // Validate partial schema
    const validatedData = updateFormSchema.parse(data);
    const docRef = doc(db, FORMS_COLLECTION, id);
    const nowIso = new Date().toISOString();

    const updatePayload = {
      ...validatedData,
      updated: nowIso,
    };

    await updateDoc(docRef, updatePayload);

    return this.getFormById(id);
  }

  /**
   * Deletes a form record by its ID
   */
  async deleteForm(id: string): Promise<boolean> {
    const docRef = doc(db, FORMS_COLLECTION, id);
    await deleteDoc(docRef);
    return true;
  }

  /**
   * Convenience method to toggle or set the active status of a form
   */
  async setFormStatus(id: string, isActive: boolean): Promise<FormRecord> {
    return this.updateForm(id, { is_active: isActive });
  }
}

export const formsService = new FormsService();
