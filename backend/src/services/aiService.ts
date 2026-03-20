import { GoogleGenAI } from '@google/genai';
import { IAssignment } from '../models/Assignment';

const ai = new GoogleGenAI({});

function buildPrompt(assignment: IAssignment): string {
  const questionTypeDescriptions = assignment.questionTypes.map((qt) => {
    const typeNames: Record<string, string> = {
      mcq: 'Multiple Choice Questions (MCQ) with 4 options each',
      short_answer: 'Short Answer Questions (2-3 sentences)',
      long_answer: 'Long Answer Questions (detailed explanation required)',
      diagram: 'Diagram/Graph Based Questions',
      numerical: 'Numerical/Problem Solving Questions',
    };
    return `- ${typeNames[qt.type] || qt.type}: ${qt.count} questions, ${qt.marksPerQuestion} marks each`;
  });

  const totalQuestions = assignment.questionTypes.reduce((sum, qt) => sum + qt.count, 0);
  const totalMarks = assignment.questionTypes.reduce((sum, qt) => sum + qt.count * qt.marksPerQuestion, 0);

  return `You are an expert academic question paper generator. Create a structured examination question paper based on the following specifications:

**Subject:** ${assignment.subject}
**Class:** ${assignment.className}
**Topic/Chapter:** ${assignment.topic}
**Total Questions:** ${totalQuestions}
**Total Marks:** ${totalMarks}

**Question Types Required:**
${questionTypeDescriptions.join('\n')}

${assignment.additionalInstructions ? `**Additional Instructions:** ${assignment.additionalInstructions}` : ''}

**IMPORTANT: You MUST respond with ONLY valid JSON, no markdown, no code blocks, no extra text.**

Generate the response in this exact JSON structure:
{
  "examTitle": "Term Examination",
  "duration": "3 Hours",
  "maxMarks": ${totalMarks},
  "totalQuestions": ${totalQuestions},
  "sections": [
    {
      "title": "Section A",
      "instructions": "Attempt all questions. Each question carries X marks.",
      "questions": [
        {
          "questionNumber": 1,
          "text": "Question text here",
          "difficulty": "Easy|Moderate|Hard",
          "marks": X,
          "type": "mcq|short_answer|long_answer|diagram|numerical",
          "options": ["A) option1", "B) option2", "C) option3", "D) option4"],
          "answer": "correct answer or explanation"
        }
      ]
    }
  ]
}

Rules:
1. Group questions into sections logically (Section A for easy/MCQ, Section B for moderate, Section C for hard/long)
2. Each question MUST have a difficulty tag: "Easy", "Moderate", or "Hard"
3. MCQ questions MUST include 4 options in the "options" array
4. Non-MCQ questions should have an empty options array
5. Include the answer/solution for each question
6. Questions should be academically rigorous and contextually relevant
7. Ensure a good mix of difficulty levels across sections
8. Questions should be clear, unambiguous, and well-structured`;
}

export async function generateQuestions(assignment: IAssignment): Promise<{
  examTitle: string;
  duration: string;
  maxMarks: number;
  totalQuestions: number;
  sections: Array<{
    title: string;
    instructions: string;
    questions: Array<{
      questionNumber: number;
      text: string;
      difficulty: 'Easy' | 'Moderate' | 'Hard';
      marks: number;
      type: string;
      options?: string[];
      answer?: string;
    }>;
  }>;
}> {
  const prompt = buildPrompt(assignment);

  const result = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt
  });
  
  let text = result.text;

  if (!text) {
    throw new Error('The AI returned an empty response.');
  }

  // Clean the response - remove markdown code blocks if present
  text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  try {
    const parsed = JSON.parse(text);
    return parsed;
  } catch (error) {
    console.error('Failed to parse AI response:', text.substring(0, 500));
    throw new Error('Failed to parse AI-generated questions. The AI did not return valid JSON.');
  }
}
