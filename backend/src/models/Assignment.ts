import mongoose, { Document, Schema } from 'mongoose';

export interface IQuestionType {
  type: 'mcq' | 'short_answer' | 'long_answer' | 'diagram' | 'numerical';
  count: number;
  marksPerQuestion: number;
}

export interface IAssignment extends Document {
  subject: string;
  className: string;
  topic: string;
  dueDate: Date;
  questionTypes: IQuestionType[];
  additionalInstructions: string;
  status: 'draft' | 'generating' | 'completed' | 'failed';
  questionPaperId?: mongoose.Types.ObjectId;
  jobId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const QuestionTypeSchema = new Schema<IQuestionType>({
  type: {
    type: String,
    enum: ['mcq', 'short_answer', 'long_answer', 'diagram', 'numerical'],
    required: true,
  },
  count: { type: Number, required: true, min: 1 },
  marksPerQuestion: { type: Number, required: true, min: 1 },
});

const AssignmentSchema = new Schema<IAssignment>(
  {
    subject: { type: String, required: true, trim: true },
    className: { type: String, required: true, trim: true },
    topic: { type: String, required: true, trim: true },
    dueDate: { type: Date, required: true },
    questionTypes: { type: [QuestionTypeSchema], required: true, validate: [(v: IQuestionType[]) => v.length > 0, 'At least one question type is required'] },
    additionalInstructions: { type: String, default: '' },
    status: {
      type: String,
      enum: ['draft', 'generating', 'completed', 'failed'],
      default: 'draft',
    },
    questionPaperId: { type: Schema.Types.ObjectId, ref: 'QuestionPaper' },
    jobId: { type: String },
  },
  { timestamps: true }
);

export const Assignment = mongoose.model<IAssignment>('Assignment', AssignmentSchema);
