'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  };
  criteria?: Array<{ key: string; title: string; weight?: number }>;
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await api.get<Template[]>('/performance/templates');
      setTemplates(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    try {
      await api.delete(`/performance/templates/${id}`);
      loadTemplates();
    } catch (err: any) {
      setError(err.message || 'Failed to delete template');
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
            Appraisal Templates
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Manage standardized appraisal templates and rating scales
          </p>
        </div>
        <button
          className="btn-primary"
          onClick={() => router.push('/performance/templates/new')}
        >
          + Create Template
        </button>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      {templates.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            No templates found. Create your first template to get started.
          </p>
          <button
            className="btn-primary"
            onClick={() => router.push('/performance/templates/new')}
          >
            Create Template
          </button>
        </div>
      ) : (
        <div className="card">
          <table className="table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Rating Scale</th>
                <th>Criteria</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {templates.map((template) => (
                <tr key={template._id}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{template.name}</div>
                    {template.description && (
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>
                        {template.description.substring(0, 60)}...
                      </div>
                    )}
                  </td>
                  <td>
                    <span className="badge badge-info">{template.templateType}</span>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.875rem' }}>
                      {template.ratingScale.type} ({template.ratingScale.min}-{template.ratingScale.max})
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      {template.criteria?.length || 0} criteria
                    </div>
                  </td>
                  <td>
                    {template.isActive ? (
                      <span className="badge badge-success">Active</span>
                    ) : (
                      <span className="badge badge-warning">Inactive</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <Link
                        href={`/performance/templates/${template._id}`}
                        style={{
                          color: 'var(--primary-600)',
                          textDecoration: 'none',
                          fontSize: '0.875rem',
                        }}
                      >
                        View
                      </Link>
                      <Link
                        href={`/performance/templates/${template._id}/edit`}
                        style={{
                          color: 'var(--primary-600)',
                          textDecoration: 'none',
                          fontSize: '0.875rem',
                        }}
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(template._id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--error)',
                          cursor: 'pointer',
                          fontSize: '0.875rem',
                          padding: 0,
                        }}
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

