import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Check, ArrowRight, CreditCard, Sparkles, BarChart2, ShieldCheck, History } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

interface TransactionItem {
  id: string;
  feature: string;
  amount: number;
  type: string;
  date: string;
}

export const CreditsPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, credits, plan } = useAuth();
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchRealTransactions = async () => {
      if (!user) {
        setTransactions([]);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('credit_transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.warn('Error querying credit_transactions from Supabase:', error);
        }

        const mapped: TransactionItem[] = (data || []).map((t: any) => ({
          id: t.id,
          feature: t.description,
          amount: t.amount,
          type: t.type,
          date: new Date(t.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        }));

        setTransactions(mapped);
      } catch (err) {
        console.error('Error fetching transactions:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRealTransactions();
  }, [user]);

  return (
    <div className="min-h-screen selection:bg-purple-100 selection:text-purple-900 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 space-y-8">
        
        {/* Page Title */}
        <div className="border-b border-neutral-200/50 dark:border-neutral-800/50 pb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 text-neutral-900 dark:text-neutral-100 text-xs font-semibold mb-2">
            <Zap className="w-3.5 h-3.5 fill-current text-purple-600" />
            <span>CREDITS & BILLING</span>
          </div>
          <h1 className="text-3xl font-serif-title font-normal text-neutral-900 dark:text-white tracking-tight">
            AI Credits & Subscription
          </h1>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1 max-w-xl">
            Monitor your available neural analysis credits, review transaction history, and manage your subscription.
          </p>
        </div>

        {/* Credit Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Main Credits Balance Box */}
          <div className="md:col-span-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 block">
                  Available Neural Credits
                </span>
                <div className="text-4xl font-serif-title font-normal text-neutral-900 dark:text-white mt-1">
                  {credits} <span className="text-lg font-sans text-neutral-400 font-normal">Credits Available</span>
                </div>
              </div>

              <div className="px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold text-xs border border-emerald-500/20">
                {plan === 'pro' ? 'Pro Plan (Active)' : plan === 'career_max' ? 'Pro Max Plan (Active)' : 'Free Starter Plan (Active)'}
              </div>
            </div>

            {/* Usage History Section */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-900 dark:text-white block uppercase tracking-wider">
                  Transaction & Credit History
                </span>
              </div>

              {loading ? (
                <div className="p-6 text-center text-xs text-neutral-400">
                  Loading transaction history...
                </div>
              ) : transactions.length === 0 ? (
                /* POLISHED EMPTY STATE */
                <div className="p-8 text-center bg-neutral-50 dark:bg-neutral-950 border border-neutral-200/80 dark:border-neutral-800/80 rounded-xl space-y-2">
                  <History className="w-6 h-6 mx-auto text-neutral-400" />
                  <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    No transactions recorded yet
                  </p>
                  <p className="text-xs text-neutral-400">
                    Your credit additions, bonus allocations, and analysis deductions will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {transactions.map((tx) => (
                    <div 
                      key={tx.id} 
                      className="flex items-center justify-between p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200/80 dark:border-neutral-800/80 text-xs transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <BarChart2 className="w-4 h-4 text-purple-600 shrink-0" />
                        <div>
                          <span className="font-semibold text-neutral-800 dark:text-neutral-200 block">{tx.feature}</span>
                          <span className="text-[11px] text-neutral-400">{tx.type}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`font-mono font-bold ${tx.amount >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-neutral-900 dark:text-white'}`}>
                          {tx.amount >= 0 ? `+${tx.amount}` : tx.amount} credits
                        </span>
                        <span className="text-neutral-400 text-[11px]">{tx.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Current Active Plan Box */}
          <div className="bg-neutral-900 dark:bg-neutral-900 text-white border border-neutral-800 rounded-2xl p-6 shadow-md flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase font-bold tracking-widest px-2.5 py-1 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  ACTIVE SUBSCRIPTION
                </span>
              </div>

              <div>
                <h3 className="text-2xl font-serif-title font-normal text-white">
                  {plan === 'pro' ? 'Pro Plan' : plan === 'career_max' ? 'Pro Max Plan' : 'Free Starter Plan'}
                </h3>
                <p className="text-xs text-neutral-400 mt-1">
                  {plan === 'pro' ? 'Pro Tier • 50 AI Credits Included' : plan === 'career_max' ? 'Pro Max Tier • 150 AI Credits Included' : 'Free Tier • 10 Welcome Credits Included'}
                </p>
              </div>

              <div className="space-y-2.5 pt-2 text-xs text-neutral-300">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Real-time ATS Resume Audits</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Job Candidate Screening</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>AI Skill Gap Detection</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Executive PDF Report Exports</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <button 
                onClick={() => navigate('/pricing')}
                className="w-full py-2.5 bg-white text-neutral-900 hover:bg-neutral-100 font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                View Upgrade Options
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
