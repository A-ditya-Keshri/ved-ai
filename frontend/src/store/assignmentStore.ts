import { create } from 'zustand';

export interface QuestionTypeConfig {
  type: 'mcq' | 'short_answer' | 'long_answer' | 'diagram' | 'numerical';
  count: number;
  marksPerQuestion: number;
}

export interface Assignment {
  _id: string;
  subject: string;
  className: string;
  topic: string;
  dueDate: string;
  questionTypes: QuestionTypeConfig[];
  additionalInstructions: string;
  status: 'draft' | 'generating' | 'completed' | 'failed';
  questionPaperId?: string;
  jobId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Question {
  questionNumber: number;
  text: string;
  difficulty: 'Easy' | 'Moderate' | 'Hard';
  marks: number;
  type: string;
  options?: string[];
  answer?: string;
}

export interface Section {
  title: string;
  instructions: string;
  questions: Question[];
}

export interface QuestionPaper {
  _id: string;
  assignmentId: string;
  institutionName: string;
  examTitle: string;
  subject: string;
  className: string;
  duration: string;
  maxMarks: number;
  sections: Section[];
  totalQuestions: number;
  generatedAt: string;
}

interface FormState {
  subject: string;
  className: string;
  topic: string;
  dueDate: string;
  questionTypes: QuestionTypeConfig[];
  additionalInstructions: string;
}

interface AssignmentStore {
  // List
  assignments: Assignment[];
  loading: boolean;
  
  // Current
  currentAssignment: Assignment | null;
  currentPaper: QuestionPaper | null;
  
  // Generation
  generationStatus: 'idle' | 'started' | 'progress' | 'completed' | 'failed';
  generationMessage: string;
  generationProgress: number;
  
  // Form
  form: FormState;
  
  // Actions
  setAssignments: (assignments: Assignment[]) => void;
  addAssignment: (assignment: Assignment) => void;
  setCurrentAssignment: (assignment: Assignment | null) => void;
  setCurrentPaper: (paper: QuestionPaper | null) => void;
  setLoading: (loading: boolean) => void;
  setGenerationStatus: (status: 'idle' | 'started' | 'progress' | 'completed' | 'failed') => void;
  setGenerationMessage: (message: string) => void;
  setGenerationProgress: (progress: number) => void;
  updateForm: (field: keyof FormState, value: any) => void;
  addQuestionType: (qt: QuestionTypeConfig) => void;
  removeQuestionType: (type: string) => void;
  updateQuestionType: (type: string, field: 'count' | 'marksPerQuestion', value: number) => void;
  resetForm: () => void;
  updateAssignmentStatus: (id: string, status: Assignment['status']) => void;
}

const initialForm: FormState = {
  subject: '',
  className: '',
  topic: '',
  dueDate: '',
  questionTypes: [],
  additionalInstructions: '',
};

export const useAssignmentStore = create<AssignmentStore>((set) => ({
  assignments: [],
  loading: false,
  currentAssignment: null,
  currentPaper: null,
  generationStatus: 'idle',
  generationMessage: '',
  generationProgress: 0,
  form: { ...initialForm },

  setAssignments: (assignments) => set({ assignments }),
  addAssignment: (assignment) => set((state) => ({ assignments: [assignment, ...state.assignments] })),
  setCurrentAssignment: (assignment) => set({ currentAssignment: assignment }),
  setCurrentPaper: (paper) => set({ currentPaper: paper }),
  setLoading: (loading) => set({ loading }),
  setGenerationStatus: (status) => set({ generationStatus: status }),
  setGenerationMessage: (message) => set({ generationMessage: message }),
  setGenerationProgress: (progress) => set({ generationProgress: progress }),
  updateForm: (field, value) => set((state) => ({ form: { ...state.form, [field]: value } })),
  addQuestionType: (qt) => set((state) => ({ form: { ...state.form, questionTypes: [...state.form.questionTypes, qt] } })),
  removeQuestionType: (type) => set((state) => ({
    form: { ...state.form, questionTypes: state.form.questionTypes.filter((qt) => qt.type !== type) }
  })),
  updateQuestionType: (type, field, value) => set((state) => ({
    form: {
      ...state.form,
      questionTypes: state.form.questionTypes.map((qt) =>
        qt.type === type ? { ...qt, [field]: value } : qt
      ),
    },
  })),
  resetForm: () => set({ form: { ...initialForm } }),
  updateAssignmentStatus: (id, status) => set((state) => ({
    assignments: state.assignments.map((a) => a._id === id ? { ...a, status } : a),
  })),
}));
