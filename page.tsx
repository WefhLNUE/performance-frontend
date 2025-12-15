'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

interface Cycle {
  _id: string;
  name: string;
  cycleType: string;
  startDate: string;
  endDate: string;
  status?: string;
}

interface Template {
  _id: string;
  name: string;
  templateType: string;
  isActive: boolean;
}

export default function PerformancePage() {
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [cyclesData, templatesData] = await Promise.all([
        api.get<Cycle[]>('/performance/cycles').catch(() => []),
        api.get<Template[]>('/performance/templates?activeOnly=true').catch(() => []),
      ]);
      setCycles(cyclesData || []);
      setTemplates(templatesData || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
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
          Performance Management
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Manage employee appraisals, templates, cycles, and evaluations
        </p>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem',
        }}
      >
        <Link href="/performance/templates" style={{ textDecoration: 'none' }}>
          <div className="card" style={{ cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Templates
              </h3>
              <span style={{ fontSize: '1.5rem', color: 'var(--performance)' }}>📋</span>
            </div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '0.75rem', fontSize: '0.875rem' }}>
              Manage appraisal templates and rating scales
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>
              <span>{templates.length} active template{templates.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </Link>

        <Link href="/performance/cycles" style={{ textDecoration: 'none' }}>
          <div className="card" style={{ cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Cycles
              </h3>
              <span style={{ fontSize: '1.5rem', color: 'var(--performance)' }}>🔄</span>
            </div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '0.75rem', fontSize: '0.875rem' }}>
              Create and manage appraisal cycles
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>
              <span>{cycles.length} cycle{cycles.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </Link>

        <Link href="/performance/assignments" style={{ textDecoration: 'none' }}>
          <div className="card" style={{ cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Assignments
              </h3>
              <span style={{ fontSize: '1.5rem', color: 'var(--performance)' }}>📝</span>
            </div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '0.75rem', fontSize: '0.875rem' }}>
              Assign appraisals to employees and managers
            </p>
          </div>
        </Link>

        <Link href="/performance/evaluations" style={{ textDecoration: 'none' }}>
          <div className="card" style={{ cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                My Evaluations
              </h3>
              <span style={{ fontSize: '1.5rem', color: 'var(--performance)' }}>⭐</span>
            </div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '0.75rem', fontSize: '0.875rem' }}>
              View and complete assigned appraisals
            </p>
          </div>
        </Link>

        <Link href="/performance/my-appraisals" style={{ textDecoration: 'none' }}>
          <div className="card" style={{ cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                My Appraisals
              </h3>
              <span style={{ fontSize: '1.5rem', color: 'var(--performance)' }}>📊</span>
            </div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '0.75rem', fontSize: '0.875rem' }}>
              View your published appraisal results
            </p>
          </div>
        </Link>

        <Link href="/performance/dashboard" style={{ textDecoration: 'none' }}>
          <div className="card" style={{ cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                HR Dashboard
              </h3>
              <span style={{ fontSize: '1.5rem', color: 'var(--performance)' }}>📈</span>
            </div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '0.75rem', fontSize: '0.875rem' }}>
              Monitor appraisal progress and completion
            </p>
          </div>
        </Link>

        <Link href="/performance/publish" style={{ textDecoration: 'none' }}>
          <div className="card" style={{ cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Publish Appraisals
              </h3>
              <span style={{ fontSize: '1.5rem', color: 'var(--performance)' }}>📤</span>
            </div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '0.75rem', fontSize: '0.875rem' }}>
              Review and publish manager-submitted appraisals
            </p>
          </div>
        </Link>

        <Link href="/performance/disputes" style={{ textDecoration: 'none' }}>
          <div className="card" style={{ cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Disputes
              </h3>
              <span style={{ fontSize: '1.5rem', color: 'var(--performance)' }}>⚖️</span>
            </div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '0.75rem', fontSize: '0.875rem' }}>
              Manage and resolve employee disputes
            </p>
          </div>
        </Link>
      </div>

      {cycles.length > 0 && (
        <div className="card" style={{ marginTop: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-primary)' }}>
            Recent Cycles
          </h2>
          <div className="table">
            <table style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {cycles.slice(0, 5).map((cycle) => (
                  <tr key={cycle._id}>
                    <td>{cycle.name}</td>
                    <td>
                      <span className="badge badge-info">{cycle.cycleType}</span>
                    </td>
                    <td>{new Date(cycle.startDate).toLocaleDateString()}</td>
                    <td>{new Date(cycle.endDate).toLocaleDateString()}</td>
                    <td>
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

