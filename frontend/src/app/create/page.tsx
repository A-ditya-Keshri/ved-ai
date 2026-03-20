'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAssignmentStore, QuestionTypeConfig } from '@/store/assignmentStore';
import api from '@/lib/api';
import Link from 'next/link';

const questionTypeOptions = [
  { type: 'mcq' as const, label: 'MCQs', icon: '🔘' },
  { type: 'short_answer' as const, label: 'Short Answer', icon: '📝' },
  { type: 'long_answer' as const, label: 'Long Answer', icon: '📄' },
  { type: 'diagram' as const, label: 'Diagram / Graph', icon: '📊' },
  { type: 'numerical' as const, label: 'Numerical', icon: '🔢' },
];

export default function CreateAssignment() {
  const router = useRouter();
  const { form, updateForm, addQuestionType, removeQuestionType, updateQuestionType, resetForm } = useAssignmentStore();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const selectedTypes = form.questionTypes.map((qt) => qt.type);

  const toggleQuestionType = (type: QuestionTypeConfig['type']) => {
    if (selectedTypes.includes(type)) {
      removeQuestionType(type);
    } else {
      addQuestionType({ type, count: 5, marksPerQuestion: 2 });
    }
  };

  const totalQuestions = form.questionTypes.reduce((sum, qt) => sum + qt.count, 0);
  const totalMarks = form.questionTypes.reduce((sum, qt) => sum + qt.count * qt.marksPerQuestion, 0);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!form.subject.trim()) newErrors.subject = 'Subject is required';
    if (!form.className.trim()) newErrors.className = 'Class is required';
    if (!form.topic.trim()) newErrors.topic = 'Topic is required';
    if (!form.dueDate) newErrors.dueDate = 'Due date is required';
    if (form.questionTypes.length === 0) newErrors.questionTypes = 'Select at least one question type';
    
    for (const qt of form.questionTypes) {
      if (qt.count < 1) newErrors[`${qt.type}_count`] = 'Min 1';
      if (qt.marksPerQuestion < 1) newErrors[`${qt.type}_marks`] = 'Min 1';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const res = await api.post('/assignments', {
        subject: form.subject,
        className: form.className,
        topic: form.topic,
        dueDate: form.dueDate,
        questionTypes: form.questionTypes,
        additionalInstructions: form.additionalInstructions,
      });

      resetForm();
      router.push(`/assignment/${res.data.assignment._id}`);
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to create assignment';
      setErrors({ submit: errorMsg });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Link href="/" className="back-button">
        ← Back to Assignments
      </Link>

      <div className="page-header" style={{ marginTop: 16 }}>
        <div>
          <h2>Create Assignment</h2>
          <p className="page-header-subtitle">Configure your AI-powered question paper</p>
        </div>
      </div>

      <form className="form-container" onSubmit={handleSubmit}>
        {/* Basic Details */}
        <div className="form-section">
          <h3 className="form-section-title">
            <span className="icon">📋</span>
            Basic Details
          </h3>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Subject *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g., Physics"
                value={form.subject}
                onChange={(e) => updateForm('subject', e.target.value)}
              />
              {errors.subject && <p className="form-error">{errors.subject}</p>}
            </div>
            <div className="form-group">
              <label className="form-label">Class *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g., 10th Grade"
                value={form.className}
                onChange={(e) => updateForm('className', e.target.value)}
              />
              {errors.className && <p className="form-error">{errors.className}</p>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Topic / Chapter *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g., Electricity & Circuits"
                value={form.topic}
                onChange={(e) => updateForm('topic', e.target.value)}
              />
              {errors.topic && <p className="form-error">{errors.topic}</p>}
            </div>
            <div className="form-group">
              <label className="form-label">Due Date *</label>
              <input
                type="date"
                className="form-input"
                value={form.dueDate}
                onChange={(e) => updateForm('dueDate', e.target.value)}
              />
              {errors.dueDate && <p className="form-error">{errors.dueDate}</p>}
            </div>
          </div>
        </div>

        {/* Question Types */}
        <div className="form-section">
          <h3 className="form-section-title">
            <span className="icon">🎯</span>
            Question Types
          </h3>

          <div className="question-types-grid">
            {questionTypeOptions.map((opt) => (
              <div
                key={opt.type}
                className={`question-type-chip ${selectedTypes.includes(opt.type) ? 'selected' : ''}`}
                onClick={() => toggleQuestionType(opt.type)}
              >
                <span className="qt-icon">{opt.icon}</span>
                <span className="qt-label">{opt.label}</span>
              </div>
            ))}
          </div>
          {errors.questionTypes && <p className="form-error">{errors.questionTypes}</p>}

          {form.questionTypes.map((qt) => {
            const opt = questionTypeOptions.find((o) => o.type === qt.type);
            return (
              <div className="qt-config" key={qt.type}>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                  {opt?.icon} {opt?.label}
                </div>
                <div className="qt-config-row">
                  <span className="qt-config-label">Number of Questions</span>
                  <input
                    type="number"
                    className="qt-config-input"
                    min="1"
                    value={qt.count}
                    onChange={(e) => updateQuestionType(qt.type, 'count', Math.max(1, parseInt(e.target.value) || 1))}
                  />
                  {errors[`${qt.type}_count`] && <span className="form-error">{errors[`${qt.type}_count`]}</span>}
                </div>
                <div className="qt-config-row">
                  <span className="qt-config-label">Marks per Question</span>
                  <input
                    type="number"
                    className="qt-config-input"
                    min="1"
                    value={qt.marksPerQuestion}
                    onChange={(e) => updateQuestionType(qt.type, 'marksPerQuestion', Math.max(1, parseInt(e.target.value) || 1))}
                  />
                  {errors[`${qt.type}_marks`] && <span className="form-error">{errors[`${qt.type}_marks`]}</span>}
                </div>
              </div>
            );
          })}

          {form.questionTypes.length > 0 && (
            <div className="summary-bar">
              <div className="summary-stat">
                <div className="summary-stat-value">{totalQuestions}</div>
                <div className="summary-stat-label">Total Questions</div>
              </div>
              <div className="summary-stat">
                <div className="summary-stat-value">{totalMarks}</div>
                <div className="summary-stat-label">Total Marks</div>
              </div>
              <div className="summary-stat">
                <div className="summary-stat-value">{form.questionTypes.length}</div>
                <div className="summary-stat-label">Question Types</div>
              </div>
            </div>
          )}
        </div>

        {/* Additional Instructions */}
        <div className="form-section">
          <h3 className="form-section-title">
            <span className="icon">💡</span>
            Additional Instructions
          </h3>
          <div className="form-group">
            <textarea
              className="form-textarea"
              placeholder="e.g., Generate a paper for a 3-hour duration, focus on practical applications, include diagrams where possible..."
              value={form.additionalInstructions}
              onChange={(e) => updateForm('additionalInstructions', e.target.value)}
            />
          </div>
        </div>

        {errors.submit && (
          <div style={{ background: 'rgba(239,68,68,0.1)', padding: 16, borderRadius: 12, marginBottom: 24, color: '#EF4444', fontWeight: 500 }}>
            {errors.submit}
          </div>
        )}

        <button
          type="submit"
          className="btn btn-primary"
          disabled={submitting}
          style={{ width: '100%', padding: '16px 24px', fontSize: 16 }}
        >
          {submitting ? (
            <>⏳ Creating Assignment...</>
          ) : (
            <>🚀 Generate Question Paper</>
          )}
        </button>
      </form>
    </>
  );
}
