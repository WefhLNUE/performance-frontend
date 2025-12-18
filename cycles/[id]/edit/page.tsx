'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface Cycle {
  _id: string;
  name: string;
  description?: string;
  cycleType: string;
  startDate: string;
  endDate: string;
  managerDueDate?: string;
  employeeAcknowledgementDueDate?: string;
  templateAssignments?: Array<{
    templateId: {
      _id: string;
      name: string;
    };
    departmentIds?: string[];
  }>;
}

interface Template {
  _id: string;
  name: string;
  templateType: string;
}

interface Department {
  _id: string;
  name: string;
  code: string;
}

export default function EditCyclePage() {
  const params = useParams();
  const router = useRouter();
  const cycleId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
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
    loadCycle();
    loadData();
  }, [cycleId]);

  const loadData = async () => {
    try {
      const [templatesData, departmentsData] = await Promise.all([
        api.get<Template[]>('/performance/templates?activeOnly=true').catch((err) => {
          console.error('Failed to load templates:', err);
          return [];
        }),
        api.get<Department[]>('/organization-structure/departments').catch((err) => {
          console.error('Failed to load departments:', err);
          if (err.message) {
            setError(`Failed to load departments: ${err.message}. Please ensure the backend is running and you have the required permissions.`);
          }
          return [];
        }),
      ]);
      setTemplates(templatesData || []);
      setDepartments(departmentsData || []);
      if (departmentsData.length === 0) {
        console.warn('No departments found. Make sure departments exist in the database.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    }
  };

  const loadCycle = async () => {
    try {
      setLoading(true);
      const data = await api.get<Cycle>(`/performance/cycles/${cycleId}`);
      setFormData({
        name: data.name,
        description: data.description || '',
        cycleType: data.cycleType,
        startDate: data.startDate.split('T')[0],
        endDate: data.endDate.split('T')[0],
        managerDueDate: data.managerDueDate ? data.managerDueDate.split('T')[0] : '',
        employeeAcknowledgementDueDate: data.employeeAcknowledgementDueDate
          ? data.employeeAcknowledgementDueDate.split('T')[0]
          : '',
        templateAssignments:
          data.templateAssignments
            ?.filter((ta) => ta && ta.templateId) // ignore entries with null templateId
            .map((ta) => ({
              templateId:
                typeof ta.templateId === 'object' && ta.templateId !== null
                  ? ta.templateId._id
                  : (ta.templateId as any),
              departmentIds: ta.departmentIds || [],
            })) || [],
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load cycle');
    } finally {
      setLoading(false);
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const payload = {
        ...formData,
        templateAssignments: formData.templateAssignments.length > 0
          ? formData.templateAssignments
          : undefined,
      };
      await api.put(`/performance/cycles/${cycleId}`, payload);
      router.push(`/performance/cycles/${cycleId}`);
    } catch (err: any) {
      setError(err.message || 'Failed to update cycle');
    } finally {
      setSaving(false);
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

  const handleDepartmentChange = (index: number, selectedOptions: HTMLSelectElement['selectedOptions']) => {
    const selectedIds = Array.from(selectedOptions).map(option => option.value);
    updateTemplateAssignment(index, 'departmentIds', selectedIds);
  };

  const removeTemplateAssignment = (index: number) => {
    setFormData({
      ...formData,
      templateAssignments: formData.templateAssignments.filter((_, i) => i !== index),
    });
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
          Edit Appraisal Cycle
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Update cycle configuration and dates
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
              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label className="form-label">Departments (Optional)</label>
                <select
                  className="form-input"
                  multiple
                  value={assignment.departmentIds || []}
                  onChange={(e) => handleDepartmentChange(index, e.target.selectedOptions)}
                  style={{ minHeight: '100px' }}
                >
                  {departments.map((dept) => (
                    <option key={dept._id} value={dept._id}>
                      {dept.name} ({dept.code})
                    </option>
                  ))}
                </select>
                <small style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem', display: 'block', marginTop: '0.25rem' }}>
                  Hold Ctrl (Windows) or Cmd (Mac) to select multiple departments. Leave empty to assign to all departments.
                </small>
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
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => router.push(`/performance/cycles/${cycleId}`)}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

