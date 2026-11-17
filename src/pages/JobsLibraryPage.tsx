import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Briefcase, Plus, Search, FileText, ArrowRight, Trash2, Clock, CheckCircle2, ChevronRight } from 'lucide-react';
import { useJobs } from '../context/JobContext';
import { JobItem } from '../types';
import { usePrefetchJob } from '../hooks/usePrefetch';
import { JobListSkeleton } from '../components/Skeletons';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';
import { useToast } from '../context/ToastContext';

export const JobsLibraryPage: React.FC = () => {
  const navigate = useNavigate();
  const { jobs, deleteJob } = useJobs();
  const { toast } = useToast();
  const { prefetchJob } = usePrefetchJob();
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [jobToDelete, setJobToDelete] = useState<JobItem | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  const filteredJobs = jobs.filter(j => 
    j.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (j.company && j.company.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen selection:bg-purple-100 selection:text-purple-900 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 space-y-8">
        
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200/50 dark:border-neutral-800/50 pb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 text-neutral-900 dark:text-neutral-100 text-xs font-semibold mb-2 border border-purple-500/20">
              <Briefcase className="w-3.5 h-3.5" />
              <span>JOB LIBRARY</span>
            </div>
            <h1 className="text-3xl font-serif-title font-normal text-neutral-900 dark:text-white tracking-tight">
              My Jobs
            </h1>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1 max-w-xl">
              Create jobs, attach resumes, and rank candidates against each role.
            </p>
          </div>

          <button
            onClick={() => navigate('/jobs/new')}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-xs rounded-xl shadow-sm transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>New Job</span>
          </button>
        </div>

        {/* Filter / Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xs">
          <div className="relative w-full sm:w-80">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search jobs by title or company..."
              className="w-full pl-8 pr-3 py-1.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            />
          </div>

          <span className="text-xs text-neutral-500 font-medium">
            Showing {filteredJobs.length} active job{filteredJobs.length === 1 ? '' : 's'}
          </span>
        </div>

        {/* Jobs List */}
        {isLoading ? (
          <JobListSkeleton count={3} />
        ) : filteredJobs.length === 0 ? (
          jobs.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="relative overflow-hidden bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border border-neutral-200/80 dark:border-neutral-800/80 rounded-3xl p-8 sm:p-14 text-center shadow-xs space-y-8"
            >
              {/* Ambient Glow */}

              <div className="relative z-10 max-w-lg mx-auto space-y-6">
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.3, ease: 'easeOut' }}
                  className="w-14 h-14 rounded-2xl bg-gradient-to-b from-purple-500/10 to-purple-500/5 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto border border-purple-500/20 shadow-xs"
                >
                  <Briefcase className="w-7 h-7" />
                </motion.div>

                <div className="space-y-2">
                  <h3 className="text-2xl font-serif-title font-normal text-neutral-900 dark:text-white tracking-tight">
                    No Job Positions Created Yet
                  </h3>
                  <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed max-w-md mx-auto">
                    Create your first job listing to start attaching candidate resumes, running automated AI skill match rankings, and generating candidate shortlist reports.
                  </p>
                </div>

                {/* Quick Action Steps */}
                <motion.div 
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                  className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-left"
                >
                  <div className="p-3.5 rounded-xl bg-neutral-50/80 dark:bg-neutral-800/50 border border-neutral-200/60 dark:border-neutral-800/60 space-y-1">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">Step 1</div>
                    <div className="text-xs font-semibold text-neutral-900 dark:text-white">Add Job Description</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-neutral-50/80 dark:bg-neutral-800/50 border border-neutral-200/60 dark:border-neutral-800/60 space-y-1">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">Step 2</div>
                    <div className="text-xs font-semibold text-neutral-900 dark:text-white">Attach Resumes</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-neutral-50/80 dark:bg-neutral-800/50 border border-neutral-200/60 dark:border-neutral-800/60 space-y-1">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">Step 3</div>
                    <div className="text-xs font-semibold text-neutral-900 dark:text-white">AI Match & Ranking</div>
                  </div>
                </motion.div>

                <div className="pt-2">
                  <button
                    onClick={() => navigate('/jobs/new')}
                    className="inline-flex items-center gap-2 px-5 py-3 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 font-semibold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Your First Job</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-12 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500 flex items-center justify-center mx-auto">
                <Search className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold font-serif-title text-neutral-900 dark:text-white">
                  No matching jobs found
                </h3>
                <p className="text-xs text-neutral-500 mt-1">
                  No job positions match your current search query "{searchQuery}".
                </p>
              </div>
              <button
                onClick={() => setSearchQuery('')}
                className="px-3.5 py-1.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white font-semibold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Clear Search Filter
              </button>
            </div>
          )
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredJobs.map((job) => (
              <div
                key={job.id}
                onClick={() => navigate(`/jobs/${job.id}`)}
                onMouseEnter={() => prefetchJob(job.id)}
                onFocus={() => prefetchJob(job.id)}
                tabIndex={0}
                className="group bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-xs hover:border-neutral-400 dark:hover:border-neutral-600 transition-all flex flex-col justify-between space-y-6 cursor-pointer relative"
              >
                <div className="space-y-4">
                  {/* Top Bar */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-500/10 text-neutral-900 dark:text-neutral-100 border border-purple-500/20">
                          {job.status === 'Screened' ? 'Screened' : 'Active'}
                        </span>
                        {job.company && (
                          <span className="text-xs font-semibold text-neutral-500 truncate">
                            {job.company}
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-bold font-serif-title text-neutral-900 dark:text-white group-hover:text-purple-600 transition-colors truncate">
                        {job.title}
                      </h3>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setJobToDelete(job);
                        setDeleteModalOpen(true);
                      }}
                      className="p-1.5 text-neutral-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                      title="Delete Job"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Description preview */}
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-3 leading-relaxed">
                    {job.description}
                  </p>

                  {/* Metadata Info */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800 text-xs">
                    <div className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400">
                      <FileText className="w-3.5 h-3.5 text-neutral-400" />
                      <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                        {job.attachedResumeIds.length} resume{job.attachedResumeIds.length === 1 ? '' : 's'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400">
                      <Clock className="w-3.5 h-3.5 text-neutral-400" />
                      <span>Last updated {job.lastUpdated}</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Action Indicator */}
                <div className="pt-2 flex items-center justify-between text-xs font-semibold text-neutral-900 dark:text-white group-hover:text-purple-600 transition-colors">
                  <span>Open Screening Workspace</span>
                  <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setJobToDelete(null);
        }}
        onConfirm={() => {
          if (jobToDelete) {
            deleteJob(jobToDelete.id);
            toast.success(`Job "${jobToDelete.title}" deleted`, { title: 'Job Deleted' });
          }
          setDeleteModalOpen(false);
          setJobToDelete(null);
        }}
        title="Delete Job Position"
        itemName={jobToDelete?.title}
        itemType="job"
        description="Are you sure you want to delete this job position? All attached candidate resumes and match reports for this position will be detached."
        confirmText="Delete Job"
      />
    </div>
  );
};
