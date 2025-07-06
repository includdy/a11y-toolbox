import { FastifyInstance } from 'fastify';
import {
  AcctextCodeInSchema,
  AcctextCodeOutSchema,
  AcctextCodeErrorSchema,
  AcctextCodeIn
} from './acctext.schema.js';
import { extractAccessibleText } from '../../../utils/acctext.js';

/**
 * Register accessible text analysis routes with the Fastify application
 * 
 * @param app - The Fastify instance to register routes with
 */
export default async function routes(app: FastifyInstance) {
    /**
     * POST /
     * 
     * Analyzes HTML code and returns accessible text for each element of the DOM
     * 
     * Accepts raw HTML:
     * - Raw HTML: Content-Type: text/html with HTML in body
     * 
     * @example Request (JSON)
     * 
     * <html><body><a href='https://example.com'>Example</a></body></html>
     * ```
     * 
     * @example Response
     * ```json
     * [
     *   {
     *     "element": "<a href='https://example.com'>Example</a>",
     *     "accessibleText": "Example"
     *   }
     * ]
     * ```
     */
    app.post<{ Body: AcctextCodeIn | string }>(
        '/',
        {
            schema: {
                operationId: 'analyzeAcctext',
                summary: 'Analyze HTML code and return accessible text for each element of the DOM',
                description: 'Analyzes the provided HTML code and returns accessible text for each element of the DOM. Accepts raw HTML (Content-Type: text/html).',
                tags: ['Accessible Text'],
                body: {
                    oneOf: [
                        AcctextCodeInSchema,
                        {
                            type: 'string',
                            description: 'Raw HTML content (when Content-Type is text/html)'
                        }
                    ]
                },
                response: {
                    200: {
                        description: 'Analysis completed successfully',
                        ...AcctextCodeOutSchema
                    },
                    400: {
                        description: 'Invalid request - code is required and must be a non-empty string',
                        ...AcctextCodeErrorSchema
                    },
                    413: {
                        description: 'Request too large - code exceeds maximum allowed size',
                        ...AcctextCodeErrorSchema
                    },
                    500: {
                        description: 'Internal server error during code analysis',
                        ...AcctextCodeErrorSchema
                    }
                }
            }
        },
        async (request, reply) => {
            try {
                let htmlCode: string;
                
                // Check content type and extract HTML accordingly
                const contentType = request.headers['content-type'] || '';

                // Validate content type
                if (!contentType.includes('text/html')) {
                    return reply.status(400).send({
                        error: 'Content-Type must be text/html',
                        statusCode: 400
                    });
                }

                // Get HTML content from request body
                htmlCode = request.body as string;

                // Validate input
                if (!htmlCode || typeof htmlCode !== 'string' || htmlCode.trim().length === 0) {
                    return reply.status(400).send({
                        error: 'HTML code is required and must be a non-empty string',
                        statusCode: 400
                    });
                }

                // Analyze accessible text
                const elements = await extractAccessibleText(htmlCode);
                
                // Log successful analysis
                app.log.info(`Successfully analyzed accessible text for ${elements.length} elements`);
                
                return reply.send({ elements });

            } catch (error) {
                // Enhanced error logging with more context
                app.log.error({
                    error: error instanceof Error ? error.message : String(error),
                    stack: error instanceof Error ? error.stack : undefined,
                });
                
                // Return appropriate error response
                const statusCode = error instanceof Error && error.message.includes('too large') ? 413 : 500;
                const errorMessage = statusCode === 413 
                    ? 'Request too large - HTML code exceeds maximum allowed size'
                    : 'Internal server error during accessible text analysis';
                
                return reply.status(statusCode).send({
                    error: errorMessage,
                    statusCode
                });
            }
        }
    );
}