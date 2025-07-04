/**
 * Code Analysis Service Module
 * 
 * This module contains the business logic for analyzing source code.
 * It provides functions to calculate various metrics from code snippets
 * including line counts, character counts, and emptiness checks.
 * 
 * The service is designed to work with any programming language or text content
 * and provides consistent, reliable analysis results.
 */

// @ts-ignore
import { tokenizeHTML } from '../../../scripts/tools.js';
import { AnalyzeCodeOut } from './analyze.schema.js';

/**
 * Analyzes a code snippet and returns comprehensive metrics
 * 
 * This function processes the provided code string and calculates:
 * - Line count (including empty lines)
 * - Character count (including whitespace)
 * - Whether the code is empty (contains only whitespace)
 * 
 * The function also performs HTML tokenization for potential future use
 * in more advanced analysis features.
 * 
 * @param code - The source code string to analyze
 * @returns An object containing the analysis results
 * 
 * @example
 * ```typescript
 * const result = analyzeSnippet('function hello() {\n  return "Hello, World!";\n}');
 * // Returns: { lines: 3, chars: 47, is_empty: false }
 * 
 * const emptyResult = analyzeSnippet('   \n  \n  ');
 * // Returns: { lines: 3, chars: 7, is_empty: true }
 * ```
 * 
 * @throws {Error} If the code parameter is not a string
 */
export function analyzeSnippet(code: string): AnalyzeCodeOut {
  // Input validation
  if (typeof code !== 'string') {
    throw new Error('Code parameter must be a string');
  }

  // Perform HTML tokenization for potential future analysis features
  // This could be used for more advanced code analysis in the future
  const tokens = tokenizeHTML(code);

  // Calculate basic metrics
  const lines = code.split(/\r?\n/).length; // Handle both Windows (\r\n) and Unix (\n) line endings
  const chars = code.length; // Total character count including whitespace
  const is_empty = code.trim().length === 0; // Check if code contains only whitespace

  return {
    lines,
    chars,
    is_empty
    // Future enhancement: could include tokens.length for more detailed analysis
  };
}

/**
 * Utility function to validate code size limits
 * 
 * @param code - The code string to validate
 * @param maxSize - Maximum allowed size in bytes (default: 100KB)
 * @returns True if code is within size limits, false otherwise
 */
export function validateCodeSize(code: string, maxSize: number = 100000): boolean {
  return code.length <= maxSize;
}

/**
 * Utility function to get code statistics for debugging
 * 
 * @param code - The code string to analyze
 * @returns Detailed statistics about the code
 */
export function getCodeStatistics(code: string) {
  const lines = code.split(/\r?\n/);
  const nonEmptyLines = lines.filter(line => line.trim().length > 0);
  
  return {
    totalLines: lines.length,
    nonEmptyLines: nonEmptyLines.length,
    emptyLines: lines.length - nonEmptyLines.length,
    totalChars: code.length,
    nonWhitespaceChars: code.replace(/\s/g, '').length,
    averageLineLength: lines.length > 0 ? code.length / lines.length : 0
  };
}
