import React, { useState, useEffect } from 'react';
import { FileText, Download, Share2, Filter, Search, ArrowRight, Loader2, CheckCircle2, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { generateAndDownloadPDF, PDFReportData } from '../services/pdfExporter';
import { apiClient } from '../lib/api';

interface ReportItem extends PDFReportData {} // removed pdfData 

export const ReportsPage: React.FC = () => {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'All' | 'ATS Audit' | 'Job Screening'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [exportingId, setExportingId] = useState<string | null>(null);
  const [exportStatus, setExportStatus] = useState<Record<string, 'idle' | 'exporting' | 'success' | 'error'>>({});

  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRealReports = async () => {
      if (!user) {
        setReports([]);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('analysis_reports')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.warn('Error fetching user reports from Supabase:', error);
        }

        const mapped: ReportItem[] = (data || []).map((r: any) => ({
          id: r.id,
          title: r.title,
          type: (r.report_type as any) || 'ATS Audit',
          date: new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          candidateName: r.candidate_name,
          score: r.score,
          atsPassRate: r.ats_pass_rate,
          dataJson: r.data_json,
        }));

        setReports(mapped);
      } catch (err) {
        console.error('Error querying reports:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRealReports();
  }, [user]);

  const handleExportPDF = async (report: ReportItem) => {
    setExportingId(report.id);
    setExportStatus((prev) => ({ ...prev, [report.id]: 'exporting' }));

    try {
      // Backend export verification
      await apiClient.exportReport(report.id);

      await generateAndDownloadPDF(report);
      setExportStatus((prev) => ({ ...prev, [report.id]: 'success' }));
      toast.success(`PDF report for "${report.title}" downloaded successfully!`, { title: 'Export Complete' });

      setTimeout(() => {
        setExportStatus((prev) => ({ ...prev, [report.id]: 'idle' }));
      }, 3000);
    } catch (err) {
      console.error('PDF export failed:', err);
      setExportStatus((prev) => ({ ...prev, [report.id]: 'error' }));
      toast.error('Export Failed — We couldn\'t generate the PDF. Please try again.', { title: 'Export Failed' });
    } finally {
      setExportingId(null);
    }
  };

  const filteredReports = reports.filter(r => {
    const matchesTab = activeTab === 'All' || r.type === activeTab;
    const matchesSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          r.candidateName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="min-h-screen selection:bg-purple-100 selection:text-purple-900 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 space-y-8">
        
        {/* Header */}
        <div className="border-b border-neutral-200/50 dark:border-neutral-800/50 pb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 text-neutral-900 dark:text-neutral-100 text-xs font-semibold mb-2">
            <FileText className="w-3.5 h-3.5" />
            <span>EXECUTIVE INTELLIGENCE</span>
          </div>
          <h1 className="text-3xl font-serif-title font-normal text-neutral-900 dark:text-white tracking-tight">
            Saved Reports & Audits
          </h1>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1 max-w-xl">
            Access exported ATS evaluation audits, candidate comparison matrices, and interview readiness summaries.
          </p>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xs">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {(['All', 'ATS Audit', 'Job Screening', 'Interview Summary'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === tab
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reports..."
              className="w-full pl-8 pr-3 py-1.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            />
          </div>
        </div>

        {/* Reports Content */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div 
                key={i} 
                className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6 animate-pulse"
              >
                <div className="space-y-3 max-w-2xl w-full">
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-20 bg-neutral-200 dark:bg-neutral-800 rounded"></div>
                    <div className="h-4 w-24 bg-neutral-100 dark:bg-neutral-800/60 rounded"></div>
                  </div>
                  <div className="h-5 w-3/4 bg-neutral-200 dark:bg-neutral-800 rounded mt-1"></div>
                  <div className="h-4 w-full max-w-md bg-neutral-100 dark:bg-neutral-800/60 rounded"></div>
                </div>
                
                <div className="flex items-center shrink-0 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-100 dark:border-neutral-800">
                  <div className="w-full sm:w-[130px] h-8 bg-neutral-200 dark:bg-neutral-800 rounded-xl"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredReports.length === 0 ? (
          /* POLISHED EMPTY STATE */
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-12 text-center max-w-lg mx-auto my-8 shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold font-serif-title text-neutral-900 dark:text-white">
              No reports yet
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2 max-w-sm mx-auto leading-relaxed">
              Analyze a resume or complete a job candidate screening to generate your first executive audit report.
            </p>
            <button
              onClick={() => navigate('/resume')}
              className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-medium text-xs rounded-xl transition-all shadow-sm cursor-pointer"
            >
              <span>Go to Resume Workspace</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          /* Reports List */
          <div className="space-y-4">
            {filteredReports.map((report) => {
              const status = exportStatus[report.id] || 'idle';
              const isExporting = exportingId === report.id;

              return (
                <div
                  key={report.id}
                  className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-xs hover:border-neutral-400 dark:hover:border-neutral-600 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
                >
                  <div className="space-y-2 max-w-2xl">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-purple-500/10 text-neutral-900 dark:text-neutral-100 border border-purple-500/20">
                        {report.type}
                      </span>
                      <span className="text-xs text-neutral-400 font-medium">• {report.date}</span>
                    </div>

                    <h3 className="text-base font-bold font-serif-title text-neutral-900 dark:text-white">
                      {report.title}
                    </h3>

                    <p className="text-xs text-neutral-500">
                      Candidate: <strong className="text-neutral-800 dark:text-neutral-200">{report.candidateName}</strong> | Overall Score: <strong>{report.score}/100</strong> | ATS Compatibility: <strong>{report.atsPassRate}%</strong>
                    </p>
                  </div>

                  <div className="flex items-center shrink-0 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-100 dark:border-neutral-800">
                    <button
                      onClick={() => handleExportPDF(report)}
                      disabled={isExporting}
                      className="w-full sm:w-auto px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-100 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                    >
                      {isExporting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-400" />
                          <span>Generating PDF...</span>
                        </>
                      ) : status === 'success' ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>PDF Exported</span>
                        </>
                      ) : status === 'error' ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 text-rose-400" />
                          <span>Retry Export</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-3.5 h-3.5" />
                          <span>PDF Export</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
};

