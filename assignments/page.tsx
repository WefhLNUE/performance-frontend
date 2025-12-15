'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  managerId: string;
  status: string;
  createdAt: string;
}

export default function AssignmentsPage() {
  const router = useRouter();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCycle, setSelectedCycle] = useState('');

  useEffect(() => {
    loadAssignments();
  }, []);

  const loadAssignments = async () => {
    try {
      setLoading(true);
      const userId = getCurrentUserId();
      const data = await api.get<Assignment[]>(`/performance/assignments/manager/${userId}`);
      setAssignments(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  const filteredAssignments = selectedCycle
    ? assignments.filter((a) => a.cycleId._id === selectedCycle)
    : assignments;

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
        <button
          className="btn-primary"
          onClick={() => router.push('/performance/assignments/new')}
        >
          + Create Assignments
        </button>
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
          <button
            className="btn-primary"
            onClick={() => router.push('/performance/assignments/new')}
          >
            Create Assignments
          </button>
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
              {filteredAssignments.map((assignment) => (
                <tr key={assignment._id}>
                  <td>
                    {assignment.employeeProfileId.firstName} {assignment.employeeProfileId.lastName}
                  </td>
                  <td>{assignment.cycleId.name}</td>
                  <td>{assignment.templateId.name}</td>
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

