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
   * Accepts both JSON and raw code:
   * - JSON: {"code": "function() {...}"}
   * - Raw code: Content-Type: text/plain or text/html with code in body
   * 
   * @example Request (JSON)
   * ```json
   * {
   *   "code": "function fibonacci(n) {\n  return n <= 1 ? n : fibonacci(n-1) + fibonacci(n-2);\n}"
   * }
   * ```
   * 
   * @example Request (Raw Code)
   * ```
   * Content-Type: text/plain
   * 
   * function fibonacci(n) {
   *   return n <= 1 ? n : fibonacci(n-1) + fibonacci(n-2);
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
  app.post<{ Body: AnalyzeCodeIn | string }>(
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
          
          Accepts both JSON format ({"code": "..."}) and raw code (Content-Type: text/plain or text/html).
          
          ## Usage Examples
          
          ### Simple JavaScript function (JSON)
          \`\`\`json
          {
            "code": "function greet(name) { return \`Hello, \${name}!\`; }"
          }
          \`\`\`
          
          ### Python code with multiple lines (Raw)
          \`\`\`
          Content-Type: text/plain
          
          def fibonacci(n):
              if n <= 1:
                  return n
              return fibonacci(n-1) + fibonacci(n-2)
          \`\`\`
        `,
        tags: ['Analysis'],
        body: {
          oneOf: [
            AnalyzeCodeInSchema,
            {
              type: 'string',
              description: 'Raw code content (when Content-Type is text/plain or text/html)'
            }
          ]
        },
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
        let code: string;
        
        // Check content type and extract code accordingly
        const contentType = req.headers['content-type'] || '';
        
        if (contentType.includes('text/plain') || contentType.includes('text/html')) {
          // Raw code content
          code = req.body as string;
        } else {
          // JSON content
          const body = req.body as AnalyzeCodeIn;
          code = body?.code || '';
        }
        
        // Validate input
        if (!code || typeof code !== 'string') {
          return rep.status(400).send({
            error: 'Code is required and must be a non-empty string',
            statusCode: 400
          });
        }
        
        const result = await analyzeSnippet(code);
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
