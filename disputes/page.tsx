'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

interface Dispute {
  _id: string;
  appraisalId?: {
    _id: string;
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
  // Backend uses AppraisalDisputeStatus: OPEN, UNDER_REVIEW, ADJUSTED, REJECTED
  status: string;
  createdAt: string;
  submittedAt?: string;
}

export default function DisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    loadDisputes();
  }, []);

  const loadDisputes = async () => {
    try {
      setLoading(true);
      const data = await api.get<Dispute[]>('/performance/disputes');
      setDisputes(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load disputes');
    } finally {
      setLoading(false);
    }
  };

  const filteredDisputes = statusFilter
    ? disputes.filter((d) => d.status === statusFilter)
    : disputes;

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
          Disputes Management
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Review and resolve employee disputes regarding appraisals
        </p>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <label className="form-label">Filter by Status</label>
        <select
          className="form-input"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="OPEN">Open</option>
          <option value="UNDER_REVIEW">Under Review</option>
          <option value="ADJUSTED">Adjusted</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {filteredDisputes.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--text-secondary)' }}>
            No disputes found.
          </p>
        </div>
      ) : (
        <div className="card">
          <table className="table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDisputes.map((dispute) => {
                // Get employee name from various possible sources
                const employee = 
                  dispute.raisedByEmployeeId ||
                  dispute.assignmentId?.employeeProfileId ||
                  dispute.appraisalId?.employeeProfileId;
                const employeeName = employee 
                  ? `${employee.firstName || ''} ${employee.lastName || ''}`.trim() 
                  : 'Unknown';
                
                return (
                <tr key={dispute._id}>
                  <td>{employeeName}</td>
                  <td>{dispute.reason?.substring(0, 60) || 'No reason provided'}...</td>
                  <td>
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
                  </td>
                  <td>{new Date(dispute.submittedAt || dispute.createdAt).toLocaleDateString()}</td>
                  <td>
                    <Link
                      href={`/performance/disputes/${dispute._id}`}
                      style={{
                        color: 'var(--primary-600)',
                        textDecoration: 'none',
                        fontSize: '0.875rem',
                      }}
                    >
                      View/Resolve
                    </Link>
                  </td>
                </tr>
              );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

