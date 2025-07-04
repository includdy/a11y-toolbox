/**
 * Code Analysis Schema Module
 * 
 * This module defines TypeBox schemas for the code analysis functionality.
 * It provides type-safe input/output validation for code analysis operations.
 * 
 * The schemas are used to:
 * - Validate incoming code analysis requests
 * - Ensure consistent response structure
 * - Provide runtime type checking
 * - Generate API documentation automatically
 * 
 * @see {@link https://swagger.io/specification/ OpenAPI Specification}
 * @see {@link https://fastify.dev/docs/latest/Reference/Validation-and-Serialization/ Fastify Validation}
 */

import { Type, Static } from '@sinclair/typebox';

/**
 * Input Schema for Code Analysis
 * 
 * Defines the structure and validation rules for incoming code analysis requests.
 * This schema ensures that the code parameter is provided and is a valid string.
 * 
 * @example
 * ```json
 * {
 *   "code": "function hello() { return 'Hello, World!'; }"
 * }
 * ```
 * 
 * @example
 * ```json
 * {
 *   "code": "print('Hello, world!')\nprint('How are you?')"
 * }
 * ```
 */
export const AnalyzeCodeInSchema = Type.Object({
  code: Type.String({
    description: 'The source code to be analyzed. Can be any programming language or text content.',
    minLength: 1,
    maxLength: 100000, // Reasonable limit to prevent abuse
    examples: [
      "print('Hello, world!')",
      "function fibonacci(n) { return n <= 1 ? n : fibonacci(n-1) + fibonacci(n-2); }",
      "const greeting = 'Hello, World!';\nconsole.log(greeting);",
      "def factorial(n):\n    return 1 if n <= 1 else n * factorial(n-1)"
    ]
  })
}, {
  description: 'Request payload for code analysis',
  additionalProperties: false, // Strict validation - no extra fields allowed
  $id: 'AnalyzeCodeIn',
  title: 'Code Analysis Input',
  examples: [
    {
      summary: 'Simple JavaScript function',
      value: { code: 'function greet(name) { return `Hello, ${name}!`; }' }
    },
    {
      summary: 'Python code with multiple lines',
      value: { code: 'def fibonacci(n):\n    if n <= 1:\n        return n\n    return fibonacci(n-1) + fibonacci(n-2)' }
    }
  ]
});

/**
 * TypeScript type derived from the input schema
 * Provides compile-time type safety for code analysis input
 */
export type AnalyzeCodeIn = Static<typeof AnalyzeCodeInSchema>;

/**
 * Output Schema for Code Analysis Results
 * 
 * Defines the structure of analysis results returned after processing the input code.
 * Each field provides specific metrics about the analyzed code snippet.
 * 
 * @example
 * ```json
 * {
 *   "lines": 5,
 *   "chars": 45,
 *   "is_empty": false
 * }
 * ```
 * 
 * @example
 * ```json
 * {
 *   "lines": 1,
 *   "chars": 0,
 *   "is_empty": true
 * }
 * ```
 */
export const AnalyzeCodeOutSchema = Type.Object({
  lines: Type.Integer({ 
    description: 'Total number of lines in the code snippet, including empty lines',
    minimum: 0,
    examples: [0, 1, 10, 100],
    title: 'Line Count'
  }),
  chars: Type.Integer({ 
    description: 'Total number of characters in the code snippet, including whitespace',
    minimum: 0,
    examples: [0, 15, 150, 1500],
    title: 'Character Count'
  }),
  is_empty: Type.Boolean({ 
    description: 'Whether the code snippet is empty (no non-whitespace characters)',
    examples: [true, false],
    title: 'Is Empty'
  })
}, {
  description: 'Analysis results containing metrics about the provided code',
  additionalProperties: false, // Strict validation - no extra fields allowed
  $id: 'AnalyzeCodeOut',
  title: 'Code Analysis Output',
  examples: [
    {
      summary: 'Non-empty code analysis',
      value: { lines: 3, chars: 47, is_empty: false }
    },
    {
      summary: 'Empty code analysis',
      value: { lines: 1, chars: 0, is_empty: true }
    },
    {
      summary: 'Whitespace-only code analysis',
      value: { lines: 3, chars: 7, is_empty: true }
    }
  ]
});

/**
 * TypeScript type derived from the output schema
 * Provides compile-time type safety for code analysis output
 */
export type AnalyzeCodeOut = Static<typeof AnalyzeCodeOutSchema>;

/**
 * Complete Analysis Schema
 * 
 * Combines input and output schemas for comprehensive documentation.
 * Useful for API documentation generation and testing.
 */
export const AnalyzeCodeSchema = {
  input: AnalyzeCodeInSchema,
  output: AnalyzeCodeOutSchema,
  description: 'Analyzes source code and returns basic metrics including line count, character count, and emptiness check',
  operationId: 'analyzeCode',
  summary: 'Analyze source code and return metrics',
  tags: ['Analysis'],
  externalDocs: {
    description: 'Find more info about code analysis',
    url: 'https://github.com/includdy/a11y-toolbox'
  }
};

/**
 * Error Response Schema for Code Analysis
 * 
 * Defines the structure of error responses that may be returned
 * when code analysis fails or validation errors occur.
 */
export const AnalyzeCodeErrorSchema = Type.Object({
  error: Type.String({
    description: 'Human-readable error message',
    examples: [
      'Code is required',
      'Code too large',
      'Invalid code format',
      'Internal server error during code analysis'
    ]
  }),
  statusCode: Type.Integer({
    description: 'HTTP status code',
    minimum: 400,
    maximum: 599,
    examples: [400, 413, 500]
  })
}, {
  description: 'Error response for code analysis failures',
  additionalProperties: false,
  $id: 'AnalyzeCodeError',
  title: 'Code Analysis Error'
});

/**
 * TypeScript type for error responses
 */
export type AnalyzeCodeError = Static<typeof AnalyzeCodeErrorSchema>;
