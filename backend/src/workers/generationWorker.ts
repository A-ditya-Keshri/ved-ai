import { Worker, Job } from 'bullmq';
import { redisConnection } from '../config/redis';
import { Assignment } from '../models/Assignment';
import { QuestionPaper } from '../models/QuestionPaper';
import { generateQuestions } from '../services/aiService';
import { emitToAssignment } from '../websocket/socketServer';
import { connectDB } from '../config/database';

interface GenerationJobData {
  assignmentId: string;
}

const processGeneration = async (job: Job<GenerationJobData>): Promise<void> => {
  const { assignmentId } = job.data;
  console.log(`🚀 Processing generation job for assignment: ${assignmentId}`);

  try {
    // Update status to generating
    const assignment = await Assignment.findByIdAndUpdate(
      assignmentId,
      { status: 'generating' },
      { new: true }
    );

    if (!assignment) {
      throw new Error(`Assignment ${assignmentId} not found`);
    }

    // Emit progress event
    emitToAssignment(assignmentId, 'generation:started', {
      assignmentId,
      message: 'AI is generating your question paper...',
    });

    await job.updateProgress(20);

    // Generate questions using AI
    emitToAssignment(assignmentId, 'generation:progress', {
      assignmentId,
      progress: 40,
      message: 'Crafting questions with AI...',
    });

    const generatedData = await generateQuestions(assignment);

    await job.updateProgress(70);

    emitToAssignment(assignmentId, 'generation:progress', {
      assignmentId,
      progress: 70,
      message: 'Structuring question paper...',
    });

    // Create QuestionPaper document
    const questionPaper = await QuestionPaper.create({
      assignmentId: assignment._id,
      institutionName: 'Delhi Public School',
      examTitle: generatedData.examTitle || 'Term Examination',
      subject: assignment.subject,
      className: assignment.className,
      duration: generatedData.duration || '3 Hours',
      maxMarks: generatedData.maxMarks,
      sections: generatedData.sections,
      totalQuestions: generatedData.totalQuestions,
    });

    await job.updateProgress(90);

    // Update assignment with question paper reference
    await Assignment.findByIdAndUpdate(assignmentId, {
      status: 'completed',
      questionPaperId: questionPaper._id,
    });

    await job.updateProgress(100);

    // Emit completion event
    emitToAssignment(assignmentId, 'generation:completed', {
      assignmentId,
      questionPaperId: questionPaper._id,
      message: 'Question paper generated successfully!',
    });

    console.log(`✅ Generation completed for assignment: ${assignmentId}`);
  } catch (error: any) {
    console.error(`❌ Generation failed for assignment: ${assignmentId}`, error.message);

    await Assignment.findByIdAndUpdate(assignmentId, { status: 'failed' });

    emitToAssignment(assignmentId, 'generation:failed', {
      assignmentId,
      message: error.message || 'Question generation failed. Please try again.',
    });

    throw error;
  }
};

export const startWorker = (): Worker => {
  const worker = new Worker<GenerationJobData>('question-generation', processGeneration, {
    connection: redisConnection as any,
    concurrency: 2,
    limiter: {
      max: 5,
      duration: 60000,
    },
  });

  worker.on('completed', (job) => {
    console.log(`✅ Job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`❌ Job ${job?.id} failed:`, err.message);
  });

  worker.on('error', (err) => {
    console.error('Worker error:', err);
  });

  console.log('🔧 Generation worker started');
  return worker;
};
