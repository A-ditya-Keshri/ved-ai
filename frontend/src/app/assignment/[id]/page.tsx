'use client';
import { useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAssignmentStore } from '@/store/assignmentStore';
import api from '@/lib/api';
import { getSocket, joinAssignmentRoom, leaveAssignmentRoom } from '@/lib/websocket';

export default function AssignmentPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const paperRef = useRef<HTMLDivElement>(null);

  const {
    currentAssignment,
    currentPaper,
    generationStatus,
    generationMessage,
    generationProgress,
    setCurrentAssignment,
    setCurrentPaper,
    setGenerationStatus,
    setGenerationMessage,
    setGenerationProgress,
    loading,
    setLoading,
  } = useAssignmentStore();

  const fetchAssignment = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/assignments/${id}`);
      setCurrentAssignment(res.data.assignment);
      if (res.data.questionPaper) {
        setCurrentPaper(res.data.questionPaper);
        setGenerationStatus('completed');
      } else if (res.data.assignment.status === 'generating') {
        setGenerationStatus('started');
        setGenerationMessage('Waiting for AI to generate your question paper...');
      } else if (res.data.assignment.status === 'failed') {
        setGenerationStatus('failed');
        setGenerationMessage('Generation failed. Try regenerating.');
      }
    } catch (err) {
      console.error('Failed to fetch assignment:', err);
    } finally {
      setLoading(false);
    }
  }, [id, setCurrentAssignment, setCurrentPaper, setGenerationStatus, setGenerationMessage, setLoading]);

  useEffect(() => {
    fetchAssignment();
    return () => {
      setCurrentAssignment(null);
      setCurrentPaper(null);
      setGenerationStatus('idle');
      setGenerationProgress(0);
    };
  }, [fetchAssignment, setCurrentAssignment, setCurrentPaper, setGenerationStatus, setGenerationProgress]);

  // WebSocket
  useEffect(() => {
    const socket = getSocket();
    joinAssignmentRoom(id);

    socket.on('generation:started', (data) => {
      setGenerationStatus('started');
      setGenerationMessage(data.message);
      setGenerationProgress(10);
    });

    socket.on('generation:progress', (data) => {
      setGenerationStatus('progress');
      setGenerationMessage(data.message);
      setGenerationProgress(data.progress);
    });

    socket.on('generation:completed', async (data) => {
      setGenerationStatus('completed');
      setGenerationMessage(data.message);
      setGenerationProgress(100);
      // Refetch to get the question paper
      await fetchAssignment();
    });

    socket.on('generation:failed', (data) => {
      setGenerationStatus('failed');
      setGenerationMessage(data.message);
    });

    return () => {
      leaveAssignmentRoom(id);
      socket.off('generation:started');
      socket.off('generation:progress');
      socket.off('generation:completed');
      socket.off('generation:failed');
    };
  }, [id, fetchAssignment, setGenerationStatus, setGenerationMessage, setGenerationProgress]);

  const handleRegenerate = async () => {
    try {
      setGenerationStatus('started');
      setGenerationMessage('Starting regeneration...');
      setGenerationProgress(5);
      setCurrentPaper(null);
      await api.post(`/assignments/${id}/regenerate`);
    } catch (err) {
      console.error('Regeneration failed:', err);
      setGenerationStatus('failed');
      setGenerationMessage('Failed to start regeneration');
    }
  };

  const handleDownloadPDF = async () => {
    if (!paperRef.current) return;
    
    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');
      
      const canvas = await html2canvas(paperRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const pdf = new jsPDF('p', 'mm', 'a4');

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`${currentPaper?.subject || 'question_paper'}_${currentPaper?.className || ''}.pdf`);
    } catch (err) {
      console.error('PDF generation failed:', err);
    }
  };

  if (loading) {
    return (
      <div className="generation-container">
        <div className="generation-animation">
          <div className="ring" />
          <div className="ring" />
          <div className="ring" />
        </div>
        <p>Loading...</p>
      </div>
    );
  }

  // Show generation progress
  if (generationStatus !== 'completed' && generationStatus !== 'idle' && !currentPaper) {
    return (
      <>
        <Link href="/" className="back-button">← Back to Assignments</Link>
        <div className="generation-container">
          {generationStatus === 'failed' ? (
            <>
              <div className="empty-state-icon" style={{ margin: '0 auto 24px', background: 'rgba(239,68,68,0.1)' }}>❌</div>
              <h3 className="generation-title">Generation Failed</h3>
              <p className="generation-message">{generationMessage}</p>
              <button className="btn btn-primary" onClick={handleRegenerate} style={{ marginTop: 16 }}>
                🔄 Try Again
              </button>
            </>
          ) : (
            <>
              <div className="generation-animation">
                <div className="ring" />
                <div className="ring" />
                <div className="ring" />
              </div>
              <h3 className="generation-title">Generating Question Paper</h3>
              <p className="generation-message">{generationMessage || 'AI is crafting your questions...'}</p>
              <div className="progress-bar-container">
                <div className="progress-bar-fill" style={{ width: `${generationProgress}%` }} />
              </div>
              <p style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>{generationProgress}%</p>
            </>
          )}
        </div>
      </>
    );
  }

  if (!currentPaper) {
    return (
      <>
        <Link href="/" className="back-button">← Back to Assignments</Link>
        <div className="empty-state">
          <div className="empty-state-icon">⏳</div>
          <h3>No Question Paper Yet</h3>
          <p>The question paper hasn&apos;t been generated.</p>
          {currentAssignment?.status === 'failed' && (
            <button className="btn btn-primary" onClick={handleRegenerate} style={{ marginTop: 16 }}>
              🔄 Regenerate
            </button>
          )}
        </div>
      </>
    );
  }

  return (
    <>
      <Link href="/" className="back-button">← Back to Assignments</Link>

      <div className="paper-container" style={{ marginTop: 16 }}>
        <div className="paper-actions">
          <button className="btn btn-secondary" onClick={handleRegenerate}>
            🔄 Regenerate
          </button>
          <button className="btn btn-primary" onClick={handleDownloadPDF}>
            📥 Download PDF
          </button>
        </div>

        <div className="paper-sheet" ref={paperRef}>
          {/* Header */}
          <div className="paper-header">
            <h1 className="paper-institution">{currentPaper.institutionName}</h1>
            <p className="paper-exam-title">{currentPaper.examTitle}</p>
            <div className="paper-meta-row">
              <span className="paper-meta-item">
                <strong>Subject:</strong> {currentPaper.subject}
              </span>
              <span className="paper-meta-item">
                <strong>Class:</strong> {currentPaper.className}
              </span>
              <span className="paper-meta-item">
                <strong>Duration:</strong> {currentPaper.duration}
              </span>
              <span className="paper-meta-item">
                <strong>Max Marks:</strong> {currentPaper.maxMarks}
              </span>
            </div>
          </div>

          {/* Student Info */}
          <div className="paper-student-info">
            <div className="student-info-field">
              <label>Name:</label>
              <div className="info-line" />
            </div>
            <div className="student-info-field">
              <label>Roll No:</label>
              <div className="info-line" />
            </div>
            <div className="student-info-field">
              <label>Section:</label>
              <div className="info-line" />
            </div>
          </div>

          {/* Body */}
          <div className="paper-body">
            {currentPaper.sections.map((section, si) => (
              <div className="paper-section" key={si}>
                <div className="section-header">
                  <h3 className="section-title">{section.title}</h3>
                  <span className="section-instructions">{section.instructions}</span>
                </div>

                {section.questions.map((question, qi) => (
                  <div
                    className="question-item"
                    key={qi}
                    style={{ animationDelay: `${qi * 0.08}s` }}
                  >
                    <span className="question-number">Q{question.questionNumber}.</span>
                    <div className="question-content">
                      <p className="question-text">{question.text}</p>

                      {question.options && question.options.length > 0 && (
                        <ul className="question-options">
                          {question.options.map((opt, oi) => (
                            <li key={oi}>{opt}</li>
                          ))}
                        </ul>
                      )}

                      <div className="question-meta">
                        <span className={`difficulty-badge difficulty-${question.difficulty}`}>
                          {question.difficulty}
                        </span>
                        <span className="question-marks">{question.marks}M</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="paper-footer">
            ─── END OF QUESTION PAPER ───
          </div>
        </div>
      </div>
    </>
  );
}
