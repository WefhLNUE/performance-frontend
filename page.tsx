'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/app/lib/useAuth';

interface Cycle {
  _id: string;
  name: string;
  cycleType: string;
  startDate: string;
  endDate: string;
  status?: string;
}

interface Template {
  _id: string;
  name: string;
  templateType: string;
  isActive: boolean;
}

// Define the menu item interface
interface MenuItem {
  title: string;
  icon: string;
  desc: string;
  path: string;
  meta?: string;
  color: string;
  allowedRoles: string[]; // Roles that can see this item. Empty array = everyone.
}

export default function PerformancePage() {
  const { user, hasRole, isLoading: authLoading } = useAuth();
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [cyclesData, templatesData] = await Promise.all([
        api.get<Cycle[]>('/performance/cycles').catch(() => []),
        api.get<Template[]>('/performance/templates?activeOnly=true').catch(() => []),
      ]);
      setCycles(cyclesData || []);
      setTemplates(templatesData || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  const allMenuItems: MenuItem[] = [
    {
      title: 'Templates',
      icon: '📋',
      desc: 'Manage appraisal templates and rating scales',
      path: '/performance/templates',
      meta: `${templates.length} active template${templates.length !== 1 ? 's' : ''}`,
      color: 'bg-blue-50 text-blue-600',
      allowedRoles: ['HR Manager', 'System Admin', 'HR Admin'],
    },
    {
      title: 'Cycles',
      icon: '🔄',
      desc: 'Create and manage appraisal cycles',
      path: '/performance/cycles',
      meta: `${cycles.length} cycle${cycles.length !== 1 ? 's' : ''}`,
      color: 'bg-purple-50 text-purple-600',
      allowedRoles: ['HR Manager', 'System Admin', 'HR Admin'],
    },
    {
      title: 'Assignments',
      icon: '📝',
      desc: 'Assign appraisals to employees and managers',
      path: '/performance/assignments',
      color: 'bg-indigo-50 text-indigo-600',
      allowedRoles: ['HR Manager', 'HR Employee', 'System Admin', 'HR Admin'],
    },
    {
      title: 'My Evaluations',
      icon: '⭐',
      desc: 'Complete assigned appraisals for yourself or team',
      path: '/performance/evaluations',
      color: 'bg-yellow-50 text-yellow-600',
      allowedRoles: [], // Visible to everyone
    },
    {
      title: 'My Appraisals',
      icon: '📊',
      desc: 'View your final published appraisal results',
      path: '/performance/my-appraisals',
      color: 'bg-green-50 text-green-600',
      allowedRoles: [], // Visible to everyone
    },
    {
      title: 'HR Dashboard',
      icon: '📈',
      desc: 'Monitor appraisal progress and completion',
      path: '/performance/dashboard',
      color: 'bg-red-50 text-red-600',
      allowedRoles: ['HR Manager', 'HR Employee', 'System Admin', 'HR Admin'],
    },
    {
      title: 'Publish Appraisals',
      icon: '📤',
      desc: 'Review and publish manager-submitted appraisals',
      path: '/performance/publish',
      color: 'bg-teal-50 text-teal-600',
      allowedRoles: ['HR Manager', 'HR Employee', 'System Admin', 'HR Admin'],
    },
    {
      title: 'Disputes',
      icon: '⚖️',
      desc: 'Manage and resolve employee disputes',
      path: '/performance/disputes',
      color: 'bg-orange-50 text-orange-600',
      allowedRoles: ['HR Manager', 'System Admin', 'HR Admin'],
    },
  ];

  // System Admnis should see everything
  const isAdmin = hasRole('System Admin') || hasRole('HR Admin');

  const visibleMenuItems = allMenuItems.filter((item) => {
    if (isAdmin) return true;
    if (item.allowedRoles.length === 0) return true;
    return item.allowedRoles.some((role) => hasRole(role));
  });

  return (
    <div className="max-w-[1400px] mx-auto p-6 space-y-8 animate-fade-in-up">
      <style jsx global>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.6s ease-out forwards;
        }
      `}</style>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Performance Management</h1>
        <p className="text-gray-500">Manage employee appraisals, templates, cycles, and evaluations</p>
      </div>

      {error && (
        <div className="alert alert-error">
          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      {/* Menu Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {visibleMenuItems.map((item, index) => (
          <Link
            href={item.path}
            key={item.path}
            className="group no-underline"
            style={{
              opacity: 0,
              animation: `fadeInUp 0.5s ease-out forwards ${index * 50}ms`
            }}
          >
            <div className="bg-white border border-gray-200 rounded-xl p-6 h-full transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-blue-100">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl ${item.color} transform group-hover:scale-110 transition-transform duration-300`}>
                  {item.icon}
                </div>
                {item.meta && (
                  <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                    {item.meta}
                  </span>
                )}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                {item.title}
              </h3>
              <p className="text-sm text-gray-500 group-hover:text-gray-600 transition-colors">
                {item.desc}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent Cycles Table - Only visible if you have access to cycles */}
      {cycles.length > 0 && (hasRole('HR_MANAGER') || hasRole('Admin')) && (
        <div
          className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm"
          style={{
            opacity: 0,
            animation: `fadeInUp 0.6s ease-out forwards 400ms`
          }}
        >
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Recent Cycles</h2>
            <Link href="/performance/cycles" className="text-sm font-medium text-blue-600 hover:text-blue-700">View All</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-500 uppercase">
                <tr>
                  <th className="px-6 py-3 font-medium">Name</th>
                  <th className="px-6 py-3 font-medium">Type</th>
                  <th className="px-6 py-3 font-medium">Start Date</th>
                  <th className="px-6 py-3 font-medium">End Date</th>
                  <th className="px-6 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {cycles.slice(0, 5).map((cycle) => (
                  <tr key={cycle._id} className="hover:bg-blue-50/50 transition-colors group">
                    <td className="px-6 py-4 font-medium text-gray-900">{cycle.name}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                        {cycle.cycleType}
                      </span>
                    </td>
                    <td className="px-6 py-4">{new Date(cycle.startDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4">{new Date(cycle.endDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/performance/cycles/${cycle._id}`}
                        className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium hover:underline opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        Details <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

