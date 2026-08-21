export type QuestionType = 'MCQ_4' | 'MCQ_5' | 'ESSAY' | 'COMPLEX_MC' | 'TRUE_FALSE';

export interface QuestionOption {
  id?: string;
  questionItemId?: string;
  label: string; // 'A', 'B', 'C', 'D', 'E'
  contentHtml: string;
  isCorrect: boolean;
  orderIndex: number;
}

export interface QuestionItem {
  id: string;
  questionBankId: string;
  type: QuestionType;
  contentHtml: string;
  answerKey?: string | null;
  orderIndex: number;
  weight?: number;
  createdAt: string;
  updatedAt: string;
  options: QuestionOption[];
}

export interface QuestionBank {
  id: string;
  title: string;
  subject: string;
  gradeLevel: string;
  timeLimit?: number | null;
  institution?: string | null;
  academicYear?: string | null;
  semester?: string | null;
  instructions?: string | null;
  teacherId: string;
  cabangId?: string | null;
  isShared: boolean;
  createdAt: string;
  updatedAt: string;
  teacher?: {
    id: string;
    username: string;
    operatorName?: string | null;
  };
  cabang?: {
    id: string;
    name: string;
    wilayahId?: string | null;
  };
  questions?: QuestionItem[];
  _count?: {
    questions: number;
  };
}

export interface QuestionBankFilterParams {
  search?: string;
  subject?: string;
  gradeLevel?: string;
  cabangId?: string;
  page?: number;
  limit?: number;
  onlyMine?: boolean;
}
