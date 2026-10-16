import { QuestionType } from './form';

export type AnswerValue = string | number | string[];

export type AnswersPayload = Record<string, AnswerValue>;

export interface ResponseRecord {
  id: string;
  collectionId: string;
  collectionName: string;
  created: string;
  updated: string;
  form_id: string;
  respondent_name?: string;
  answers: AnswersPayload;
}

export interface SubmitResponseInput {
  form_id: string;
  respondent_name?: string;
  answers: AnswersPayload;
}

export interface QuestionAnalytics {
  q_id: string;
  label: string;
  type: QuestionType;
  totalAnswered: number;
  optionsCount?: Record<string, number>;
  textAnswers?: string[];
}

export interface FormAnalytics {
  formId: string;
  formTitle: string;
  formCreatedAt?: string | null;
  totalResponses: number;
  // Chart-ready aggregation keyed by q_id: { [q_id]: { [optionLabel]: count } }
  summary: Record<string, Record<string, number>>;
  questions: QuestionAnalytics[];
  lastResponseAt: string | null;
  rawResponses?: ResponseRecord[];
}
