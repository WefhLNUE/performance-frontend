'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
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
  templateAssignments?: Array<{
    templateId: {
      _id: string;
      name: string;
    };
    departmentIds?: string[];
  }>;
}

export default function CycleDetailPage() {
  const params = useParams();
  const cycleId = params.id as string;

  const [cycle, setCycle] = useState<Cycle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCycle();
  }, [cycleId]);

  const loadCycle = async () => {
    try {
      setLoading(true);
      const data = await api.get<Cycle>(`/performance/cycles/${cycleId}`);
      setCycle(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load cycle');
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

  if (error || !cycle) {
    return (
      <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '2rem 1.5rem' }}>
        <div className="alert alert-error">{error || 'Cycle not found'}</div>
        <Link href="/performance/cycles" className="btn-secondary" style={{ textDecoration: 'none', display: 'inline-block', marginTop: '1rem' }}>
          Back to Cycles
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '2rem 1.5rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <Link
          href="/performance/cycles"
          style={{
            color: 'var(--primary-600)',
            textDecoration: 'none',
            fontSize: '0.875rem',
            marginBottom: '1rem',
            display: 'inline-block',
          }}
        >
          ← Back to Cycles
        </Link>
        <h1
          style={{
            fontSize: '2rem',
            fontWeight: 600,
            color: 'var(--performance)',
            marginBottom: '0.5rem',
          }}
        >
          {cycle.name}
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          {cycle.description || 'No description provided'}
        </p>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem' }}>
          Cycle Information
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
              Type
            </div>
            <div style={{ fontWeight: 500 }}>
              <span className="badge badge-info">{cycle.cycleType}</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
              Start Date
            </div>
            <div style={{ fontWeight: 500 }}>{new Date(cycle.startDate).toLocaleDateString()}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
              End Date
            </div>
            <div style={{ fontWeight: 500 }}>{new Date(cycle.endDate).toLocaleDateString()}</div>
          </div>
          {cycle.managerDueDate && (
            <div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                Manager Due Date
              </div>
              <div style={{ fontWeight: 500 }}>{new Date(cycle.managerDueDate).toLocaleDateString()}</div>
            </div>
          )}
          {cycle.employeeAcknowledgementDueDate && (
            <div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                Employee Acknowledgement Due
              </div>
              <div style={{ fontWeight: 500 }}>
                {new Date(cycle.employeeAcknowledgementDueDate).toLocaleDateString()}
              </div>
            </div>
          )}
        </div>
      </div>

      {cycle.templateAssignments && cycle.templateAssignments.length > 0 && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem' }}>
            Template Assignments
          </h2>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {cycle.templateAssignments.map((assignment: any, index: number) => {
              const templateName =
                assignment?.templateId && typeof assignment.templateId === 'object'
                  ? assignment.templateId.name
                  : 'No template assigned';

              const departmentCount = Array.isArray(assignment?.departmentIds)
                ? assignment.departmentIds.length
                : 0;

              return (
                <div
                  key={index}
                  style={{
                    padding: '1rem',
                    border: '1px solid var(--border-light)',
                    borderRadius: '0.5rem',
                  }}
                >
                  <div style={{ fontWeight: 500 }}>{templateName}</div>
                  {departmentCount > 0 && (
                    <div
                      style={{
                        fontSize: '0.875rem',
                        color: 'var(--text-tertiary)',
                        marginTop: '0.25rem',
                      }}
                    >
                      {departmentCount} department(s)
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="card">
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem' }}>
          Cycle Actions
        </h2>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Link
            href={`/performance/cycles/${cycleId}/assignments`}
            className="btn-primary"
            style={{ textDecoration: 'none', display: 'inline-block' }}
          >
            View Assignments
          </Link>
          <Link
            href={`/performance/assignments?cycle=${cycleId}`}
            className="btn-secondary"
            style={{ textDecoration: 'none', display: 'inline-block' }}
          >
            Manage Assignments
          </Link>
          <Link
            href={`/performance/cycles/${cycleId}/edit`}
            className="btn-secondary"
            style={{ textDecoration: 'none', display: 'inline-block' }}
          >
            Edit Cycle
          </Link>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
        <Link
          href="/performance/cycles"
          className="btn-secondary"
          style={{ textDecoration: 'none', display: 'inline-block' }}
        >
          Back to Cycles
        </Link>
      </div>
    </div>
  );
}

