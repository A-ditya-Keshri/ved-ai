import { Router, Request, Response } from 'express';
import { Assignment, IQuestionType } from '../models/Assignment';
import { QuestionPaper } from '../models/QuestionPaper';
import { generationQueue } from '../config/redis';
import { generateQuestions } from '../services/aiService';
import { emitToAssignment } from '../websocket/socketServer';

const router = Router();

// Create a new assignment and enqueue generation job
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { subject, className, topic, dueDate, questionTypes, additionalInstructions } = req.body;

    // Validation
    if (!subject || !className || !topic || !dueDate) {
      res.status(400).json({ error: 'Subject, class, topic, and due date are required' });
      return;
    }

    if (!questionTypes || !Array.isArray(questionTypes) || questionTypes.length === 0) {
      res.status(400).json({ error: 'At least one question type is required' });
      return;
    }

    for (const qt of questionTypes as IQuestionType[]) {
      if (!qt.type || qt.count < 1 || qt.marksPerQuestion < 1) {
        res.status(400).json({ error: 'Each question type must have a valid type, count (≥1), and marks (≥1)' });
        return;
      }
    }

    // Create assignment
    const assignment = await Assignment.create({
      subject,
      className,
      topic,
      dueDate: new Date(dueDate),
      questionTypes,
      additionalInstructions: additionalInstructions || '',
      status: 'draft',
    });

    // Add job to the generation queue
    const job = await generationQueue.add('generate', {
      assignmentId: assignment._id.toString(),
    });

    // Update assignment with job ID
    await Assignment.findByIdAndUpdate(assignment._id, {
      status: 'generating',
      jobId: job.id,
    });

    res.status(201).json({
      message: 'Assignment created. Question paper generation started.',
      assignment: {
        _id: assignment._id,
        subject: assignment.subject,
        className: assignment.className,
        topic: assignment.topic,
        status: 'generating',
        jobId: job.id,
      },
    });
  } catch (error: any) {
    console.error('Error creating assignment:', error);
    res.status(500).json({ error: error.message || 'Failed to create assignment' });
  }
});

// List all assignments
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const assignments = await Assignment.find()
      .sort({ createdAt: -1 })
      .select('-__v')
      .lean();

    res.json(assignments);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch assignments' });
  }
});

// Get a single assignment with its question paper
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const assignment = await Assignment.findById(req.params.id).lean();
    if (!assignment) {
      res.status(404).json({ error: 'Assignment not found' });
      return;
    }

    let questionPaper = null;
    if (assignment.questionPaperId) {
      questionPaper = await QuestionPaper.findById(assignment.questionPaperId).lean();
    }

    res.json({ assignment, questionPaper });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch assignment' });
  }
});

// Regenerate question paper for an assignment
router.post('/:id/regenerate', async (req: Request, res: Response): Promise<void> => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      res.status(404).json({ error: 'Assignment not found' });
      return;
    }

    // Delete existing question paper
    if (assignment.questionPaperId) {
      await QuestionPaper.findByIdAndDelete(assignment.questionPaperId);
    }

    // Reset status and add new job
    assignment.status = 'generating';
    assignment.questionPaperId = undefined;
    await assignment.save();

    const job = await generationQueue.add('generate', {
      assignmentId: assignment._id.toString(),
    });

    await Assignment.findByIdAndUpdate(assignment._id, { jobId: job.id });

    res.json({
      message: 'Regeneration started',
      assignmentId: assignment._id,
      jobId: job.id,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to regenerate' });
  }
});

// Delete an assignment
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      res.status(404).json({ error: 'Assignment not found' });
      return;
    }

    if (assignment.questionPaperId) {
      await QuestionPaper.findByIdAndDelete(assignment.questionPaperId);
    }

    await Assignment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Assignment deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to delete assignment' });
  }
});

export default router;
