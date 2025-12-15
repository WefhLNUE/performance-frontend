'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

interface Template {
  _id: string;
  name: string;
  description?: string;
  templateType: string;
  isActive: boolean;
  ratingScale: {
    type: string;
    min: number;
    max: number;
    labels?: string[];
  };
  criteria: Array<{
    key: string;
    title: string;
    details?: string;
    weight?: number;
    maxScore?: number;
    required?: boolean;
  }>;
  instructions?: string;
}

export default function TemplateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const templateId = params.id as string;

  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadTemplate();
  }, [templateId]);

  const loadTemplate = async () => {
    try {
      setLoading(true);
      const data = await api.get<Template>(`/performance/templates/${templateId}`);
      setTemplate(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load template');
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

  if (error || !template) {
    return (
      <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '2rem 1.5rem' }}>
        <div className="alert alert-error">{error || 'Template not found'}</div>
        <Link href="/performance/templates" className="btn-secondary" style={{ textDecoration: 'none', display: 'inline-block', marginTop: '1rem' }}>
          Back to Templates
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '2rem 1.5rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <Link
          href="/performance/templates"
          style={{
            color: 'var(--primary-600)',
            textDecoration: 'none',
            fontSize: '0.875rem',
            marginBottom: '1rem',
            display: 'inline-block',
          }}
        >
          ← Back to Templates
        </Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
          <div>
            <h1
              style={{
                fontSize: '2rem',
                fontWeight: 600,
                color: 'var(--performance)',
                marginBottom: '0.5rem',
              }}
            >
              {template.name}
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              {template.description || 'No description provided'}
            </p>
          </div>
          <div>
            {template.isActive ? (
              <span className="badge badge-success">Active</span>
            ) : (
              <span className="badge badge-warning">Inactive</span>
            )}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem' }}>
          Template Information
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
              Type
            </div>
            <div style={{ fontWeight: 500 }}>
              <span className="badge badge-info">{template.templateType}</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
              Rating Scale
            </div>
            <div style={{ fontWeight: 500 }}>
              {template.ratingScale.type} ({template.ratingScale.min} - {template.ratingScale.max})
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
              Criteria Count
            </div>
            <div style={{ fontWeight: 500 }}>{template.criteria.length} criteria</div>
          </div>
        </div>
      </div>

      {template.instructions && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem' }}>
            Instructions
          </h2>
          <p style={{ color: 'var(--text-primary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
            {template.instructions}
          </p>
        </div>
      )}

      <div className="card">
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem' }}>
          Evaluation Criteria
        </h2>
        {template.criteria.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>
            No criteria defined for this template.
          </p>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {template.criteria.map((criterion, index) => (
              <div
                key={criterion.key}
                style={{
                  padding: '1rem',
                  border: '1px solid var(--border-light)',
                  borderRadius: '0.5rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>
                      {index + 1}. {criterion.title}
                    </h3>
                    {criterion.details && (
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                        {criterion.details}
                      </p>
                    )}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    {criterion.weight && (
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>
                        Weight: {criterion.weight}%
                      </div>
                    )}
                    {criterion.maxScore && (
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>
                        Max: {criterion.maxScore}
                      </div>
                    )}
                    {criterion.required && (
                      <span className="badge badge-warning" style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                        Required
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontFamily: 'monospace' }}>
                  Key: {criterion.key}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
        <Link
          href={`/performance/templates/${templateId}/edit`}
          className="btn-primary"
          style={{ textDecoration: 'none', display: 'inline-block' }}
        >
          Edit Template
        </Link>
        <Link
          href="/performance/templates"
          className="btn-secondary"
          style={{ textDecoration: 'none', display: 'inline-block' }}
        >
          Back to Templates
        </Link>
      </div>
    </div>
  );
}

