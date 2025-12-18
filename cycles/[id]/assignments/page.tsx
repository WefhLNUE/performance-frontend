'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';

interface Assignment {
  _id: string;
  employeeProfileId: {
    firstName: string;
    lastName: string;
    employeeNumber?: string;
  };
  managerProfileId?: {
    firstName: string;
    lastName: string;
  } | null;
  templateId: {
    name: string;
  };
  departmentId?: {
    name?: string;
  } | null;
  status: string;
  dueDate?: string;
  createdAt: string;
}

export default function CycleAssignmentsPage() {
  const params = useParams();
  const cycleId = params.id as string;

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
      const data = await api.get<Assignment[]>(
        `/performance/cycles/${cycleId}/assignments`,
      );
      setAssignments(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load assignments for this cycle');
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

  if (loading) {
    return (
      <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '2rem 1.5rem' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
          Loading assignments...
        </div>
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
          Cycle Assignments
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          All appraisal assignments created for this cycle.
        </p>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      {assignments.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            No assignments have been created for this cycle yet.
          </p>
          <a
            href={`/performance/assignments/new?cycle=${cycleId}`}
            className="btn-primary"
            style={{ textDecoration: 'none', display: 'inline-block' }}
          >
            Create Assignments for This Cycle
          </a>
        </div>
      ) : (
        <div className="card">
          <table className="table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Employee #</th>
                <th>Template</th>
                <th>Manager</th>
                <th>Department</th>
                <th>Status</th>
                <th>Assigned</th>
                <th>Due Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((a) => (
                <tr key={a._id}>
                  <td>
                    {a.employeeProfileId?.firstName}{' '}
                    {a.employeeProfileId?.lastName}
                  </td>
                  <td>{a.employeeProfileId?.employeeNumber || '-'}</td>
                  <td>{a.templateId?.name || '-'}</td>
                  <td>
                    {a.managerProfileId
                      ? `${a.managerProfileId.firstName} ${a.managerProfileId.lastName}`
                      : 'No manager'}
                  </td>
                  <td>{a.departmentId?.name || '-'}</td>
                  <td>
                    <span
                      className={`badge ${
                        a.status === 'SUBMITTED'
                          ? 'badge-success'
                          : a.status === 'IN_PROGRESS'
                          ? 'badge-warning'
                          : 'badge-info'
                      }`}
                    >
                      {a.status}
                    </span>
                  </td>
                  <td>{new Date(a.createdAt).toLocaleDateString()}</td>
                  <td>
                    {a.dueDate
                      ? new Date(a.dueDate).toLocaleDateString()
                      : '-'}
                  </td>
                  <td>
                    <button
                      onClick={() => handleDelete(a._id)}
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


