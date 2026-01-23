'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/app/lib/useAuth';
import { useRouter } from 'next/navigation';
import { User, Bell, ChevronRight, TrendingUp, Users, CheckCircle, AlertCircle, Send, FileText, Layout } from 'lucide-react';

interface Cycle {
  _id: string;
  name: string;
}

interface DashboardStats {
  totalAssignments: number;
  notStarted: number;
  inProgress: number;
  submitted: number;
  published: number;
  acknowledged: number;
  completionRate: number;
}

export default function DashboardPage() {
  const { user, hasRole, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [selectedCycle, setSelectedCycle] = useState('');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState('');

  // Form state
  const [sendingReminders, setSendingReminders] = useState(false);
  const [reminderSuccess, setReminderSuccess] = useState('');

  const handleSendReminders = async () => {
    if (sendingReminders) return;

    if (!selectedCycle) {
      setError('Please select an appraisal cycle from the dropdown.');
      return;
    }

    // Safety check for stats
    const noPending = !stats || (stats.notStarted === 0 && stats.inProgress === 0);
    if (noPending) {
      return;
    }

    setSendingReminders(true);
    setReminderSuccess('');
    setError('');

    try {
      const response = await api.post<{ sentCount: number }>(`/performance/cycles/${selectedCycle}/reminders`, {});
      console.log('[Performance] API Response received:', response);

      if (response && typeof response.sentCount === 'number') {
        setReminderSuccess(`Successfully sent ${response.sentCount} notifications.`);
      } else {
        setReminderSuccess('Reminders processed successfully.');
      }
    } catch (err: any) {
      console.error('[Performance] API Fatal Error:', err);
      setError(err.message || 'Failed to send reminders. Please try again.');
    } finally {
      setSendingReminders(false);
    }

    // Clear success message after 4s
    setTimeout(() => setReminderSuccess(''), 4000);
  };

  // Animation delay helper
  const getDelay = (index: number) => `${index * 100}ms`;

  useEffect(() => {
    if (!authLoading) {
      const isAllowed = hasRole('HR Manager') || hasRole('HR Employee') || hasRole('System Admin') || hasRole('HR Admin');
      if (!isAllowed) {
        // Redirect or just show error
        setError('Access Denied: You do not have permission to view this dashboard.');
        setDataLoading(false);
      } else {
        loadCycles();
      }
    }
  }, [authLoading, hasRole]);

  useEffect(() => {
    if (selectedCycle) {
      loadStats();
    }
  }, [selectedCycle]);

  const loadCycles = async () => {
    try {
      const data = await api.get<Cycle[]>('/performance/cycles');
      setCycles(data || []);
      if (data && data.length > 0) {
        setSelectedCycle(data[0]._id);
      } else {
        setDataLoading(false);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load cycles');
      setDataLoading(false);
    }
  };

  const loadStats = async () => {
    console.log('[Performance] loadStats: Firing for cycle', selectedCycle);
    try {
      const assignments = await api.get<any[]>(`/performance/cycles/${selectedCycle}/assignments`).catch(() => []);
      console.log('[Performance] loadStats: Received', assignments.length, 'assignments');

      const total = assignments.length;
      const notStarted = assignments.filter((a: any) => a.status === 'NOT_STARTED').length;
      const inProgress = assignments.filter((a: any) => a.status === 'IN_PROGRESS').length;
      const submitted = assignments.filter((a: any) => a.status === 'SUBMITTED').length;
      const published = assignments.filter((a: any) => a.status === 'PUBLISHED').length;
      const acknowledged = assignments.filter((a: any) => a.status === 'ACKNOWLEDGED').length;
      const completionRate = total > 0 ? ((submitted + published + acknowledged) / total) * 100 : 0;

      setStats({
        totalAssignments: total,
        notStarted,
        inProgress,
        submitted,
        published,
        acknowledged,
        completionRate,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load statistics');
    } finally {
      setDataLoading(false);
    }
  };

  const DonutChart = ({ stats }: { stats: DashboardStats }) => {
    const total = stats.totalAssignments || 1; // Prevent division by zero
    const radius = 80;
    const circumference = 2 * Math.PI * radius;

    // Calculate segments
    const segments = [
      { name: 'Acknowledged', value: stats.acknowledged, color: '#15803d' }, // green-700
      { name: 'Published', value: stats.published, color: '#22c55e' }, // green-500
      { name: 'Submitted', value: stats.submitted, color: '#3b82f6' }, // blue-500
      { name: 'In Progress', value: stats.inProgress, color: '#facc15' }, // yellow-400
      { name: 'Not Started', value: stats.notStarted, color: '#9ca3af' }, // gray-400
    ];

    let currentAngle = 0;

    return (
      <div className="relative flex items-center justify-center">
        <svg className="transform -rotate-90 w-64 h-64">
          {segments.map((segment, i) => {
            const strokeDasharray = `${(segment.value / total) * circumference} ${circumference}`;
            const strokeDashoffset = -currentAngle;
            currentAngle += (segment.value / total) * circumference;
            // Only render if value > 0 to avoid artifacts
            if (segment.value === 0) return null;

            return (
              <circle
                key={segment.name}
                r={radius}
                cx="128"
                cy="128"
                fill="transparent"
                stroke={segment.color}
                strokeWidth="24"
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-1000 ease-out hover:opacity-80 cursor-pointer"
              >
                <title>{`${segment.name}: ${segment.value}`}</title>
              </circle>
            );
          })}
          {/* Inner Text */}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-3xl font-bold text-gray-800">{stats.totalAssignments}</span>
          <span className="text-xs text-gray-500 uppercase tracking-wide">Total</span>
        </div>
      </div>
    );
  };

  if (authLoading || dataLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If unauthorized or error
  if (error && error.includes('Access Denied')) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-600">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m4 0h2m-2 0v-2m0 2v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Restricted</h2>
        <p className="text-gray-500 max-w-md">
          This dashboard is restricted to HR Managers and Administrators. Please contact your system administrator if you believe this is an error.
        </p>
        <button
          onClick={() => router.push('/performance')}
          className="mt-6 px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
        >
          Return to Performance Menu
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto p-6 space-y-8 animate-fade-in-up">
      <style jsx global>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.6s ease-out forwards;
        }
      `}</style>

      {/* Success Toast */}
      {reminderSuccess && (
        <div className="fixed top-24 right-6 bg-green-600 text-white px-6 py-3 rounded-lg shadow-xl z-50 animate-bounce">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            {reminderSuccess}
          </div>
        </div>
      )}

      {/* Unified Action Bar (Glassmorphism Header) */}
      <div className="sticky top-0 z-40 bg-white/70 backdrop-blur-md border-b border-gray-100 -mx-6 px-6 py-4 mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 max-w-[1550px] mx-auto">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white text-lg">📈</div>
              Performance Dashboard
            </h1>
            <p className="text-gray-500 text-sm mt-0.5">
              Monitoring <span className="text-blue-600 font-semibold">{cycles.find((c: Cycle) => c._id === selectedCycle)?.name || 'Active Cycle'}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-400 hidden lg:block">Select Cycle:</span>
            <div className="w-full md:w-64 relative group">
              <select
                className="w-full appearance-none bg-white rounded-xl border border-gray-200 shadow-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 py-2.5 pl-4 pr-10 text-gray-700 font-medium cursor-pointer transition-all hover:bg-gray-50 hover:border-gray-300"
                value={selectedCycle}
                onChange={(e) => setSelectedCycle(e.target.value)}
              >
                {cycles.map((cycle: Cycle) => (
                  <option key={cycle._id} value={cycle._id}>
                    {cycle.name}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-400 group-hover:text-blue-500 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {error && !error.includes('Access Denied') && (
        <div className="alert alert-error">
          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      {stats && (
        <>
          {/* Metric Ribbon */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Completion Rate - Sleek Widget */}
            <div className="md:col-span-2 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm overflow-hidden relative group transition-all hover:shadow-md h-32"
              style={{ animation: 'fadeInUp 0.6s ease-out forwards', animationDelay: '100ms', opacity: 0 }}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
              <div className="relative flex items-center justify-between h-full">
                <div className="flex-1">
                  <h2 className="text-gray-400 font-bold text-xs uppercase tracking-widest mb-1">Company-wide Completion</h2>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black text-gray-900 leading-none">{stats.completionRate.toFixed(1)}%</span>
                    <span className="text-green-500 text-xs font-bold leading-none mb-1">↑ 2.4%</span>
                  </div>
                  <div className="mt-4 w-full bg-gray-100 rounded-full h-1.5">
                    <div
                      className="bg-blue-600 h-1.5 rounded-full transition-all duration-1000 ease-out shadow-[0_0_12px_rgba(37,99,235,0.4)]"
                      style={{ width: `${stats.completionRate}%` }}
                    ></div>
                  </div>
                </div>
                <div className="ml-6 p-4 bg-blue-50 rounded-2xl text-blue-600 hidden sm:block">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                </div>
              </div>
            </div>

            {/* Total Participants */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm group hover:shadow-md transition-all h-32"
              style={{ animation: 'fadeInUp 0.6s ease-out forwards', animationDelay: '200ms', opacity: 0 }}>
              <h3 className="text-gray-400 font-bold text-xs uppercase tracking-widest mb-1">Participants</h3>
              <div className="text-4xl font-black text-gray-900 leading-none mb-1">{stats.totalAssignments}</div>
              <div className="flex items-center gap-1.5 mt-4">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-[10px] font-bold text-gray-400 overflow-hidden">
                      <User size={12} />
                    </div>
                  ))}
                </div>
                <span className="text-xs text-gray-400 font-medium">+15 more</span>
              </div>
            </div>

            {/* Submissions Status */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all h-32"
              style={{ animation: 'fadeInUp 0.6s ease-out forwards', animationDelay: '300ms', opacity: 0 }}>
              <h3 className="text-gray-400 font-bold text-xs uppercase tracking-widest mb-1">Submitted</h3>
              <div className="text-4xl font-black text-blue-600 leading-none mb-1">{stats.submitted + stats.published + stats.acknowledged}</div>
              <p className="text-[10px] text-gray-400 font-bold uppercase mt-4">Out of {stats.totalAssignments} total</p>
            </div>
          </div>

          {/* Main Action Area */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Left Column: Analytics & Status */}
            <div className="space-y-6"
              style={{ animation: 'fadeInUp 0.6s ease-out forwards', animationDelay: '400ms', opacity: 0 }}>
              <div className="bg-white p-7 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-2">
                    <Layout size={18} className="text-blue-500" />
                    Status Analysis
                  </h3>
                  <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                    <TrendingUp size={16} />
                  </div>
                </div>

                <div className="flex justify-center mb-8 transform hover:scale-105 transition-transform duration-500">
                  <DonutChart stats={stats} />
                </div>

                <div className="space-y-4">
                  {[
                    { label: 'Not Started', value: stats.notStarted, color: 'bg-gray-400', textColor: 'text-gray-600' },
                    { label: 'In Progress', value: stats.inProgress, color: 'bg-yellow-400', textColor: 'text-yellow-600' },
                    { label: 'Submitted', value: stats.submitted, color: 'bg-blue-500', textColor: 'text-blue-600' },
                    { label: 'Published', value: stats.published, color: 'bg-green-500', textColor: 'text-green-600' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between group cursor-default">
                      <div className="flex items-center gap-3">
                        <div className={`w-2.5 h-2.5 rounded-full ${item.color} ring-4 ring-offset-2 ring-transparent group-hover:ring-gray-100 transition-all`}></div>
                        <span className="text-sm font-semibold text-gray-700">{item.label}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-24 h-1.5 bg-gray-50 rounded-full overflow-hidden hidden sm:block">
                          <div className={`h-full ${item.color}`} style={{ width: `${(item.value / stats.totalAssignments) * 100}%` }}></div>
                        </div>
                        <span className={`text-sm font-black tabular-nums ${item.textColor}`}>{item.value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Key Actions Grid */}
            <div className="lg:col-span-2 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Needs Attention Card */}
                <div
                  className={`group relative overflow-hidden rounded-3xl p-8 border transition-all duration-500 transform hover:-translate-y-2 ${(!stats || (stats.notStarted === 0 && stats.inProgress === 0))
                    ? 'bg-gray-50 border-gray-100'
                    : 'bg-white border-orange-100 shadow-[0_20px_50px_rgba(251,146,60,0.12)] hover:shadow-[0_20px_50px_rgba(251,146,60,0.2)]'
                    }`}
                  style={{ animation: 'fadeInUp 0.6s ease-out forwards', animationDelay: '500ms', opacity: 0 }}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-125 duration-700 opacity-50"></div>

                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-6">
                      <div className={`p-4 rounded-2xl shadow-sm transition-all duration-300 group-hover:rotate-12 ${(!stats || (stats.notStarted === 0 && stats.inProgress === 0)) ? 'bg-gray-200 text-gray-400' : 'bg-orange-500 text-white shadow-orange-200'}`}>
                        <AlertCircle size={24} strokeWidth={2.5} />
                      </div>
                      <span className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider ${(!stats || (stats.notStarted === 0 && stats.inProgress === 0)) ? 'bg-gray-200 text-gray-500' : 'bg-orange-100 text-orange-600'}`}>
                        {stats.notStarted + stats.inProgress} Delayed
                      </span>
                    </div>

                    <h3 className="text-xl font-black text-gray-900 mb-2">Cycle Reminders</h3>
                    <p className="text-sm text-gray-500 mb-8 leading-relaxed">
                      Nudge employees who haven&apos;t started or finished their self-evaluations.
                    </p>

                    <button
                      onClick={handleSendReminders}
                      disabled={sendingReminders || !stats || (stats.notStarted === 0 && stats.inProgress === 0)}
                      className={`w-full py-4 rounded-xl font-extrabold flex items-center justify-center gap-2 transition-all active:scale-95 ${(!stats || (stats.notStarted === 0 && stats.inProgress === 0))
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-orange-600 text-white hover:bg-orange-700 shadow-lg shadow-orange-300/50'
                        }`}
                    >
                      {sendingReminders ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send size={18} strokeWidth={2.5} />
                          Broadcast Reminders
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Ready to Publish Card */}
                <div
                  className="group relative overflow-hidden rounded-3xl p-8 bg-white border border-blue-100 shadow-[0_20px_50px_rgba(37,99,235,0.08)] hover:shadow-[0_20px_50px_rgba(37,99,235,0.15)] transition-all duration-500 transform hover:-translate-y-2"
                  style={{ animation: 'fadeInUp 0.6s ease-out forwards', animationDelay: '600ms', opacity: 0 }}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-125 duration-700 opacity-50"></div>

                  <div className="relative z-10 h-full flex flex-col">
                    <div className="flex justify-between items-start mb-6">
                      <div className="p-4 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-200 transition-all duration-300 group-hover:-rotate-12">
                        <FileText size={24} strokeWidth={2.5} />
                      </div>
                      <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-lg text-xs font-black uppercase tracking-wider">
                        {stats.submitted} Pending Review
                      </span>
                    </div>

                    <h3 className="text-xl font-black text-gray-900 mb-2">Publish Results</h3>
                    <p className="text-sm text-gray-500 mb-8 leading-relaxed">
                      Finalize and publish manager-submitted appraisals to employees.
                    </p>

                    <button
                      onClick={() => router.push('/performance/publish')}
                      className="mt-auto w-full py-4 rounded-xl bg-gray-900 text-white font-extrabold flex items-center justify-center gap-2 hover:bg-black transition-all shadow-lg active:scale-95"
                    >
                      Process & Publish
                      <ChevronRight size={18} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>

                {/* Completion Celebration Widget */}
                <div
                  className="sm:col-span-2 relative overflow-hidden rounded-3xl p-8 bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-xl shadow-green-200"
                  style={{ animation: 'fadeInUp 0.6s ease-out forwards', animationDelay: '700ms', opacity: 0 }}
                >
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-2xl animate-pulse"></div>
                  <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
                    <div className="p-5 bg-white/20 rounded-full backdrop-blur-md border border-white/30 transform transition-transform hover:rotate-12">
                      <CheckCircle size={40} strokeWidth={2.5} />
                    </div>
                    <div className="text-center md:text-left">
                      <h3 className="text-2xl font-black mb-1">Success Milestone reached!</h3>
                      <p className="text-green-100 text-sm font-medium">
                        Excellent progress. <span className="underline decoration-white/40">{stats.published} evaluations</span> are fully completed and archived.
                        That&apos;s <span className="font-bold text-white">{((stats.published / (stats.totalAssignments || 1)) * 100).toFixed(0)}%</span> of this cycle.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

