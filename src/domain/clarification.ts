export type ClarificationQuestionType =
  | 'text'
  | 'textarea'
  | 'single-choice'
  | 'multi-choice'
  | 'scale'
  | 'confirm';

export type ClarificationAnswerSource =
  | 'user-explicit'
  | 'ai-suggested'
  | 'imported'
  | 'default';

export type CreativeDecisionStatus = 'pending' | 'confirmed' | 'rejected';
export type CreativeDecisionCanonImpact = 'none' | 'low' | 'medium' | 'high';

export interface ClarificationOption {
  value: string;
  label: string;
  description?: string;
}

export interface ClarificationDependency {
  questionId: string;
  answerIncludes?: string;
  answerEquals?: string;
}

export interface ClarificationQuestion {
  id: string;
  stage: string;
  topic: string;
  question: string;
  whyItMatters: string;
  type: ClarificationQuestionType;
  required: boolean;
  options: ClarificationOption[];
  exampleAnswers: string[];
  dependsOn: ClarificationDependency[];
}

export interface ClarificationAnswer {
  questionId: string;
  answer: unknown;
  source: ClarificationAnswerSource;
  confidence: number;
  confirmed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreativeDecision {
  id: string;
  label: string;
  value: unknown;
  sourceAnswers: string[];
  status: CreativeDecisionStatus;
  canonImpact: CreativeDecisionCanonImpact;
}
