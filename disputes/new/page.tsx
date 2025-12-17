'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '../../../../lib/api';

export default function NewDisputePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const recordId = searchParams.get('recordId');

  const [formData, setFormData] = useState({
    reason: '',
    details: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recordId) {
      setError('No appraisal record specified');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      await api.post('/performance/disputes', {
        appraisalId: recordId,
        reason: formData.reason,
        details: formData.details,
      });
      router.push('/performance/my-appraisals');
    } catch (err: any) {
      setError(err.message || 'Failed to submit dispute');
    } finally {
      setSubmitting(false);
    }
  };

  if (!recordId) {
    return (
      <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '2rem 1.5rem' }}>
        <div className="alert alert-error">
          No appraisal record specified. Please go back and try again.
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
          File a Dispute
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Raise a concern about your appraisal rating
        </p>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="card">
        <div className="form-group">
          <label className="form-label">Reason for Dispute *</label>
          <input
            type="text"
            className="form-input"
            value={formData.reason}
            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            placeholder="e.g., I disagree with the rating on job_knowledge criterion"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Details *</label>
          <textarea
            className="form-input"
            value={formData.details}
            onChange={(e) => setFormData({ ...formData, details: e.target.value })}
            rows={6}
            placeholder="Provide detailed explanation of why you believe the rating should be reconsidered..."
            required
          />
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
          <button
            type="submit"
            className="btn-primary"
            disabled={submitting || !formData.reason || !formData.details}
          >
            {submitting ? 'Submitting...' : 'Submit Dispute'}
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

