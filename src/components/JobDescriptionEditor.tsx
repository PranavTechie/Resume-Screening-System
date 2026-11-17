import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Bold, Italic, List, ListOrdered, RemoveFormatting, Heading } from 'lucide-react';
import {
  normalizePastedContent,
  htmlToNormalizedPlainText,
  plainTextToHtml,
} from '../utils/jobDescriptionNormalizer';
import { useToast } from '../context/ToastContext';
import { JOB_DESCRIPTION_MAX_LENGTH, JOB_DESCRIPTION_MIN_LENGTH } from '../config/constants';

interface JobDescriptionEditorProps {
  value: string;
  onChange: (normalizedPlainText: string) => void;
  onError?: (errorMessage: string) => void;
  placeholder?: string;
  disabled?: boolean;
  isTooLong?: boolean;
  isLimitReached?: boolean;
}

export const JobDescriptionEditor: React.FC<JobDescriptionEditorProps> = ({
  value,
  onChange,
  onError,
  placeholder = "Paste the complete job description here (minimum 100 characters, maximum 10,000 characters), or click 'Generate with AI'...",
  disabled = false,
  isTooLong = false,
  isLimitReached = false,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const lastSyncTextRef = useRef<string>('');
  const [isFocused, setIsFocused] = useState(false);
  const { toast } = useToast();

  // Determine if editor has readable content
  const isEmpty = !value || value.trim().length === 0;

  // Keep editor innerHTML in sync with external value (e.g. AI generation or resets)
  useEffect(() => {
    if (!editorRef.current) return;

    if (value !== lastSyncTextRef.current) {
      lastSyncTextRef.current = value;
      if (!value) {
        editorRef.current.innerHTML = '';
      } else {
        editorRef.current.innerHTML = plainTextToHtml(value);
      }
    }
  }, [value]);

  // Sync internal DOM mutations to normalized plain text
  const handleInput = useCallback(() => {
    if (!editorRef.current) return;

    const normalizedText = htmlToNormalizedPlainText(editorRef.current);
    lastSyncTextRef.current = normalizedText;
    onChange(normalizedText);

    if (normalizedText.length > JOB_DESCRIPTION_MAX_LENGTH) {
      onError?.(`Job description exceeds the 10,000 character maximum.`);
    }
  }, [onChange, onError]);

  // Intercept paste to sanitize, preserve document structure, and enforce readable character limits
  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (disabled || !editorRef.current) return;

    const clipboardHtml = e.clipboardData.getData('text/html');
    const clipboardText = e.clipboardData.getData('text/plain');

    // Normalize and clean pasted content
    const normalized = normalizePastedContent(clipboardHtml, clipboardText);
    if (!normalized.html && !normalized.plainText) return;

    // Calculate selection length
    const selection = window.getSelection();
    let selectedTextLength = 0;
    if (selection && selection.rangeCount > 0) {
      selectedTextLength = selection.toString().length;
    }

    // Current human-readable character count
    const currentText = htmlToNormalizedPlainText(editorRef.current);
    const projectedLength = currentText.length - selectedTextLength + normalized.plainText.length;

    // Reject paste if it exceeds the 10,000 readable characters limit
    if (projectedLength > JOB_DESCRIPTION_MAX_LENGTH) {
      const excess = projectedLength - JOB_DESCRIPTION_MAX_LENGTH;
      const errorMsg = `Job description must be 10,000 characters or less. Pasted text exceeds the limit by ${excess.toLocaleString()} characters. Paste was rejected.`;
      onError?.(errorMsg);
      toast.error(errorMsg, { title: 'Character Limit Exceeded' });
      return;
    }

    // Insert sanitized HTML at cursor / selection
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();

      // Create document fragment with sanitized nodes
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = normalized.html;

      const frag = document.createDocumentFragment();
      let lastNode: Node | null = null;
      while (tempDiv.firstChild) {
        lastNode = tempDiv.firstChild;
        frag.appendChild(tempDiv.firstChild);
      }

      range.insertNode(frag);

      // Move cursor right after the newly inserted nodes
      if (lastNode) {
        const newRange = document.createRange();
        newRange.setStartAfter(lastNode);
        newRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(newRange);
      }
    } else {
      // Fallback: append to end of editor
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = normalized.html;
      while (tempDiv.firstChild) {
        editorRef.current.appendChild(tempDiv.firstChild);
      }
    }

    // Re-sync normalized text
    const updatedPlainText = htmlToNormalizedPlainText(editorRef.current);
    lastSyncTextRef.current = updatedPlainText;
    onChange(updatedPlainText);

    if (onError && updatedPlainText.length <= JOB_DESCRIPTION_MAX_LENGTH && updatedPlainText.length >= JOB_DESCRIPTION_MIN_LENGTH) {
      onError('');
    }
  };

  // Minimal toolbar command helper (prevents loss of focus)
  const execToolbarCommand = (command: string, arg?: string) => {
    if (disabled || !editorRef.current) return;
    editorRef.current.focus();
    document.execCommand(command, false, arg);
    handleInput();
  };

  return (
    <div
      className={`group relative flex flex-col rounded-xl border transition-colors bg-white dark:bg-neutral-900 ${
        isTooLong
          ? 'border-rose-500 focus-within:ring-2 focus-within:ring-rose-500/40'
          : isLimitReached
          ? 'border-purple-500 focus-within:ring-2 focus-within:ring-purple-500/40'
          : isFocused
          ? 'border-purple-500/80 ring-2 ring-purple-500/30'
          : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600'
      } ${disabled ? 'opacity-60 pointer-events-none' : ''}`}
    >
      {/* Minimal Editor Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-100 dark:border-neutral-800/80 bg-neutral-50/70 dark:bg-neutral-800/40 rounded-t-xl text-neutral-600 dark:text-neutral-400">
        <div className="flex items-center gap-1">
          {/* Bold */}
          <button
            type="button"
            title="Bold (Ctrl+B)"
            onMouseDown={(e) => {
              e.preventDefault();
              execToolbarCommand('bold');
            }}
            className="p-1.5 rounded-lg hover:bg-neutral-200/60 dark:hover:bg-neutral-700/60 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>

          {/* Italic */}
          <button
            type="button"
            title="Italic (Ctrl+I)"
            onMouseDown={(e) => {
              e.preventDefault();
              execToolbarCommand('italic');
            }}
            className="p-1.5 rounded-lg hover:bg-neutral-200/60 dark:hover:bg-neutral-700/60 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>

          <div className="w-px h-4 bg-neutral-200 dark:bg-neutral-700 mx-1" />

          {/* Heading */}
          <button
            type="button"
            title="Format Heading"
            onMouseDown={(e) => {
              e.preventDefault();
              execToolbarCommand('formatBlock', '<h3>');
            }}
            className="p-1.5 rounded-lg hover:bg-neutral-200/60 dark:hover:bg-neutral-700/60 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            <Heading className="w-3.5 h-3.5" />
          </button>

          {/* Bullet List */}
          <button
            type="button"
            title="Bullet List"
            onMouseDown={(e) => {
              e.preventDefault();
              execToolbarCommand('insertUnorderedList');
            }}
            className="p-1.5 rounded-lg hover:bg-neutral-200/60 dark:hover:bg-neutral-700/60 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            <List className="w-3.5 h-3.5" />
          </button>

          {/* Numbered List */}
          <button
            type="button"
            title="Numbered List"
            onMouseDown={(e) => {
              e.preventDefault();
              execToolbarCommand('insertOrderedList');
            }}
            className="p-1.5 rounded-lg hover:bg-neutral-200/60 dark:hover:bg-neutral-700/60 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            <ListOrdered className="w-3.5 h-3.5" />
          </button>

          <div className="w-px h-4 bg-neutral-200 dark:bg-neutral-700 mx-1" />

          {/* Clear Formatting */}
          <button
            type="button"
            title="Clear Formatting"
            onMouseDown={(e) => {
              e.preventDefault();
              execToolbarCommand('removeFormat');
            }}
            className="p-1.5 rounded-lg hover:bg-neutral-200/60 dark:hover:bg-neutral-700/60 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            <RemoveFormatting className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="text-[11px] font-medium text-neutral-400 dark:text-neutral-500 uppercase tracking-wider hidden sm:block">
          Rich Document Editor
        </div>
      </div>

      {/* Editable Content Area */}
      <div className="relative min-h-[260px] max-h-[520px] overflow-y-auto">
        {/* Placeholder overlay */}
        {isEmpty && !isFocused && (
          <div
            onClick={() => editorRef.current?.focus()}
            className="absolute inset-0 p-4 pointer-events-none select-none text-neutral-400 dark:text-neutral-500 text-xs leading-relaxed font-sans"
          >
            {placeholder}
          </div>
        )}

        <div
          ref={editorRef}
          contentEditable={!disabled}
          onPaste={handlePaste}
          onInput={handleInput}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          role="textbox"
          aria-multiline="true"
          aria-label="Job Description"
          tabIndex={0}
          className="w-full min-h-[260px] p-4 text-xs font-sans text-neutral-800 dark:text-neutral-200 leading-relaxed focus:outline-none 
            [&_h3]:text-xs [&_h3]:font-bold [&_h3]:uppercase [&_h3]:tracking-wider [&_h3]:text-neutral-900 dark:[&_h3]:text-white [&_h3]:mt-4 [&_h3]:mb-1.5 [&_h3]:first:mt-0
            [&_p]:my-2 [&_p]:first:mt-0 [&_p]:last:mb-0
            [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2 [&_ul]:space-y-1
            [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-2 [&_ol]:space-y-1
            [&_li]:leading-relaxed
            [&_strong]:font-semibold [&_strong]:text-neutral-900 dark:[&_strong]:text-white
            [&_b]:font-semibold [&_b]:text-neutral-900 dark:[&_b]:text-white
            [&_a]:text-purple-600 dark:[&_a]:text-purple-400 [&_a]:underline [&_a]:underline-offset-2"
        />
      </div>
    </div>
  );
};
