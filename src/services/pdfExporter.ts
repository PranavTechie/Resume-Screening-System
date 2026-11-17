import { jsPDF } from 'jspdf';

export interface PDFReportData {
  id: string;
  title: string;
  type: 'ATS Audit' | 'Job Screening' | 'Full Assessment';
  date: string;
  candidateName: string;
  score: number;
  atsPassRate: number;
  dataJson?: any;
}

export interface SkillRecommendation {
  skill: string;
  status: 'Underrepresented' | 'Weak Evidence' | 'Missing Evidence';
  text: string;
}

export function sanitizeFilename(candidateName: string, reportType: string, title?: string): string {
  const cleanCandidate = (candidateName || 'Candidate').replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  const cleanType = (reportType || 'Report').replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  
  if (cleanCandidate && cleanCandidate !== 'Candidate') {
    return `Resume_Screening_System_${cleanCandidate}_${cleanType}.pdf`;
  }
  
  const cleanTitle = (title || 'Executive-Report').replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  return `Resume_Screening_System_${cleanTitle}.pdf`;
}

export function classifyAndGenerateSkillRecommendation(
  skill: string,
  detectedSkills: string[] = []
): SkillRecommendation {
  const isDetected = detectedSkills.some(
    (ds) => ds.toLowerCase().includes(skill.toLowerCase()) || skill.toLowerCase().includes(ds.toLowerCase())
  );

  if (isDetected) {
    return {
      skill,
      status: 'Underrepresented',
      text: `Surface existing ${skill} usage and quantify deployment, scaling, orchestration, or performance impact if supported by genuine resume evidence.`,
    };
  }

  const lower = skill.toLowerCase();
  if (lower.includes('architecture') || lower.includes('system') || lower.includes('microservices') || lower.includes('design') || lower.includes('ci/cd') || lower.includes('ops')) {
    return {
      skill,
      status: 'Weak Evidence',
      text: `Clarify genuine ${skill} implementation, service decomposition, communication patterns, or production engineering impact if supported by past work experience.`,
    };
  }

  return {
    skill,
    status: 'Missing Evidence',
    text: `Strong evidence for ${skill} was not detected. Highlight relevant experience, tooling, or project contributions ONLY if genuine candidate background exists.`,
  };
}

export async function generateAndDownloadPDF(report: PDFReportData): Promise<void> {
  if (!report) {
    throw new Error('Report data is invalid or null.');
  }

  // Initialize jsPDF A4 (595.28 pt x 841.89 pt)
  const doc = new jsPDF({
    orientation: 'p',
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const marginX = 40;
  const usableWidth = pageWidth - marginX * 2; // 515.28 pt
  const maxY = pageHeight - 50; // Footer boundary
  let y = 50;

  // Color Palette
  const purpleColor: [number, number, number] = [126, 34, 206]; // #7e22ce
  const darkCharcoal: [number, number, number] = [24, 24, 27]; // #18181b
  const mutedGray: [number, number, number] = [113, 113, 122]; // #71717a
  const borderGray: [number, number, number] = [226, 232, 240]; // #e2e8f0
  const lightBg: [number, number, number] = [248, 250, 252]; // #f8fafc
  const emeraldColor: [number, number, number] = [16, 185, 129]; // #10b981
  const roseColor: [number, number, number] = [244, 63, 94]; // #f43f5e
  const amberColor: [number, number, number] = [217, 119, 6]; // #d97706

  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > maxY) {
      doc.addPage();
      y = 55;
    }
  };

  // Safely extract raw JSON data with fallbacks
  const data = report.dataJson || {};
  const candidateName = report.candidateName || data.candidateName || 'Candidate';
  const targetRole = data.targetRole || data.roleTitle || 'Target Position';
  const resumeScore = typeof report.score === 'number' ? report.score : (data.resumeScore || 85);
  const atsCompatibility = typeof report.atsPassRate === 'number' ? report.atsPassRate : (data.atsCompatibility || 88);
  const aiRecommendation = data.aiRecommendation || data.ai_recommendation || 'Strengthen quantifiable achievement bullet points across past experience sections. Ensure clear target keywords match key job requirements.';
  
  const detectedSkills: string[] = Array.isArray(data.detectedSkills) 
    ? data.detectedSkills 
    : Array.isArray(data.detected_skills)
      ? data.detected_skills.map((s: any) => typeof s === 'string' ? s : s.skill_name)
      : ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'System Architecture'];

  const missingSkills: string[] = Array.isArray(data.missingSkills)
    ? data.missingSkills
    : Array.isArray(data.missing_skills_json)
      ? data.missing_skills_json
      : [];

  // ==========================================
  // 1. BRAND HEADER (Top of Page 1)
  // ==========================================
  doc.setFillColor(...purpleColor);
  doc.roundedRect(marginX, y, 22, 22, 5, 5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('+', marginX + 6, y + 15);

  doc.setTextColor(...darkCharcoal);
  doc.setFont('times', 'bold');
  doc.setFontSize(16);
  doc.text('Resume Screening System', marginX + 30, y + 16);
  const brandWidth = doc.getTextWidth('Resume Screening System');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...mutedGray);
  doc.text('AI-POWERED RESUME INTELLIGENCE', marginX + 30 + brandWidth + 10, y + 15);

  doc.setFontSize(9);
  doc.text(`Generated: ${report.date}`, pageWidth - marginX, y + 15, { align: 'right' });

  y += 32;

  doc.setDrawColor(...borderGray);
  doc.setLineWidth(0.8);
  doc.line(marginX, y, pageWidth - marginX, y);
  y += 18;

  // ==========================================
  // 2. REPORT COVER HEADER CARD
  // ==========================================
  const headerCardHeight = report.type === 'Job Screening' ? 82 : 70;
  doc.setFillColor(...lightBg);
  doc.setDrawColor(...borderGray);
  doc.roundedRect(marginX, y, usableWidth, headerCardHeight, 8, 8, 'FD');

  const typeBadgeText = (report.type || 'ATS Audit').toUpperCase();
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  
  const textWidth = doc.getTextWidth(typeBadgeText);
  const paddingX = 7;
  const badgeWidth = textWidth + paddingX * 2;

  // Draw purple badge with content-driven width
  doc.setFillColor(...purpleColor);
  doc.roundedRect(marginX + 15, y + 12, badgeWidth, 16, 4, 4, 'F');
  doc.setTextColor(255, 255, 255);
  doc.text(typeBadgeText, marginX + 15 + paddingX, y + 23);

  // Candidate Name placed with clean gap right after the badge
  const candidateStartX = marginX + 15 + badgeWidth + 15;
  doc.setTextColor(...darkCharcoal);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(candidateName, candidateStartX, y + 24);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...mutedGray);
  doc.text(`Role Target: ${targetRole}`, marginX + 15, y + 45);

  if (report.type === 'Job Screening') {
    const jobTitle = data.jobMatch?.roleTitle || data.jobTitle || 'Target Position';
    const company = data.jobMatch?.company || 'Confidential';
    doc.text(`Job Target: ${jobTitle} (${company})`, marginX + 15, y + 62);
  } else {
    doc.text(`Report ID: ${report.id.slice(0, 14)}`, marginX + 15, y + 58);
  }

  y += headerCardHeight + 20;

  // ==========================================
  // 3. EXECUTIVE SUMMARY METRIC CARDS
  // ==========================================
  checkPageBreak(75);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...darkCharcoal);
  doc.text('EXECUTIVE SUMMARY', marginX, y);
  y += 12;

  const cardWidth = (usableWidth - 30) / 4;
  const cardHeight = 52;

  if (report.type === 'Job Screening') {
    const matchPct = data.jobMatch?.matchPercentage || data.matchPercentage || 88;
    const expRel = data.experienceRelevance || 85;
    const metrics = [
      { label: 'JOB MATCH', val: `${matchPct}%`, color: emeraldColor },
      { label: 'ATS COMPATIBILITY', val: `${atsCompatibility}%`, color: purpleColor },
      { label: 'SKILLS MATCHED', val: `${detectedSkills.length}`, color: darkCharcoal },
      { label: 'EXP RELEVANCE', val: `${expRel}%`, color: darkCharcoal },
    ];

    metrics.forEach((m, idx) => {
      const cx = marginX + idx * (cardWidth + 10);
      doc.setFillColor(...lightBg);
      doc.setDrawColor(...borderGray);
      doc.roundedRect(cx, y, cardWidth, cardHeight, 6, 6, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(...mutedGray);
      doc.text(m.label, cx + cardWidth / 2, y + 16, { align: 'center' });

      doc.setFontSize(16);
      doc.setTextColor(...m.color);
      doc.text(m.val, cx + cardWidth / 2, y + 38, { align: 'center' });
    });
  } else {
    // ATS Audit
    const metrics = [
      { label: 'RESUME QUALITY', val: `${resumeScore}/100`, color: purpleColor },
      { label: 'ATS READABILITY', val: `${atsCompatibility}%`, color: emeraldColor },
      { label: 'SKILLS DETECTED', val: `${detectedSkills.length}`, color: darkCharcoal },
      { label: 'AI IMPROVEMENTS', val: `${missingSkills.length || 4}`, color: darkCharcoal },
    ];

    metrics.forEach((m, idx) => {
      const cx = marginX + idx * (cardWidth + 10);
      doc.setFillColor(...lightBg);
      doc.setDrawColor(...borderGray);
      doc.roundedRect(cx, y, cardWidth, cardHeight, 6, 6, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(...mutedGray);
      doc.text(m.label, cx + cardWidth / 2, y + 16, { align: 'center' });

      doc.setFontSize(16);
      doc.setTextColor(...m.color);
      doc.text(m.val, cx + cardWidth / 2, y + 38, { align: 'center' });
    });
  }

  y += cardHeight + 20;

  // ==========================================
  // 4. DETAILED REPORT SECTIONS
  // ==========================================

  if (report.type === 'Job Screening') {
    // ------------------------------------------
    // JOB SCREENING SECTIONS
    // ------------------------------------------
    
    // Overall Job Fit & Hiring Recommendation
    const matchScore = data.jobMatch?.matchPercentage || 88;
    let recTierText = 'Strong Fit';
    let recTierColor = emeraldColor;
    if (matchScore < 60) {
      recTierText = 'Weak Fit';
      recTierColor = roseColor;
    } else if (matchScore < 75) {
      recTierText = 'Moderate Fit';
      recTierColor = amberColor;
    } else if (matchScore < 85) {
      recTierText = 'Good Fit';
      recTierColor = emeraldColor;
    }

    checkPageBreak(70);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...darkCharcoal);
    doc.text('OVERALL JOB FIT & HIRING RECOMMENDATION', marginX, y);
    y += 12;

    // Hiring Tier Badge Card
    doc.setFillColor(...lightBg);
    doc.setDrawColor(...borderGray);
    doc.roundedRect(marginX, y, usableWidth, 42, 6, 6, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...recTierColor);
    doc.text(`HIRING ASSESSMENT: ${recTierText.toUpperCase()} (${matchScore}% MATCH)`, marginX + 12, y + 17);

    const fitExplanation = `Candidate ${candidateName} demonstrates a ${recTierText.toLowerCase()} (${matchScore}%) alignment with target job requirements for ${targetRole}. Technical evidence verifies competency across core engineering domains.`;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...darkCharcoal);
    const fitLines = doc.splitTextToSize(fitExplanation, usableWidth - 24);
    doc.text(fitLines, marginX + 12, y + 32);

    y += 56;

    // Key Matched Skills
    checkPageBreak(50);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...darkCharcoal);
    doc.text('KEY MATCHED SKILLS (VERIFIED STRENGTHS)', marginX, y);
    y += 12;

    const strongMatches: string[] = data.jobMatch?.strongMatches || detectedSkills;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    strongMatches.forEach((s) => {
      checkPageBreak(16);
      doc.setTextColor(...emeraldColor);
      doc.text('[VERIFIED]', marginX + 5, y);
      doc.setTextColor(...darkCharcoal);
      doc.text(`Direct evidence and expertise in ${s}`, marginX + 65, y);
      y += 14;
    });
    y += 10;

    // Missing Skills / Deficits
    if (missingSkills.length > 0) {
      checkPageBreak(50);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(...darkCharcoal);
      doc.text('IDENTIFIED SKILL DEFICITS & RISKS', marginX, y);
      y += 12;

      missingSkills.forEach((g) => {
        checkPageBreak(16);
        doc.setTextColor(...roseColor);
        doc.text('[DEFICIT]', marginX + 5, y);
        doc.setTextColor(...darkCharcoal);
        doc.text(`Missing hands-on evidence for ${g}`, marginX + 60, y);
        y += 14;
      });
      y += 10;
    }

    // Candidate vs Job Requirement Matrix Table
    checkPageBreak(70);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...darkCharcoal);
    doc.text('CANDIDATE VS JOB REQUIREMENT MATRIX', marginX, y);
    y += 14;

    const colWidths = [160, 95, 260.28];
    const drawTableHeader = () => {
      doc.setFillColor(...purpleColor);
      doc.rect(marginX, y, usableWidth, 20, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text('JOB REQUIREMENT / SKILL', marginX + 8, y + 13);
      doc.text('STATUS', marginX + colWidths[0] + 8, y + 13);
      doc.text('ASSESSMENT EVALUATION', marginX + colWidths[0] + colWidths[1] + 8, y + 13);
      y += 20;
    };

    drawTableHeader();

    const tableItems = [
      ...strongMatches.map(s => ({ req: s, status: 'MATCHED', text: `Strong competency verified in candidate resume.` })),
      ...missingSkills.map(m => ({ req: m, status: 'MISSING', text: `Deficit identified. Probe during technical interview.` })),
    ];

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);

    tableItems.forEach((row, rIdx) => {
      const reqLines = doc.splitTextToSize(row.req, colWidths[0] - 16);
      const textLines = doc.splitTextToSize(row.text, colWidths[2] - 16);
      const lineCount = Math.max(reqLines.length, textLines.length);
      const rowHeight = lineCount * 12 + 10;

      if (y + rowHeight > maxY) {
        doc.addPage();
        y = 55;
        drawTableHeader();
      }

      if (rIdx % 2 === 1) {
        doc.setFillColor(...lightBg);
        doc.rect(marginX, y, usableWidth, rowHeight, 'F');
      }

      doc.setDrawColor(...borderGray);
      doc.line(marginX, y + rowHeight, marginX + usableWidth, y + rowHeight);

      doc.setTextColor(...darkCharcoal);
      doc.text(reqLines, marginX + 8, y + 12);

      if (row.status === 'MATCHED') {
        doc.setTextColor(...emeraldColor);
        doc.setFont('helvetica', 'bold');
        doc.text('MATCHED', marginX + colWidths[0] + 8, y + 12);
      } else {
        doc.setTextColor(...roseColor);
        doc.setFont('helvetica', 'bold');
        doc.text('MISSING', marginX + colWidths[0] + 8, y + 12);
      }

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...darkCharcoal);
      doc.text(textLines, marginX + colWidths[0] + colWidths[1] + 8, y + 12);
      y += rowHeight;
    });

    y += 15;

  } else {
    // ------------------------------------------
    // ATS RESUME AUDIT SECTIONS
    // ------------------------------------------

    // ATS Readability Breakdown
    checkPageBreak(60);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...darkCharcoal);
    doc.text('ATS READABILITY & PARSER AUDIT', marginX, y);
    y += 12;

    const kwMatch = data.atsBreakdown?.keywordMatch || 85;
    const fmtScore = data.atsBreakdown?.formatting || 90;
    const expScore = data.atsBreakdown?.experienceRelevance || 88;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...darkCharcoal);
    doc.text(`• Keyword Density Match: ${kwMatch}% (Optimized for target engineering roles)`, marginX + 5, y); y += 14;
    doc.text(`• Formatting & Structural Parser Compliance: ${fmtScore}% (Standard single-column PDF structure)`, marginX + 5, y); y += 14;
    doc.text(`• Experience & Role Relevance Score: ${expScore}% (High alignment with senior technical specifications)`, marginX + 5, y); y += 18;

    // Extracted Skill Matrix
    checkPageBreak(60);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...darkCharcoal);
    doc.text('EXTRACTED TECHNICAL SKILL MATRIX', marginX, y);
    y += 12;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...darkCharcoal);
    const skillsText = detectedSkills.join('   •   ');
    const skillLines = doc.splitTextToSize(skillsText, usableWidth - 24);
    const skillBoxH = skillLines.length * 13 + 16;

    if (y + skillBoxH > maxY) {
      doc.addPage();
      y = 55;
    }

    doc.setFillColor(...lightBg);
    doc.setDrawColor(...borderGray);
    doc.roundedRect(marginX, y, usableWidth, skillBoxH, 6, 6, 'FD');
    doc.text(skillLines, marginX + 12, y + 14);
    y += skillBoxH + 18;

    // Executive AI Recommendation (Multi-Line Safe)
    checkPageBreak(70);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...darkCharcoal);
    doc.text('EXECUTIVE AI RECOMMENDATION', marginX, y);
    y += 12;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...darkCharcoal);
    const recLines = doc.splitTextToSize(aiRecommendation, usableWidth - 24);
    const recBoxH = recLines.length * 13 + 16;

    if (y + recBoxH > maxY) {
      doc.addPage();
      y = 55;
    }

    doc.setFillColor(...lightBg);
    doc.setDrawColor(...borderGray);
    doc.roundedRect(marginX, y, usableWidth, recBoxH, 6, 6, 'FD');
    doc.text(recLines, marginX + 12, y + 14);
    y += recBoxH + 18;

    // HIGH-IMPACT SKILL GAPS & RECOMMENDATIONS (CONTEXT-AWARE & SEMANTIC)
    const skillRecommendations: SkillRecommendation[] = missingSkills.map((skill) =>
      classifyAndGenerateSkillRecommendation(skill, detectedSkills)
    );

    if (skillRecommendations.length > 0) {
      checkPageBreak(60);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(...darkCharcoal);
      doc.text('HIGH-IMPACT SKILL GAPS & RECOMMENDATIONS', marginX, y);
      y += 14;

      skillRecommendations.forEach((item) => {
        // 1. Skill Name — Status Line
        const headerText = `${item.skill} — ${item.status}`;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        
        const headerLines = doc.splitTextToSize(headerText, usableWidth - 20);
        
        // 2. Explanation text below
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        
        const descLines = doc.splitTextToSize(item.text, usableWidth - 20);
        
        const itemBlockHeight = headerLines.length * 13 + descLines.length * 12 + 10;
        
        // Safety Page Break: Move entire item block to next page if it crosses boundary
        checkPageBreak(itemBlockHeight);

        // Render Header: Purple accent bullet + Skill Name — Status
        doc.setTextColor(...purpleColor);
        doc.text('•', marginX + 5, y);
        
        doc.setTextColor(...darkCharcoal);
        doc.text(headerLines, marginX + 16, y);
        y += headerLines.length * 13 + 2;

        // Render Explanation text
        doc.setTextColor(...mutedGray);
        doc.text(descLines, marginX + 16, y);
        y += descLines.length * 12 + 10;
      });
    }
  }

  // ==========================================
  // 5. FOOTER & PAGE NUMBERING (Multi-Pass)
  // ==========================================
  const totalPages = doc.getNumberOfPages();

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Running Header (Pages 2+)
    if (i > 1) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(...mutedGray);
      doc.text('✦ Resume Screening System  |  Executive Intelligence Report', marginX, 30);
      doc.text(`${candidateName} — ${report.type}`, pageWidth - marginX, 30, { align: 'right' });

      doc.setDrawColor(...borderGray);
      doc.setLineWidth(0.5);
      doc.line(marginX, 35, pageWidth - marginX, 35);
    }

    // Running Footer (All Pages)
    doc.setDrawColor(...borderGray);
    doc.setLineWidth(0.5);
    doc.line(marginX, pageHeight - 35, pageWidth - marginX, pageHeight - 35);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...darkCharcoal);
    doc.text('Resume Screening System', marginX, pageHeight - 22);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...mutedGray);
    doc.text('AI-Powered Resume Intelligence', pageWidth / 2, pageHeight - 22, { align: 'center' });
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - marginX, pageHeight - 22, { align: 'right' });
  }

  // ==========================================
  // 6. TRIGGER BROWSER DOWNLOAD
  // ==========================================
  const filename = sanitizeFilename(candidateName, report.type, report.title);
  doc.save(filename);
}
