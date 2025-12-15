'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface Cycle {
  _id: string;
  name: string;
}

interface DashboardStats {
  totalAssignments: number;
  notStarted: number;
  inProgress: number;
  submitted: number;
  published: number;
  acknowledged: number;
  completionRate: number;
}

export default function DashboardPage() {
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [selectedCycle, setSelectedCycle] = useState('');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCycles();
  }, []);

  useEffect(() => {
    if (selectedCycle) {
      loadStats();
    }
  }, [selectedCycle]);

  const loadCycles = async () => {
    try {
      const data = await api.get<Cycle[]>('/performance/cycles');
      setCycles(data || []);
      if (data && data.length > 0) {
        setSelectedCycle(data[0]._id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load cycles');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // This would ideally be a dedicated endpoint
      // For now, we'll calculate from assignments
      const assignments = await api.get<any[]>(`/performance/cycles/${selectedCycle}/assignments`).catch(() => []);
      
      const total = assignments.length;
      const notStarted = assignments.filter((a) => a.status === 'NOT_STARTED').length;
      const inProgress = assignments.filter((a) => a.status === 'IN_PROGRESS').length;
      const submitted = assignments.filter((a) => a.status === 'SUBMITTED').length;
      const published = assignments.filter((a) => a.status === 'PUBLISHED').length;
      const acknowledged = assignments.filter((a) => a.status === 'ACKNOWLEDGED').length;
      const completionRate = total > 0 ? ((submitted + published + acknowledged) / total) * 100 : 0;

      setStats({
        totalAssignments: total,
        notStarted,
        inProgress,
        submitted,
        published,
        acknowledged,
        completionRate,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load statistics');
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
          HR Dashboard
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Monitor appraisal progress and completion across cycles
        </p>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <label className="form-label">Select Cycle</label>
        <select
          className="form-input"
          value={selectedCycle}
          onChange={(e) => setSelectedCycle(e.target.value)}
        >
          {cycles.map((cycle) => (
            <option key={cycle._id} value={cycle._id}>
              {cycle.name}
            </option>
          ))}
        </select>
      </div>

      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <div className="card">
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              Total Assignments
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 600, color: 'var(--performance)' }}>
              {stats.totalAssignments}
            </div>
          </div>
          <div className="card">
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              Not Started
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 600, color: 'var(--text-tertiary)' }}>
              {stats.notStarted}
            </div>
          </div>
          <div className="card">
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              In Progress
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 600, color: 'var(--warning)' }}>
              {stats.inProgress}
            </div>
          </div>
          <div className="card">
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              Submitted
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 600, color: 'var(--info)' }}>
              {stats.submitted}
            </div>
          </div>
          <div className="card">
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              Published
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 600, color: 'var(--success)' }}>
              {stats.published}
            </div>
          </div>
          <div className="card">
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              Completion Rate
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 600, color: 'var(--performance)' }}>
              {stats.completionRate.toFixed(1)}%
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

