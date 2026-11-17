import React from 'react';
import { ResumeIntelligenceModal } from './ResumeIntelligenceModal';
import { ResumeAnalysis } from '../types';

interface CandidateAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: ResumeAnalysis;
  onMatchWithJob?: () => void;
}

/**
 * Backward-compatible alias forwarding to ResumeIntelligenceModal
 */
export const CandidateAnalysisModal: React.FC<CandidateAnalysisModalProps> = (props) => {
  return <ResumeIntelligenceModal {...props} />;
};
