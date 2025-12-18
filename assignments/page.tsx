'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { getCurrentUserId } from '@/lib/auth';

interface Assignment {
  _id: string;
  cycleId: {
    _id?: string;
    name: string;
  };
  templateId: {
    name: string;
  };
  employeeProfileId: {
    firstName: string;
    lastName: string;
  };
  managerId: string;
  status: string;
  createdAt: string;
}

export default function AssignmentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cycleId = searchParams.get('cycle');
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAssignments();
  }, [cycleId]);

  const loadAssignments = async () => {
    try {
      setLoading(true);
      setError(''); // Clear previous errors
      
      // If cycleId is provided, load assignments for that cycle (HR view)
      if (cycleId) {
        const data = await api.get<Assignment[]>(`/performance/cycles/${cycleId}/assignments`);
        setAssignments(data || []);
      } else {
        // Otherwise, load manager assignments for the current user
        const userId = getCurrentUserId();
        if (!userId) {
          setError('User not authenticated. Please log in again.');
          return;
        }
        const data = await api.get<Assignment[]>(`/performance/assignments/manager/${userId}`);
        setAssignments(data || []);
      }
    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.includes('403')) {
        setError('You are not authorized to view assignments. HR can grant access.');
      } else if (msg.toLowerCase().includes('manager') || msg.toLowerCase().includes('not found')) {
        setError('No manager assignments found for your account yet.');
      } else {
        setError(msg || 'Failed to load assignments');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (assignmentId: string) => {
    if (!confirm('Are you sure you want to delete this assignment? This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/performance/assignments/${assignmentId}`);
      // Reload assignments after deletion
      loadAssignments();
    } catch (err: any) {
      const msg = err?.message || 'Failed to delete assignment';
      alert(msg);
    }
  };

  // No need for filtering if we already loaded by cycle

  if (loading) {
    return (
      <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '2rem 1.5rem' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '2rem 1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1
            style={{
              fontSize: '2rem',
              fontWeight: 600,
              color: 'var(--performance)',
              marginBottom: '0.5rem',
            }}
          >
            Appraisal Assignments
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            View and manage appraisal assignments
          </p>
        </div>
        <Link href="/performance/assignments/new" className="btn-primary">
          + Create Assignments
        </Link>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      {assignments.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            No assignments found.
          </p>
          <Link href="/performance/assignments/new" className="btn-primary">
            Create Assignments
          </Link>
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
                <th>Created</th>
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
                  <td>{new Date(assignment.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <Link
                        href={`/performance/evaluations/${assignment._id}`}
                        style={{
                          color: 'var(--primary-600)',
                          textDecoration: 'none',
                          fontSize: '0.875rem',
                        }}
                      >
                        View
                      </Link>
                      <button
                        onClick={() => handleDelete(assignment._id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--error)',
                          cursor: 'pointer',
                          fontSize: '0.875rem',
                          padding: 0,
                        }}
                        title="Delete assignment"
                      >
                        Delete
                      </button>
                    </div>
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

