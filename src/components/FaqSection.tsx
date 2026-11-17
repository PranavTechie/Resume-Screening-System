import React, { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { FAQS } from '../data/mockData';
import { EASE_OUT, RevealGroup, RevealItem } from './motion/primitives';

export const FaqSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const reduce = !!useReducedMotion();

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-16 md:py-24 border-b border-line bg-page-alt">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">

        {/* Header */}
        <RevealGroup className="text-center max-w-2xl mx-auto space-y-3">
          <RevealItem>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 text-xs font-semibold">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Frequently Asked Questions</span>
            </div>
          </RevealItem>
          <RevealItem>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif-title font-normal text-neutral-900 dark:text-white tracking-tight">
              Everything You Need to Know
            </h2>
          </RevealItem>
          <RevealItem>
            <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400">
              Answers regarding privacy, ATS algorithms, scoring models, and account features.
            </p>
          </RevealItem>
        </RevealGroup>

        {/* Accordion List */}
        <RevealGroup className="space-y-3">
          {FAQS.map((faq, index) => {
            const isOpen = openIndex === index;
            const panelId = `faq-panel-${index}`;
            return (
              <RevealItem
                key={index}
                className="border border-neutral-200/80 dark:border-neutral-800/80 rounded-2xl overflow-hidden bg-white dark:bg-neutral-900 shadow-xs"
              >
                <button
                  onClick={() => toggleAccordion(index)}
                  className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-4 focus:outline-none focus-visible:bg-neutral-50 dark:focus-visible:bg-neutral-800/60 cursor-pointer"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                >
                  <span className="text-sm sm:text-base font-semibold text-neutral-900 dark:text-white">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 shrink-0 transition-[rotate,color] duration-300 ease-out ${
                      isOpen ? 'rotate-180 text-neutral-900 dark:text-white' : 'text-neutral-500 dark:text-neutral-400'
                    }`}
                  />
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      id={panelId}
                      key="panel"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={reduce ? { duration: 0 } : { height: { duration: 0.3, ease: EASE_OUT }, opacity: { duration: 0.2 } }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 sm:px-5 pb-5 pt-1 text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 border-t border-neutral-100 dark:border-neutral-800/80 leading-relaxed">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </RevealItem>
            );
          })}
        </RevealGroup>

      </div>
    </section>
  );
};
