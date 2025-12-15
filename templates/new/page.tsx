'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function NewTemplatePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    templateType: 'ANNUAL',
    ratingScale: {
      type: 'FIVE_POINT',
      min: 1,
      max: 5,
      step: 1,
      labels: [] as string[],
    },
    criteria: [] as Array<{ key: string; title: string; details?: string; weight?: number; maxScore?: number; required?: boolean }>,
    instructions: '',
    isActive: true,
  });

  const [newCriterion, setNewCriterion] = useState({
    key: '',
    title: '',
    details: '',
    weight: 0,
    maxScore: 5,
    required: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post('/performance/templates', formData);
      router.push('/performance/templates');
    } catch (err: any) {
      setError(err.message || 'Failed to create template');
    } finally {
      setLoading(false);
    }
  };

  const addCriterion = () => {
    if (!newCriterion.key || !newCriterion.title) {
      setError('Key and title are required for criteria');
      return;
    }
    setFormData({
      ...formData,
      criteria: [...formData.criteria, { ...newCriterion }],
    });
    setNewCriterion({ key: '', title: '', details: '', weight: 0, maxScore: 5, required: false });
  };

  const removeCriterion = (index: number) => {
    setFormData({
      ...formData,
      criteria: formData.criteria.filter((_, i) => i !== index),
    });
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
          Create Appraisal Template
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Define a standardized template for employee evaluations
        </p>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="card">
        <div className="form-group">
          <label className="form-label">Template Name *</label>
          <input
            type="text"
            className="form-input"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            placeholder="e.g., Annual Performance Review"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea
            className="form-input"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            placeholder="Describe the purpose of this template"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Template Type *</label>
          <select
            className="form-input"
            value={formData.templateType}
            onChange={(e) => setFormData({ ...formData, templateType: e.target.value })}
            required
          >
            <option value="ANNUAL">Annual</option>
            <option value="SEMI_ANNUAL">Semi-Annual</option>
            <option value="PROBATIONARY">Probationary</option>
            <option value="PROJECT">Project</option>
            <option value="AD_HOC">Ad Hoc</option>
          </select>
        </div>

        <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1.5rem', marginTop: '1.5rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Rating Scale</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Scale Type *</label>
              <select
                className="form-input"
                value={formData.ratingScale.type}
                onChange={(e) => setFormData({
                  ...formData,
                  ratingScale: { ...formData.ratingScale, type: e.target.value },
                })}
                required
              >
                <option value="THREE_POINT">3-Point Scale</option>
                <option value="FIVE_POINT">5-Point Scale</option>
                <option value="TEN_POINT">10-Point Scale</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Minimum *</label>
              <input
                type="number"
                className="form-input"
                value={formData.ratingScale.min}
                onChange={(e) => setFormData({
                  ...formData,
                  ratingScale: { ...formData.ratingScale, min: parseInt(e.target.value) },
                })}
                required
                min="0"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Maximum *</label>
              <input
                type="number"
                className="form-input"
                value={formData.ratingScale.max}
                onChange={(e) => setFormData({
                  ...formData,
                  ratingScale: { ...formData.ratingScale, max: parseInt(e.target.value) },
                })}
                required
                min="1"
              />
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1.5rem', marginTop: '1.5rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Evaluation Criteria</h3>
          
          {formData.criteria.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              {formData.criteria.map((criterion, index) => (
                <div
                  key={index}
                  className="card"
                  style={{ marginBottom: '0.75rem', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <div>
                    <div style={{ fontWeight: 500 }}>{criterion.title}</div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>
                      Key: {criterion.key} | Weight: {criterion.weight || 0}% | Max Score: {criterion.maxScore || 5}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeCriterion(index)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--error)',
                      cursor: 'pointer',
                      padding: '0.5rem',
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="card" style={{ padding: '1rem', marginBottom: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Criterion Key *</label>
                <input
                  type="text"
                  className="form-input"
                  value={newCriterion.key}
                  onChange={(e) => setNewCriterion({ ...newCriterion, key: e.target.value })}
                  placeholder="e.g., communication"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input
                  type="text"
                  className="form-input"
                  value={newCriterion.title}
                  onChange={(e) => setNewCriterion({ ...newCriterion, title: e.target.value })}
                  placeholder="e.g., Communication Skills"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Weight (%)</label>
                <input
                  type="number"
                  className="form-input"
                  value={newCriterion.weight}
                  onChange={(e) => setNewCriterion({ ...newCriterion, weight: parseInt(e.target.value) || 0 })}
                  min="0"
                  max="100"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Max Score</label>
                <input
                  type="number"
                  className="form-input"
                  value={newCriterion.maxScore}
                  onChange={(e) => setNewCriterion({ ...newCriterion, maxScore: parseInt(e.target.value) || 5 })}
                  min="1"
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Details</label>
              <textarea
                className="form-input"
                value={newCriterion.details}
                onChange={(e) => setNewCriterion({ ...newCriterion, details: e.target.value })}
                rows={2}
                placeholder="Additional details about this criterion"
              />
            </div>
            <button
              type="button"
              className="btn-secondary"
              onClick={addCriterion}
            >
              + Add Criterion
            </button>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Instructions</label>
          <textarea
            className="form-input"
            value={formData.instructions}
            onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
            rows={4}
            placeholder="Instructions for managers completing this appraisal"
          />
        </div>

        <div className="form-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            />
            <span>Active (template can be used in cycles)</span>
          </label>
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Creating...' : 'Create Template'}
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

