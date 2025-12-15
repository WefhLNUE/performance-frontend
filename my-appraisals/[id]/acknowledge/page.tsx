'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function AcknowledgePage() {
  const params = useParams();
  const router = useRouter();
  const recordId = params.id as string;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [comment, setComment] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post(`/performance/records/${recordId}/acknowledge`, { comment: comment || undefined });
      router.push(`/performance/my-appraisals/${recordId}`);
    } catch (err: any) {
      setError(err.message || 'Failed to acknowledge appraisal');
    } finally {
      setLoading(false);
    }
  };

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
          Acknowledge Appraisal
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Confirm that you have reviewed your performance appraisal
        </p>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="card">
        <div className="form-group">
          <label className="form-label">Optional Comment</label>
          <textarea
            className="form-input"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={5}
            placeholder="Add any comments or feedback about the appraisal (optional)"
          />
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Acknowledging...' : 'Acknowledge Appraisal'}
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => router.back()}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

