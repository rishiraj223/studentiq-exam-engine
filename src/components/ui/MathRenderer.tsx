'use client';

import React from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface MathRendererProps {
  text: string;
  className?: string;
}

/**
 * Renders text that may contain LaTeX math expressions.
 * Supports both notations:
 *   - Dollar signs: $...$ and $$...$$  (what Gemini outputs)
 *   - Brackets: \(...\) and \[...\]    (standard LaTeX)
 */
export function MathRenderer({ text, className = '' }: MathRendererProps) {
  if (!text) return null;

  const rendered = renderMath(text);
  return (
    <span
      className={className}
      dangerouslySetInnerHTML={{ __html: rendered }}
    />
  );
}

function renderMath(input: string): string {
  // We split on all math delimiters and render each segment
  // Supported: $$...$$ \[...\] (display) and $...$ \(...\) (inline)
  const segments: { text: string; type: 'text' | 'inline' | 'display' }[] = [];

  // Regex matches (in order of priority):
  // 1. $$...$$ or \[...\]  — display math
  // 2. $...$ or \(...\)    — inline math
  const MATH_REGEX = /(\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\$[^$\n]+?\$|\\\([\s\S]+?\\\))/g;

  let lastIndex = 0;
  let match;

  while ((match = MATH_REGEX.exec(input)) !== null) {
    // Push plain text before this math
    if (match.index > lastIndex) {
      segments.push({ text: input.slice(lastIndex, match.index), type: 'text' });
    }

    const raw = match[0];
    let latex = '';
    let isDisplay = false;

    if (raw.startsWith('$$') && raw.endsWith('$$')) {
      latex = raw.slice(2, -2);
      isDisplay = true;
    } else if (raw.startsWith('\\[') && raw.endsWith('\\]')) {
      latex = raw.slice(2, -2);
      isDisplay = true;
    } else if (raw.startsWith('$') && raw.endsWith('$')) {
      latex = raw.slice(1, -1);
      isDisplay = false;
    } else if (raw.startsWith('\\(') && raw.endsWith('\\)')) {
      latex = raw.slice(2, -2);
      isDisplay = false;
    }

    segments.push({ text: latex, type: isDisplay ? 'display' : 'inline' });
    lastIndex = match.index + raw.length;
  }

  // Push remaining plain text
  if (lastIndex < input.length) {
    segments.push({ text: input.slice(lastIndex), type: 'text' });
  }

  // Render each segment
  return segments
    .map(seg => {
      if (seg.type === 'text') {
        // Escape HTML for safety
        return seg.text
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/\n/g, '<br/>');
      }

      try {
        return katex.renderToString(seg.text, {
          displayMode: seg.type === 'display',
          throwOnError: false,
          strict: false,
          trust: false,
        });
      } catch {
        // If KaTeX fails, show the raw LaTeX wrapped in code tag
        return `<code style="color:#e11d48;font-size:0.8em">${seg.text}</code>`;
      }
    })
    .join('');
}
