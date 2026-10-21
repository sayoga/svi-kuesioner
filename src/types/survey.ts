/**
 * TypeScript definitions for Dynamic JSON-Driven Survey Engine
 * Based on BRI UMKM Service Survey requirements.
 */

// Supported Question Types
export type QuestionType =
  | 'radio'        // Single choice selection
  | 'checkbox'     // Multiple choices selection
  | 'text'         // Single-line text input
  | 'textarea'     // Multi-line text input
  | 'number'       // Numeric input (currency, count, years, etc.)
  | 'scale'        // Rating / Likert scale (e.g., 1 to 5, 1 to 10)
  | 'grid'         // Matrix / Grid table (rows = items, columns = rating scale / choices)
  | 'dropdown';    // Select dropdown (e.g. province, regency)

// Comparison Operators for Skip Logic & Conditional Display
export type ComparisonOperator =
  | 'equals'
  | 'not_equals'
  | 'in'
  | 'not_in'
  | 'greater_than'
  | 'greater_than_or_equal'
  | 'less_than'
  | 'less_than_or_equal'
  | 'contains'
  | 'is_empty'
  | 'is_not_empty';

// Action types when a skip rule triggers
export type SkipActionType =
  | 'skip_to_module'    // Jump to another module by moduleId
  | 'skip_to_question'  // Jump to another question within or across modules
  | 'terminate'         // Terminate early (e.g. does not meet screening criteria)
  | 'end_survey';       // Complete survey early successfully

export interface SkipCondition {
  field?: string;             // Question ID to evaluate (defaults to current question if omitted)
  operator: ComparisonOperator;
  value?: string | number | boolean | (string | number)[];
}

export interface SkipRule {
  id?: string;
  description?: string;
  // Conditions can be a single condition or multiple (evaluated with AND logic by default)
  condition?: SkipCondition;
  conditions?: SkipCondition[];
  conditionLogic?: 'and' | 'or'; // Defaults to 'and'
  action: SkipActionType;
  targetModuleId?: string;    // Required if action is 'skip_to_module'
  targetQuestionId?: string;  // Required if action is 'skip_to_question'
  terminationReason?: string; // Message shown when survey is terminated
}

// Option item for radio, checkbox, dropdown
export interface QuestionOption {
  value: string | number;
  label: string;
  subLabel?: string;
  hasFreeText?: boolean;       // For "Lainnya (sebutkan): [...]"
  freeTextPlaceholder?: string;
  // Inline skip logic directly attached to choosing this option
  skipToModuleId?: string;
  skipToQuestionId?: string;
  terminate?: boolean;
  terminationReason?: string;
  skipRules?: SkipRule[];
}

// Configuration for Likert / Rating scales
export interface ScaleConfig {
  min: number;
  max: number;
  step?: number;
  minLabel?: string;          // e.g. "Sangat Tidak Puas" / "Sangat Rendah"
  maxLabel?: string;          // e.g. "Sangat Puas" / "Sangat Tinggi"
  neutralLabel?: string;      // e.g. "Netral"
}

// Grid / Matrix row item
export interface GridRow {
  id: string;                 // Sub-question ID, e.g. "B1_1"
  text: string;               // Text label for the row
}

// Grid / Matrix column option
export interface GridColumn {
  value: string | number;
  label: string;
}

// Input validation rules
export interface ValidationRule {
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  minSelect?: number;         // Minimum checkbox selections required
  maxSelect?: number;         // Maximum checkbox selections allowed
  pattern?: string;           // Regex pattern
  customMessage?: string;
}

// Dynamic question visibility condition (within a module)
export interface DisplayCondition {
  field: string;              // Question ID to observe
  operator: ComparisonOperator;
  value?: string | number | boolean | (string | number)[];
}

// Core Question definition
export interface Question {
  id: string;                 // Unique question ID (e.g., "S1", "S2", "A1")
  code?: string;              // Display label or number (e.g., "S.1", "A.1")
  text: string;               // Question title / prompt
  instruction?: string;       // Enumerator note / hint (e.g., "Pilihan tunggal", "Boleh lebih dari satu")
  type: QuestionType;
  required?: boolean;
  placeholder?: string;
  options?: QuestionOption[];
  scaleConfig?: ScaleConfig;
  gridRows?: GridRow[];
  gridColumns?: GridColumn[];
  validation?: ValidationRule;
  displayCondition?: DisplayCondition; // If set, only renders when condition passes
  skipRules?: SkipRule[];              // Module / Question level skip rules
}

// Module / Section definition
export interface Module {
  id: string;                 // Module ID (e.g., "S", "A", "B")
  title: string;              // Module title (e.g., "Screening", "Profil Usaha")
  description?: string;       // Section intro or notes
  questions: Question[];
  skipRules?: SkipRule[];     // Module-level skip logic after module completion
}

// Root Survey Schema
export interface SurveySchema {
  id: string;
  title: string;
  description?: string;
  version?: string;
  modules: Module[];
}

// State & Runtime Evaluation Types
export type SurveyAnswerValue =
  | string
  | number
  | boolean
  | (string | number)[]
  | Record<string, string | number> // For grid answers: { [rowId]: columnValue }
  | { value: string | number; freeText?: string } // For options with "Lainnya: [text]"
  | null
  | undefined;

export type SurveyAnswers = Record<string, SurveyAnswerValue>;

export interface SurveyTerminationState {
  isTerminated: boolean;
  reason?: string;
  moduleIndex?: number;
  questionId?: string;
}
