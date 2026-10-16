export type QuestionType =
  | 'text'
  | 'textarea'
  | 'radio'
  | 'checkbox'
  | 'dropdown';

export interface Question {
  q_id: string;
  type: QuestionType;
  label: string;
  required: boolean;
  options?: string[];
}

export interface FormRecord {
  id: string;
  collectionId: string;
  collectionName: string;
  created: string;
  updated: string;
  title: string;
  description: string;
  is_active: boolean;
  questions: Question[];
}

export type CreateFormInput = {
  title: string;
  description?: string;
  is_active?: boolean;
  questions: Question[];
};

export type UpdateFormInput = Partial<CreateFormInput>;

export interface FormListQueryParams {
  page?: number;
  perPage?: number;
  isActive?: boolean;
  sort?: string;
  search?: string;
}
