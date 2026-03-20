import mongoose, { Document, Schema } from 'mongoose';

export interface IQuestion {
  questionNumber: number;
  text: string;
  difficulty: 'Easy' | 'Moderate' | 'Hard';
  marks: number;
  type: string;
  options?: string[];
  answer?: string;
}

export interface ISection {
  title: string;
  instructions: string;
  questions: IQuestion[];
}

export interface IQuestionPaper extends Document {
  assignmentId: mongoose.Types.ObjectId;
  institutionName: string;
  examTitle: string;
  subject: string;
  className: string;
  duration: string;
  maxMarks: number;
  sections: ISection[];
  totalQuestions: number;
  generatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const QuestionSchema = new Schema<IQuestion>({
  questionNumber: { type: Number, required: true },
  text: { type: String, required: true },
  difficulty: {
    type: String,
    enum: ['Easy', 'Moderate', 'Hard'],
    required: true,
  },
  marks: { type: Number, required: true },
  type: { type: String, required: true },
  options: [{ type: String }],
  answer: { type: String },
});

const SectionSchema = new Schema<ISection>({
  title: { type: String, required: true },
  instructions: { type: String, required: true },
  questions: { type: [QuestionSchema], required: true },
});

const QuestionPaperSchema = new Schema<IQuestionPaper>(
  {
    assignmentId: { type: Schema.Types.ObjectId, ref: 'Assignment', required: true },
    institutionName: { type: String, default: 'Delhi Public School' },
    examTitle: { type: String, default: 'Term Examination' },
    subject: { type: String, required: true },
    className: { type: String, required: true },
    duration: { type: String, default: '3 Hours' },
    maxMarks: { type: Number, required: true },
    sections: { type: [SectionSchema], required: true },
    totalQuestions: { type: Number, required: true },
    generatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const QuestionPaper = mongoose.model<IQuestionPaper>('QuestionPaper', QuestionPaperSchema);
