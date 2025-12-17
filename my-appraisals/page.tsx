'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '../../../lib/api';
import { getCurrentUserId } from '../../../lib/auth';

interface AppraisalRecord {
  _id: string;
  cycleId?: { _id: string; name: string };
  templateId?: { _id: string; name: string };
  totalScore?: number;
  overallRatingLabel?: string;
  status: string;
  hrPublishedAt?: string;
}

export default function MyAppraisalsPage() {
  const [appraisals, setAppraisals] = useState<AppraisalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAppraisals();
  }, []);

  const loadAppraisals = async () => {
    try {
      setLoading(true);
      const userId = getCurrentUserId();
      if (!userId) {
        setError('User not authenticated');
        return;
      }
      const data = await api.get<AppraisalRecord[]>(`/performance/records/employee/${userId}/published`);
      setAppraisals(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load appraisals');
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
          My Appraisals
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          View your published performance appraisals
        </p>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      {appraisals.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--text-secondary)' }}>
            No published appraisals found.
          </p>
        </div>
      ) : (
        <div className="card">
          <table className="table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Cycle</th>
                <th>Template</th>
                <th>Score</th>
                <th>Rating</th>
                <th>Published</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {appraisals.map((appraisal) => (
                <tr key={appraisal._id}>
                  <td>{appraisal.cycleId?.name || 'N/A'}</td>
                  <td>{appraisal.templateId?.name || 'N/A'}</td>
                  <td>
                    <span style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--performance)' }}>
                      {appraisal.totalScore?.toFixed(1) || 'N/A'}
                    </span>
                  </td>
                  <td>
                    <span className="badge badge-info">{appraisal.overallRatingLabel || 'N/A'}</span>
                  </td>
                  <td>
                    {appraisal.hrPublishedAt
                      ? new Date(appraisal.hrPublishedAt).toLocaleDateString()
                      : '-'}
                  </td>
                  <td>
                    <Link
                      href={`/performance/my-appraisals/${appraisal._id}`}
                      style={{
                        color: 'var(--primary-600)',
                        textDecoration: 'none',
                        fontSize: '0.875rem',
                      }}
                    >
                      View Details
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

