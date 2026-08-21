export type QuestionType = 'MCQ_4' | 'MCQ_5' | 'ESSAY' | 'COMPLEX_MC' | 'TRUE_FALSE';

export type ProjectStatus = 'DRAFT' | 'AKTIF' | 'SELESAI' | 'DITUTUP';

export type AssignmentStatus =
  | 'MENUNGGU_DELEGASI_CABANG'
  | 'MENUNGGU_PENUGASAN_GURU'
  | 'DITUGASKAN'
  | 'DALAM_PROSES'
  | 'SELESAI'
  | 'DISETUJUI';

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
  assignment?: {
    id: string;
    projectId?: string;
    project?: {
      id: string;
      title: string;
      deadline?: string | null;
    };
    targetMcqCount?: number;
    targetEssayCount?: number;
    status?: AssignmentStatus;
  } | null;
  questions?: QuestionItem[];
  _count?: {
    questions: number;
  };
}

export interface BankSoalAssignment {
  id: string;
  projectId: string;
  project?: {
    id: string;
    title: string;
    academicYear?: string | null;
    semester?: string | null;
    deadline?: string | null;
  };
  subjectId?: string | null;
  subjectName: string;
  gradeLevel: string;
  targetMcqCount: number;
  targetEssayCount: number;
  timeLimit?: number | null;
  instructions?: string | null;
  wilayahId?: string | null;
  wilayah?: { id: string; name: string } | null;
  cabangId?: string | null;
  cabang?: { id: string; name: string } | null;
  teacherId?: string | null;
  teacher?: { id: string; username: string; operatorName?: string | null } | null;
  questionBankId?: string | null;
  questionBank?: {
    id: string;
    title: string;
    updatedAt: string;
    _count?: { questions: number };
  } | null;
  status: AssignmentStatus;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BankSoalProject {
  id: string;
  title: string;
  description?: string | null;
  academicYear?: string | null;
  semester?: string | null;
  deadline?: string | null;
  status: ProjectStatus;
  createdById: string;
  createdBy?: {
    id: string;
    username: string;
    operatorName?: string | null;
  };
  assignments: BankSoalAssignment[];
  stats?: {
    total: number;
    completed: number;
    inProgress: number;
    pending: number;
    percentage: number;
  };
  createdAt: string;
  updatedAt: string;
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

export interface FormalMetadata {
  subjects: { id: string; name: string; kodeMapel: string; grupMapel: string }[];
  gradeLevels: string[];
}
