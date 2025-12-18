'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface Cycle {
  _id: string;
  name: string;
  description?: string;
  cycleType: string;
  startDate: string;
  endDate: string;
  managerDueDate?: string;
  employeeAcknowledgementDueDate?: string;
}

export default function CyclesPage() {
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    loadCycles();
  }, []);

  const loadCycles = async () => {
    try {
      setLoading(true);
      setError(''); // Clear previous errors
      const data = await api.get<Cycle[]>('/performance/cycles');
      setCycles(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load cycles');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (cycleId: string, cycleName: string) => {
    if (!confirm(`Are you sure you want to delete the cycle "${cycleName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await api.delete(`/performance/cycles/${cycleId}`);
      // Reload cycles after deletion
      loadCycles();
    } catch (err: any) {
      const msg = err?.message || 'Failed to delete cycle';
      alert(msg);
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
            Appraisal Cycles
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Create and manage appraisal cycles for employee evaluations
          </p>
        </div>
        <button
          className="btn-primary"
          onClick={() => router.push('/performance/cycles/new')}
        >
          + Create Cycle
        </button>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      {cycles.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            No cycles found. Create your first cycle to get started.
          </p>
          <button
            className="btn-primary"
            onClick={() => router.push('/performance/cycles/new')}
          >
            Create Cycle
          </button>
        </div>
      ) : (
        <div className="card">
          <table className="table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Manager Due Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {cycles.map((cycle) => (
                <tr key={cycle._id}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{cycle.name}</div>
                    {cycle.description && (
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>
                        {cycle.description.substring(0, 60)}...
                      </div>
                    )}
                  </td>
                  <td>
                    <span className="badge badge-info">{cycle.cycleType}</span>
                  </td>
                  <td>{new Date(cycle.startDate).toLocaleDateString()}</td>
                  <td>{new Date(cycle.endDate).toLocaleDateString()}</td>
                  <td>
                    {cycle.managerDueDate
                      ? new Date(cycle.managerDueDate).toLocaleDateString()
                      : '-'}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <Link
                        href={`/performance/cycles/${cycle._id}`}
                        style={{
                          color: 'var(--primary-600)',
                          textDecoration: 'none',
                          fontSize: '0.875rem',
                        }}
                      >
                        View
                      </Link>
                      <Link
                        href={`/performance/cycles/${cycle._id}/edit`}
                        style={{
                          color: 'var(--primary-600)',
                          textDecoration: 'none',
                          fontSize: '0.875rem',
                        }}
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(cycle._id, cycle.name)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--error)',
                          cursor: 'pointer',
                          fontSize: '0.875rem',
                          padding: 0,
                        }}
                        title="Delete cycle"
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

