'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import { useAssignmentStore } from '@/store/assignmentStore';
import api from '@/lib/api';

export default function HomePage() {
  const { assignments, loading, setAssignments, setLoading } = useAssignmentStore();

  useEffect(() => {
    const fetchAssignments = async () => {
      setLoading(true);
      try {
        const res = await api.get('/assignments');
        setAssignments(res.data);
      } catch (err) {
        console.error('Failed to fetch assignments:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAssignments();
  }, [setAssignments, setLoading]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const statusConfig: Record<string, { class: string; label: string }> = {
    draft: { class: 'status-draft', label: 'Draft' },
    generating: { class: 'status-generating', label: 'Generating' },
    completed: { class: 'status-completed', label: 'Completed' },
    failed: { class: 'status-failed', label: 'Failed' },
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h2>My Assignments</h2>
          <p className="page-header-subtitle">Create and manage AI-generated question papers</p>
        </div>
        <Link href="/create" className="btn btn-primary">
          ✨ Create Assignment
        </Link>
      </div>

      {loading ? (
        <div className="empty-state">
          <div className="generation-animation">
            <div className="ring" />
            <div className="ring" />
            <div className="ring" />
          </div>
          <p>Loading assignments...</p>
        </div>
      ) : assignments.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📝</div>
          <h3>No Assignments Yet</h3>
          <p>Create your first AI-powered assignment by clicking the button above or the + button below.</p>
        </div>
      ) : (
        <div className="cards-grid">
          {assignments.map((assignment) => {
            const status = statusConfig[assignment.status] || statusConfig.draft;
            return (
              <Link
                key={assignment._id}
                href={`/assignment/${assignment._id}`}
                style={{ textDecoration: 'none' }}
              >
                <div className="assignment-card">
                  <div className="card-subject-tag">{assignment.subject}</div>
                  <h3 className="card-title">
                    {assignment.topic}
                  </h3>
                  <p className="card-topic">
                    Class {assignment.className} • {assignment.questionTypes.reduce((sum, qt) => sum + qt.count, 0)} Questions
                  </p>
                  <div className="card-meta">
                    <span className="card-date">
                      📅 Due: {formatDate(assignment.dueDate)}
                    </span>
                    <span className={`card-status ${status.class}`}>
                      <span className="status-dot" />
                      {status.label}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <Link href="/create" className="fab-button" title="Create New Assignment">
        +
      </Link>
    </>
  );
}
