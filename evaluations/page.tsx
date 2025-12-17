'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { getCurrentUserId } from '@/lib/auth';

interface Assignment {
  _id: string;
  cycleId: {
    name: string;
  };
  templateId: {
    name: string;
  };
  employeeProfileId: {
    firstName: string;
    lastName: string;
  };
  status: string;
}

export default function EvaluationsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAssignments();
  }, []);

  const loadAssignments = async () => {
    try {
      setLoading(true);
      const userId = getCurrentUserId();
      if (!userId) {
        setError('User not authenticated');
        return;
      }
      const data = await api.get<Assignment[]>(`/performance/assignments/manager/${userId}`);
      setAssignments(data || []);
    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.includes('403')) {
        setError('You are not authorized to perform evaluations. HR can assign you as a manager.');
      } else if (msg.toLowerCase().includes('not found') || msg.toLowerCase().includes('manager')) {
        setError('No evaluation assignments found for your account yet.');
      } else {
        setError(msg || 'Failed to load evaluations');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '2rem 1.5rem' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '2rem 1.5rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1
          style={{
            fontSize: '2rem',
            fontWeight: 600,
            color: 'var(--performance)',
            marginBottom: '0.5rem',
          }}
        >
          My Evaluations
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Complete appraisals for your assigned employees
        </p>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      {assignments.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--text-secondary)' }}>
            No evaluation assignments found.
          </p>
        </div>
      ) : (
        <div className="card">
          <table className="table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Cycle</th>
                <th>Template</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((assignment) => (
                <tr key={assignment._id}>
                  <td>
                    {assignment.employeeProfileId?.firstName || ''} {assignment.employeeProfileId?.lastName || 'Unknown'}
                  </td>
                  <td>{assignment.cycleId?.name || 'N/A'}</td>
                  <td>{assignment.templateId?.name || 'N/A'}</td>
                  <td>
                    <span className={`badge ${
                      assignment.status === 'SUBMITTED' ? 'badge-success' :
                      assignment.status === 'IN_PROGRESS' ? 'badge-warning' :
                      'badge-info'
                    }`}>
                      {assignment.status}
                    </span>
                  </td>
                  <td>
                    <Link
                      href={`/performance/evaluations/${assignment._id}`}
                      className="btn-primary"
                      style={{ textDecoration: 'none', display: 'inline-block', fontSize: '0.875rem', padding: '0.5rem 1rem' }}
                    >
                      {assignment.status === 'NOT_STARTED' ? 'Start Evaluation' : 'View/Edit'}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

