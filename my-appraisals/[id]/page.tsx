'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

interface RatingApi {
  key?: string;
  criterionKey?: string;
  ratingValue?: number;
  score?: number;
  comments?: string;
  comment?: string;
}

interface AppraisalRecordApi {
  _id: string;
  assignmentId: {
    cycleId: { name: string };
    templateId: { name: string };
  };
  ratings?: RatingApi[];
  totalScore: number;
  overallRatingLabel: string;
  managerSummary?: string;
  strengths?: string;
  improvementAreas?: string;
  status: string;
  hrPublishedAt?: string;
  employeeAcknowledgedAt?: string;
}

interface RatingDisplay {
  criterionKey: string;
  score: number;
  comments?: string;
}

interface AppraisalRecord {
  _id: string;
  assignmentId: {
    cycleId: { name: string };
    templateId: { name: string };
  };
  ratings: RatingDisplay[];
  totalScore: number;
  overallRatingLabel: string;
  managerSummary?: string;
  strengths?: string[];
  improvementAreas?: string[];
  status: string;
  hrPublishedAt?: string;
  employeeAcknowledgedAt?: string;
}

export default function AppraisalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const recordId = params.id as string;

  const [record, setRecord] = useState<AppraisalRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadRecord();
  }, [recordId]);

  const loadRecord = async () => {
    try {
      setLoading(true);
      const data = await api.get<AppraisalRecordApi>(`/performance/records/${recordId}/view`);

      const mapped: AppraisalRecord = {
        ...data,
        ratings: (data.ratings || []).map((r: RatingApi) => ({
          criterionKey: r.criterionKey || r.key,
          score:
            r.score !== undefined
              ? r.score
              : r.ratingValue !== undefined
              ? r.ratingValue
              : 0,
          comments: r.comments || r.comment || '',
        })),
        strengths: data.strengths
          ? String(data.strengths)
              .split('\n')
              .map((s: string) => s.trim())
              .filter((s: string) => s.length > 0)
          : [],
        improvementAreas: data.improvementAreas
          ? String(data.improvementAreas)
              .split('\n')
              .map((s: string) => s.trim())
              .filter((s: string) => s.length > 0)
          : [],
        hrPublishedAt: data.hrPublishedAt,
        employeeAcknowledgedAt: data.employeeAcknowledgedAt,
      };

      setRecord(mapped);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || 'Failed to load appraisal');
      } else {
        setError('Failed to load appraisal');
      }
    } finally {
      setLoading(false);
    }
  };

  const canFileDispute = () => {
    if (!record?.hrPublishedAt) return false;
    const publishedDate = new Date(record.hrPublishedAt);
    const now = new Date();
    const daysDiff = (now.getTime() - publishedDate.getTime()) / (1000 * 60 * 60 * 24);
    return daysDiff <= 7 && !record.employeeAcknowledgedAt;
  };

  if (loading) {
    return (
      <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '2rem 1.5rem' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Loading...</div>
      </div>
    );
  }

  if (error || !record) {
    return (
      <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '2rem 1.5rem' }}>
        <div className="alert alert-error">{error || 'Appraisal not found'}</div>
        <Link href="/performance/my-appraisals" className="btn-secondary" style={{ textDecoration: 'none', display: 'inline-block', marginTop: '1rem' }}>
          Back to My Appraisals
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '2rem 1.5rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <Link
          href="/performance/my-appraisals"
          style={{
            color: 'var(--primary-600)',
            textDecoration: 'none',
            fontSize: '0.875rem',
            marginBottom: '1rem',
            display: 'inline-block',
          }}
        >
          ← Back to My Appraisals
        </Link>
        <h1
          style={{
            fontSize: '2rem',
            fontWeight: 600,
            color: 'var(--performance)',
            marginBottom: '0.5rem',
          }}
        >
          Performance Appraisal
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          {record.assignmentId.cycleId.name} | {record.assignmentId.templateId.name}
        </p>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Overall Performance</h2>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '2rem', fontWeight: 600, color: 'var(--performance)' }}>
              {record.totalScore.toFixed(1)}
            </div>
            <div>
              <span className="badge badge-info" style={{ fontSize: '1rem' }}>
                {record.overallRatingLabel}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem' }}>Performance Ratings</h2>
        <div style={{ display: 'grid', gap: '1rem' }}>
          {record.ratings.map((rating, index) => (
            <div
              key={index}
              style={{
                padding: '1rem',
                border: '1px solid var(--border-light)',
                borderRadius: '0.5rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <div style={{ fontWeight: 500 }}>{rating.criterionKey}</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--performance)' }}>
                  {rating.score}
                </div>
              </div>
              {rating.comments && (
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                  {rating.comments}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {record.managerSummary && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem' }}>Manager Summary</h2>
          <p style={{ color: 'var(--text-primary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
            {record.managerSummary}
          </p>
        </div>
      )}

      {record.strengths && Array.isArray(record.strengths) && record.strengths.length > 0 && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem' }}>Strengths</h2>
          <ul style={{ listStyle: 'disc', paddingLeft: '1.5rem' }}>
            {record.strengths.map((strength, index) => (
              <li key={index} style={{ marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                {strength}
              </li>
            ))}
          </ul>
        </div>
      )}

      {record.improvementAreas && Array.isArray(record.improvementAreas) && record.improvementAreas.length > 0 && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem' }}>Areas for Improvement</h2>
          <ul style={{ listStyle: 'disc', paddingLeft: '1.5rem' }}>
            {record.improvementAreas.map((area, index) => (
              <li key={index} style={{ marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                {area}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
        {!record.employeeAcknowledgedAt && (
          <Link
            href={`/performance/my-appraisals/${recordId}/acknowledge`}
            className="btn-primary"
            style={{ textDecoration: 'none', display: 'inline-block' }}
          >
            Acknowledge Appraisal
          </Link>
        )}
        {canFileDispute() && (
          <Link
            href={`/performance/disputes/new?recordId=${recordId}`}
            className="btn-secondary"
            style={{ textDecoration: 'none', display: 'inline-block' }}
          >
            File a Dispute
          </Link>
        )}
        {record.employeeAcknowledgedAt && (
          <span className="badge badge-success">Acknowledged</span>
        )}
      </div>
    </div>
  );
}

