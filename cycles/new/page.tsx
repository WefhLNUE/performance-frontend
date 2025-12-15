'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface Template {
  _id: string;
  name: string;
  templateType: string;
}

export default function NewCyclePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    cycleType: 'ANNUAL',
    startDate: '',
    endDate: '',
    managerDueDate: '',
    employeeAcknowledgementDueDate: '',
    templateAssignments: [] as Array<{ templateId: string; departmentIds: string[] }>,
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const data = await api.get<Template[]>('/performance/templates?activeOnly=true');
      setTemplates(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load templates');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        ...formData,
        templateAssignments: formData.templateAssignments.length > 0
          ? formData.templateAssignments
          : undefined,
      };
      await api.post('/performance/cycles', payload);
      router.push('/performance/cycles');
    } catch (err: any) {
      setError(err.message || 'Failed to create cycle');
    } finally {
      setLoading(false);
    }
  };

  const addTemplateAssignment = () => {
    setFormData({
      ...formData,
      templateAssignments: [...formData.templateAssignments, { templateId: '', departmentIds: [] }],
    });
  };

  const updateTemplateAssignment = (index: number, field: string, value: any) => {
    const updated = [...formData.templateAssignments];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, templateAssignments: updated });
  };

  const removeTemplateAssignment = (index: number) => {
    setFormData({
      ...formData,
      templateAssignments: formData.templateAssignments.filter((_, i) => i !== index),
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
          Create Appraisal Cycle
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Define a new appraisal cycle with dates and template assignments
        </p>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="card">
        <div className="form-group">
          <label className="form-label">Cycle Name *</label>
          <input
            type="text"
            className="form-input"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            placeholder="e.g., Q4 2025 Annual Review"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea
            className="form-input"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            placeholder="Describe the purpose of this cycle"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Cycle Type *</label>
          <select
            className="form-input"
            value={formData.cycleType}
            onChange={(e) => setFormData({ ...formData, cycleType: e.target.value })}
            required
          >
            <option value="ANNUAL">Annual</option>
            <option value="SEMI_ANNUAL">Semi-Annual</option>
            <option value="PROBATIONARY">Probationary</option>
            <option value="PROJECT">Project</option>
            <option value="AD_HOC">Ad Hoc</option>
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Start Date *</label>
            <input
              type="date"
              className="form-input"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">End Date *</label>
            <input
              type="date"
              className="form-input"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Manager Due Date</label>
            <input
              type="date"
              className="form-input"
              value={formData.managerDueDate}
              onChange={(e) => setFormData({ ...formData, managerDueDate: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Employee Acknowledgement Due Date</label>
            <input
              type="date"
              className="form-input"
              value={formData.employeeAcknowledgementDueDate}
              onChange={(e) => setFormData({ ...formData, employeeAcknowledgementDueDate: e.target.value })}
            />
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1.5rem', marginTop: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Template Assignments (Optional)</h3>
            <button
              type="button"
              className="btn-secondary"
              onClick={addTemplateAssignment}
            >
              + Add Template
            </button>
          </div>

          {formData.templateAssignments.map((assignment, index) => (
            <div key={index} className="card" style={{ marginBottom: '1rem', padding: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Template *</label>
                <select
                  className="form-input"
                  value={assignment.templateId}
                  onChange={(e) => updateTemplateAssignment(index, 'templateId', e.target.value)}
                  required
                >
                  <option value="">Select a template</option>
                  {templates.map((template) => (
                    <option key={template._id} value={template._id}>
                      {template.name} ({template.templateType})
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => removeTemplateAssignment(index)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--error)',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                  }}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}

          {formData.templateAssignments.length === 0 && (
            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem', fontStyle: 'italic' }}>
              Template assignments can be added later. You can assign templates to employees when creating assignments.
            </p>
          )}
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Creating...' : 'Create Cycle'}
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

