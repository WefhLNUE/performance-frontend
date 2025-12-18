'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '../../../../lib/api';

interface Cycle {
  _id: string;
  name: string;
}

interface Template {
  _id: string;
  name: string;
}

interface Employee {
  _id: string;
  firstName: string;
  lastName: string;
}

export default function NewAssignmentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cycleIdFromQuery = searchParams.get('cycle');
  const [loading, setLoading] = useState(false);
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    cycleId: cycleIdFromQuery || '',
    templateId: '',
    employeeIds: [] as string[],
    employeeIdsJson: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [cyclesData, templatesData] = await Promise.all([
        api.get<Cycle[]>('/performance/cycles').catch(() => []),
        api.get<Template[]>('/performance/templates?activeOnly=true').catch(() => []),
      ]);
      setCycles(cyclesData || []);
      setTemplates(templatesData || []);
      
      // Try to load employees from employee-profile endpoint
      try {
        const employeesData = await api.get<Employee[]>('http://localhost:5000/employee-profile').catch(() => []);
        setEmployees(employeesData || []);
      } catch {
        // If employee-profile endpoint doesn't exist or fails, that's okay
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    let employeeIdsToUse = formData.employeeIds;
    
    // If JSON input is provided, parse it
    if (formData.employeeIdsJson.trim()) {
      try {
        const parsed = JSON.parse(formData.employeeIdsJson);
        if (Array.isArray(parsed)) {
          employeeIdsToUse = parsed;
        } else {
          setError('Employee IDs must be a JSON array');
          return;
        }
      } catch {
        setError('Invalid JSON format for employee IDs');
        return;
      }
    }

    if (employeeIdsToUse.length === 0) {
      setError('Please select at least one employee or provide employee IDs');
      return;
    }

    setLoading(true);

    try {
      // Backend expects: POST /performance/cycles/:cycleId/assignments
      await api.post(`/performance/cycles/${formData.cycleId}/assignments`, {
        templateId: formData.templateId,
        employeeIds: employeeIdsToUse,
      });
      router.push('/performance/assignments');
    } catch (err: any) {
      setError(err.message || 'Failed to create assignments');
    } finally {
      setLoading(false);
    }
  };

  const toggleEmployee = (employeeId: string) => {
    setFormData({
      ...formData,
      employeeIds: formData.employeeIds.includes(employeeId)
        ? formData.employeeIds.filter((id) => id !== employeeId)
        : [...formData.employeeIds, employeeId],
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
          Create Appraisal Assignments
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Assign appraisals to employees for a specific cycle and template
        </p>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="card">
        <div className="form-group">
          <label className="form-label">Cycle *</label>
          <select
            className="form-input"
            value={formData.cycleId}
            onChange={(e) => setFormData({ ...formData, cycleId: e.target.value })}
            required
          >
            <option value="">Select a cycle</option>
            {cycles.map((cycle) => (
              <option key={cycle._id} value={cycle._id}>
                {cycle.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Template *</label>
          <select
            className="form-input"
            value={formData.templateId}
            onChange={(e) => setFormData({ ...formData, templateId: e.target.value })}
            required
          >
            <option value="">Select a template</option>
            {templates.map((template) => (
              <option key={template._id} value={template._id}>
                {template.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Select Employees *</label>
          {employees.length > 0 ? (
            <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid var(--border-light)', borderRadius: '0.5rem', padding: '1rem' }}>
              {employees.map((employee) => (
                <label
                  key={employee._id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={formData.employeeIds.includes(employee._id)}
                    onChange={() => toggleEmployee(employee._id)}
                  />
                  <span>
                    {employee.firstName} {employee.lastName}
                  </span>
                </label>
              ))}
            </div>
          ) : (
            <div style={{ marginBottom: '1rem' }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                No employees loaded. You can manually enter employee IDs as JSON array:
              </p>
              <textarea
                className="form-input"
                value={formData.employeeIdsJson}
                onChange={(e) => setFormData({ ...formData, employeeIdsJson: e.target.value })}
                placeholder='["employee-id-1", "employee-id-2"]'
                rows={3}
              />
              <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>
                Example: ["692b45fe751ce734f8f8f0c6"]
              </p>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Creating...' : `Create ${formData.employeeIds.length || 'Assignment'}`}
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

