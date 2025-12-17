'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

interface AppraisalRecord {
  _id: string;
  assignmentId: {
    _id: string;
    employeeProfileId: {
      firstName: string;
      lastName: string;
    };
    cycleId: {
      name: string;
    };
  };
  totalScore: number;
  overallRatingLabel: string;
  managerSummary?: string;
  status: string;
  managerSubmittedAt?: string;
}

export default function PublishAppraisalsPage() {
  const [records, setRecords] = useState<AppraisalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    try {
      setLoading(true);
      const cycles = await api.get<any[]>('/performance/cycles').catch(() => []);
      const allRecords: AppraisalRecord[] = [];
      
      for (const cycle of cycles) {
        try {
          const assignments = await api.get<any[]>(`/performance/cycles/${cycle._id}/assignments`).catch(() => []);
          
          for (const assignment of assignments) {
            if (assignment.status === 'SUBMITTED') {
              try {
                const record = await api.get<AppraisalRecord>(`/performance/assignments/${assignment._id}`).catch(() => null);
                if (record && (record as any).latestAppraisalId) {
                  const appraisalRecord = await api.get<AppraisalRecord>(`/performance/records/${(record as any).latestAppraisalId}`).catch(() => null);
                  if (appraisalRecord && appraisalRecord.status === 'MANAGER_SUBMITTED') {
                  allRecords.push({
                    ...appraisalRecord,
                    assignmentId: {
                      _id: assignment._id,
                      employeeProfileId: assignment.employeeProfileId,
                      // Ensure cycle has a readable name even if backend didn't populate it
                      cycleId:
                        assignment.cycleId && typeof assignment.cycleId === 'object'
                          ? assignment.cycleId
                          : { _id: cycle._id, name: cycle.name },
                    },
                  });
                  }
                }
              } catch {
                // Skip if we can't get the record
              }
            }
          }
        } catch {
          // Skip cycles that fail
        }
      }
      
      setRecords(allRecords);
    } catch (err: any) {
      setError(err.message || 'Failed to load appraisals. Note: This feature may require backend support for querying records by status.');
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (recordId: string) => {
    if (!confirm('Are you sure you want to publish this appraisal? It will be visible to the employee.')) {
      return;
    }

    setError('');
    setSuccess('');
    setPublishing(recordId);

    try {
      await api.post(`/performance/records/${recordId}/publish`);
      setSuccess('Appraisal published successfully');
      loadRecords();
    } catch (err: any) {
      setError(err.message || 'Failed to publish appraisal');
    } finally {
      setPublishing(null);
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
          Publish Appraisals
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Review and publish manager-submitted appraisals to employees
        </p>
      </div>

      {error && (
        <div className="alert alert-warning" style={{ marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success" style={{ marginBottom: '1.5rem' }}>
          {success}
        </div>
      )}

      {records.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--text-secondary)' }}>
            No manager-submitted appraisals found waiting for publication.
          </p>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
            All submitted appraisals have been published, or managers haven't submitted any yet.
          </p>
        </div>
      ) : (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Pending Publications</h2>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              {records.length} appraisal{records.length !== 1 ? 's' : ''} pending
            </div>
          </div>

          <table className="table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Cycle</th>
                <th>Score</th>
                <th>Rating</th>
                <th>Submitted</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record._id}>
                  <td>
                    {record.assignmentId.employeeProfileId.firstName}{' '}
                    {record.assignmentId.employeeProfileId.lastName}
                  </td>
                  <td>{record.assignmentId.cycleId.name}</td>
                  <td>
                    <span style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--performance)' }}>
                      {record.totalScore.toFixed(1)}
                    </span>
                  </td>
                  <td>
                    <span className="badge badge-info">{record.overallRatingLabel}</span>
                  </td>
                  <td>
                    {record.managerSubmittedAt
                      ? new Date(record.managerSubmittedAt).toLocaleDateString()
                      : '-'}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <Link
                        href={`/performance/evaluations/${record.assignmentId._id}`}
                        style={{
                          color: 'var(--primary-600)',
                          textDecoration: 'none',
                          fontSize: '0.875rem',
                        }}
                      >
                        Review
                      </Link>
                      <button
                        onClick={() => handlePublish(record._id)}
                        disabled={publishing === record._id}
                        className="btn-success"
                        style={{
                          fontSize: '0.875rem',
                          padding: '0.25rem 0.75rem',
                          border: 'none',
                          cursor: publishing === record._id ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {publishing === record._id ? 'Publishing...' : 'Publish'}
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

