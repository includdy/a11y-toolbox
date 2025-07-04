/**
 * Code Analysis Routes Module
 * 
 * This module defines the HTTP routes for the code analysis functionality.
 * It provides RESTful endpoints for analyzing source code and returning metrics.
 * 
 * The routes are automatically documented by Fastify's Swagger integration
 * and will appear in the OpenAPI documentation at /docs.
 */

import { FastifyInstance } from 'fastify';
import {
  AnalyzeCodeInSchema,
  AnalyzeCodeOutSchema,
  AnalyzeCodeErrorSchema,
  AnalyzeCodeIn
} from './analyze.schema.js';
import { analyzeSnippet } from './analyze.service.js';

/**
 * Register code analysis routes with the Fastify application
 * 
 * @param app - The Fastify instance to register routes with
 */
export default async function routes(app: FastifyInstance) {
  /**
   * POST /
   * 
   * Analyzes source code and returns basic metrics including:
   * - Line count (including empty lines)
   * - Character count (including whitespace)
   * - Whether the code is empty
   * 
   * This endpoint accepts any programming language or text content
   * and provides quick analysis for code snippets up to 100KB.
   * 
   * @example Request
   * ```json
   * {
   *   "code": "function fibonacci(n) {\n  return n <= 1 ? n : fibonacci(n-1) + fibonacci(n-2);\n}"
   * }
   * ```
   * 
   * @example Response
   * ```json
   * {
   *   "lines": 3,
   *   "chars": 89,
   *   "is_empty": false
   * }
   * ```
   */
  app.post<{ Body: AnalyzeCodeIn }>(
    '/',
    {
      schema: {
        operationId: 'analyzeCode',
        summary: 'Analyze source code and return metrics',
        description: `
          Analyzes the provided source code and returns basic metrics including:
          
          - **lines**: Total number of lines in the code snippet (including empty lines)
          - **chars**: Total number of characters in the code snippet (including whitespace)
          - **is_empty**: Whether the code snippet contains only whitespace characters
          
          The analysis works with any programming language or text content.
          Maximum code size is 100KB to prevent abuse.
          
          ## Usage Examples
          
          ### Simple JavaScript function
          \`\`\`json
          {
            "code": "function greet(name) { return \`Hello, \${name}!\`; }"
          }
          \`\`\`
          
          ### Python code with multiple lines
          \`\`\`json
          {
            "code": "def fibonacci(n):\\n    if n <= 1:\\n        return n\\n    return fibonacci(n-1) + fibonacci(n-2)"
          }
          \`\`\`
        `,
        tags: ['Analysis'],
        body: AnalyzeCodeInSchema,
        response: {
          200: {
            description: 'Analysis completed successfully',
            ...AnalyzeCodeOutSchema
          },
          400: {
            description: 'Invalid request - code is required and must be a non-empty string',
            ...AnalyzeCodeErrorSchema
          },
          413: {
            description: 'Request too large - code exceeds 100KB limit',
            ...AnalyzeCodeErrorSchema
          },
          500: {
            description: 'Internal server error during code analysis',
            ...AnalyzeCodeErrorSchema
          }
        }
      }
    },
    async (req, rep) => {
      try {
        const result = analyzeSnippet(req.body.code);
        return rep.send(result);
      } catch (error) {
        app.log.error('Error analyzing code:', error);
        return rep.status(500).send({
          error: 'Internal server error during code analysis',
          statusCode: 500
        });
      }
    }
  );
}
