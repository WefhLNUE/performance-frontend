'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface Dispute {
  _id: string;
  appraisalId?: {
    _id: string;
    totalScore?: number;
    overallRatingLabel?: string;
    employeeProfileId?: {
      firstName: string;
      lastName: string;
    };
  };
  assignmentId?: {
    _id: string;
    employeeProfileId?: {
      firstName: string;
      lastName: string;
    };
  };
  raisedByEmployeeId?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  reason: string;
  details?: string;
  // Backend uses AppraisalDisputeStatus: OPEN, UNDER_REVIEW, ADJUSTED, REJECTED
  status: string;
  resolutionSummary?: string;
  adjustedScore?: number;
  adjustedRatingLabel?: string;
}

export default function DisputeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const disputeId = params.id as string;

  const [dispute, setDispute] = useState<Dispute | null>(null);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState(false);
  const [error, setError] = useState('');
  const [resolution, setResolution] = useState({
    action: 'APPROVE' as 'APPROVE' | 'REJECT',
    adjustedScore: '',
    adjustedRatingLabel: '',
    resolutionSummary: '',
  });

  useEffect(() => {
    loadDispute();
  }, [disputeId]);

  const loadDispute = async () => {
    try {
      setLoading(true);
      const data = await api.get<Dispute>(`/performance/disputes/${disputeId}`);
      setDispute(data);
      if (data.adjustedScore) {
        setResolution({
          ...resolution,
          adjustedScore: data.adjustedScore.toString(),
          adjustedRatingLabel: data.adjustedRatingLabel || '',
        });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load dispute');
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async () => {
    if (!confirm('Are you sure you want to resolve this dispute?')) return;

    setError('');
    setResolving(true);

    try {
      const dto: any = {
        resolutionSummary: resolution.resolutionSummary,
      };

      if (resolution.action === 'APPROVE' && resolution.adjustedScore) {
        dto.adjustedScore = parseFloat(resolution.adjustedScore);
        dto.adjustedRatingLabel = resolution.adjustedRatingLabel;
      }

      const payload = {
        dto,
        action: resolution.action === 'APPROVE' ? 'approve' : 'reject',
      };

      await api.post(`/performance/disputes/${disputeId}/resolve`, payload);
      router.push('/performance/disputes');
    } catch (err: any) {
      setError(err.message || 'Failed to resolve dispute');
    } finally {
      setResolving(false);
    }
  };

  if (loading || !dispute) {
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
          Dispute Resolution
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Employee: {
            dispute.raisedByEmployeeId 
              ? `${dispute.raisedByEmployeeId.firstName} ${dispute.raisedByEmployeeId.lastName}`
              : dispute.assignmentId?.employeeProfileId
                ? `${dispute.assignmentId.employeeProfileId.firstName} ${dispute.assignmentId.employeeProfileId.lastName}`
                : dispute.appraisalId?.employeeProfileId
                  ? `${dispute.appraisalId.employeeProfileId.firstName} ${dispute.appraisalId.employeeProfileId.lastName}`
                  : 'Unknown'
          }
        </p>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      {dispute.appraisalId && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem' }}>Current Appraisal</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                Current Score
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--performance)' }}>
                {dispute.appraisalId.totalScore?.toFixed(1) || 'N/A'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                Current Rating
              </div>
              <div>
                <span className="badge badge-info">{dispute.appraisalId.overallRatingLabel || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem' }}>Dispute Details</h2>
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
            Reason
          </div>
          <div style={{ fontWeight: 500 }}>{dispute.reason}</div>
        </div>
        {dispute.details && (
          <div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
              Details
            </div>
            <p style={{ color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>{dispute.details}</p>
          </div>
        )}
        <div style={{ marginTop: '1rem' }}>
          <span
            className={`badge ${
              dispute.status === 'ADJUSTED'
                ? 'badge-success'
                : dispute.status === 'REJECTED'
                ? 'badge-error'
                : dispute.status === 'OPEN' || dispute.status === 'UNDER_REVIEW'
                ? 'badge-warning'
                : 'badge-info'
            }`}
          >
            {dispute.status}
          </span>
        </div>
      </div>

      {(dispute.status === 'OPEN' || dispute.status === 'UNDER_REVIEW') && (
        <div className="card">
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem' }}>Resolution</h2>
          
          <div className="form-group">
            <label className="form-label">Action *</label>
            <select
              className="form-input"
              value={resolution.action}
              onChange={(e) => setResolution({ ...resolution, action: e.target.value as 'APPROVE' | 'REJECT' })}
            >
              <option value="APPROVE">Approve & Adjust</option>
              <option value="REJECT">Reject</option>
            </select>
          </div>

          {resolution.action === 'APPROVE' && (
            <>
              <div className="form-group">
                <label className="form-label">Adjusted Score</label>
                <input
                  type="number"
                  className="form-input"
                  value={resolution.adjustedScore}
                  onChange={(e) => setResolution({ ...resolution, adjustedScore: e.target.value })}
                  step="0.1"
                  min="0"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Adjusted Rating Label</label>
                <input
                  type="text"
                  className="form-input"
                  value={resolution.adjustedRatingLabel}
                  onChange={(e) => setResolution({ ...resolution, adjustedRatingLabel: e.target.value })}
                  placeholder="e.g., Excellent, Good, Needs Improvement"
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label className="form-label">Resolution Summary *</label>
            <textarea
              className="form-input"
              value={resolution.resolutionSummary}
              onChange={(e) => setResolution({ ...resolution, resolutionSummary: e.target.value })}
              rows={5}
              required
              placeholder="Explain your decision"
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
            <button
              className="btn-primary"
              onClick={handleResolve}
              disabled={resolving || !resolution.resolutionSummary}
            >
              {resolving ? 'Resolving...' : 'Resolve Dispute'}
            </button>
            <button
              className="btn-secondary"
              onClick={() => router.back()}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {dispute.status !== 'OPEN' && dispute.status !== 'UNDER_REVIEW' && dispute.resolutionSummary && (
        <div className="card">
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem' }}>Resolution</h2>
          <p style={{ color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>
            {dispute.resolutionSummary}
          </p>
          {dispute.adjustedScore && (
            <div style={{ marginTop: '1rem' }}>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                Adjusted Score: {dispute.adjustedScore.toFixed(1)} ({dispute.adjustedRatingLabel})
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

