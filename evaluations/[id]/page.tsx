'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface Assignment {
  _id: string;
  cycleId: { name: string };
  templateId: {
    _id: string;
    name: string;
    criteria: Array<{ key: string; title: string; maxScore?: number }>;
    ratingScale: { min: number; max: number };
  };
  employeeProfileId: { firstName: string; lastName: string };
}

interface AppraisalRecord {
  _id?: string;
  ratings: Array<{ criterionKey: string; score: number; comments?: string }>;
  managerSummary?: string;
  strengths?: string[];
  improvementAreas?: string[];
  status?: string;
}

export default function EvaluationFormPage() {
  const params = useParams();
  const router = useRouter();
  const assignmentId = params.id as string;

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [record, setRecord] = useState<AppraisalRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState<AppraisalRecord>({
    ratings: [],
    managerSummary: '',
    strengths: [],
    improvementAreas: [],
  });

  useEffect(() => {
    loadData();
  }, [assignmentId]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Backend endpoint returns { assignment, template, existingRecord }
      const data = await api.get<{
        assignment: Assignment;
        template: Assignment['templateId'];
        existingRecord?: any;
      }>(`/performance/assignments/${assignmentId}/form`);

      const assignmentData = data.assignment;
      setAssignment(assignmentData);

      // If there is an existing record, map it into our frontend shape
      if (data.existingRecord) {
        const existing = data.existingRecord;
        const mappedRecord: AppraisalRecord = {
          _id: existing._id,
          ratings: (existing.ratings || []).map((r: any) => ({
            // Backend stores ratings as { key, ratingValue, comments }
            // but we also support legacy shapes (criterionKey/score/comment)
            criterionKey: r.criterionKey || r.key,
            score:
              r.score !== undefined
                ? r.score
                : r.ratingValue !== undefined
                ? r.ratingValue
                : 0,
            comments: r.comment || r.comments || '',
          })),
          managerSummary: existing.managerSummary || existing.overallComment || '',
          strengths: existing.strengths
            ? String(existing.strengths)
                .split('\n')
                .map((s: string) => s.trim())
                .filter((s: string) => s.length > 0)
            : [],
          improvementAreas: existing.improvementAreas
            ? String(existing.improvementAreas)
                .split('\n')
                .map((s: string) => s.trim())
                .filter((s: string) => s.length > 0)
            : [],
          status: existing.status,
        };

        setRecord(mappedRecord);
        setFormData(mappedRecord);
      } else {
        // Initialize ratings from template criteria
        const initialRatings = assignmentData.templateId.criteria.map((criterion) => ({
          criterionKey: criterion.key,
          score: 0,
          comments: '',
        }));
        setFormData({
          ratings: initialRatings,
          managerSummary: '',
          strengths: [],
          improvementAreas: [],
        });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load evaluation');
    } finally {
      setLoading(false);
    }
  };

  const updateRating = (index: number, field: string, value: any) => {
    const updated = [...formData.ratings];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, ratings: updated });
  };

  const handleSaveDraft = async () => {
    setError('');
    setSaving(true);
    try {
      // Map frontend form data to backend DTO shape
      const payload = {
        ratings: formData.ratings.map((r) => ({
          criterionKey: r.criterionKey,
          score: r.score,
          comment: r.comments || '',
        })),
        managerSummary: formData.managerSummary || '',
        strengths: (formData.strengths || []).join('\n'),
        improvementAreas: (formData.improvementAreas || []).join('\n'),
      };

      // Backend uses /assignments/:assignmentId/records for both create and update
      await api.post(`/performance/assignments/${assignmentId}/records`, payload);
      setSuccess('Draft saved successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to save draft');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!confirm('Are you sure you want to submit this evaluation? It cannot be edited after submission.')) {
      return;
    }

    setError('');
    setSuccess('');
    setSaving(true);
    try {
      if (record?._id) {
        // Existing record: just submit it
        await api.post(`/performance/records/${record._id}/submit`);
        // existing record:  submit
        await loadData();
      } else {
        // No record yet: create a submitted record in one step
        const payload = {
          ratings: formData.ratings.map((r) => ({
            criterionKey: r.criterionKey,
            score: r.score,
            comment: r.comments || '',
          })),
          managerSummary: formData.managerSummary || '',
          strengths: (formData.strengths || []).join('\n'),
          improvementAreas: (formData.improvementAreas || []).join('\n'),
          status: 'MANAGER_SUBMITTED',
        };
        await api.post(`/performance/assignments/${assignmentId}/records`, payload);
        // reload data to get the new record
        await loadData();
      }
      setSuccess('Evaluation submitted successfully');
      setSaving(false);
      // Redirect back to evaluations list after a short delay
      setTimeout(() => router.push('/performance/evaluations'), 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to submit evaluation');
   
      setSaving(false);
    }
  };

  if (loading || !assignment) {
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
          Evaluation: {assignment.employeeProfileId?.firstName || ''} {assignment.employeeProfileId?.lastName || 'Unknown'}
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Cycle: {assignment.cycleId?.name || 'N/A'} | Template: {assignment.templateId?.name || 'N/A'}
        </p>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success" style={{ marginBottom: '1.5rem' }}>
          {success}
        </div>
      )}

      <form className="card">
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem' }}>
          Performance Ratings
        </h2>

        {!assignment.templateId?.criteria || assignment.templateId.criteria.length === 0 ? (
          <div className="alert alert-warning" style={{ marginBottom: '1rem' }}>
            No evaluation criteria found. This assignment may not have a template linked properly.
            Please contact HR to fix this assignment.
          </div>
        ) : null}

        {(assignment.templateId?.criteria || []).map((criterion, index) => {
          const rating = formData.ratings.find((r) => r.criterionKey === criterion.key) || {
            criterionKey: criterion.key,
            score: 0,
            comments: '',
          };
          const ratingIndex = formData.ratings.findIndex((r) => r.criterionKey === criterion.key);

          return (
            <div key={criterion.key} style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-light)' }}>
              <div style={{ marginBottom: '0.5rem' }}>
                <label className="form-label">
                  {criterion.title} (Max: {criterion.maxScore || assignment.templateId?.ratingScale?.max || 5})
                </label>
              </div>
              <div className="form-group">
                <label className="form-label">Rating *</label>
                <input
                  type="number"
                  className="form-input"
                  min={assignment.templateId.ratingScale.min}
                  max={criterion.maxScore || assignment.templateId.ratingScale.max}
                  value={rating.score}
                  onChange={(e) => updateRating(ratingIndex >= 0 ? ratingIndex : formData.ratings.length, 'score', parseInt(e.target.value) || 0)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Comments</label>
                <textarea
                  className="form-input"
                  value={rating.comments || ''}
                  onChange={(e) => updateRating(ratingIndex >= 0 ? ratingIndex : formData.ratings.length, 'comments', e.target.value)}
                  rows={3}
                  placeholder="Provide specific examples and feedback"
                />
              </div>
            </div>
          );
        })}

        <div className="form-group">
          <label className="form-label">Manager Summary *</label>
          <textarea
            className="form-input"
            value={formData.managerSummary}
            onChange={(e) => setFormData({ ...formData, managerSummary: e.target.value })}
            rows={5}
            required
            placeholder="Overall performance summary and feedback"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Strengths</label>
          <textarea
            className="form-input"
            value={Array.isArray(formData.strengths) ? formData.strengths.join('\n') : formData.strengths || ''}
            onChange={(e) => setFormData({ ...formData, strengths: e.target.value.split('\n').filter(s => s.trim()) })}
            rows={4}
            placeholder="List key strengths (one per line)"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Areas for Improvement</label>
          <textarea
            className="form-input"
            value={Array.isArray(formData.improvementAreas) ? formData.improvementAreas.join('\n') : formData.improvementAreas || ''}
            onChange={(e) => setFormData({ ...formData, improvementAreas: e.target.value.split('\n').filter(s => s.trim()) })}
            rows={4}
            placeholder="List areas for improvement (one per line)"
          />
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={handleSaveDraft}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Draft'}
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={handleSubmit}
            disabled={saving || record?.status === 'MANAGER_SUBMITTED'}
          >
            {saving ? 'Submitting...' : record?.status === 'MANAGER_SUBMITTED' ? 'Already Submitted' : 'Submit Evaluation'}
          </button>
        </div>
      </form>
    </div>
  );
}

