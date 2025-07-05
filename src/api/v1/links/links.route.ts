import { FastifyInstance } from 'fastify';
import {
  LinksCodeInSchema,
  LinksCodeOutSchema,
  LinksCodeErrorSchema,
  LinksCodeIn
} from './links.schema.js';
import { extractLinks } from '../../../utils/links';

/**
 * Register links analysis routes with the Fastify application
 * 
 * @param app - The Fastify instance to register routes with
 */
export default async function routes(app: FastifyInstance) {
    /**
     * POST /
     * 
     * Analyzes HTML code and returns links with accessibility information
     * 
     * Accepts both JSON and raw HTML:
     * - JSON: {"code": "<html>...</html>"}
     * - Raw HTML: Content-Type: text/html with HTML in body
     * 
     * @example Request (JSON)
     * ```json
     * {
     *   "code": "<html><body><a href='https://example.com'>Example</a></body></html>"
     * }
     * ```
     * 
     * @example Request (Raw HTML)
     * ```
     * Content-Type: text/html
     * 
     * <html><body><a href='https://example.com'>Example</a></body></html>
     * ```
     * 
     * @example Response
     * ```json
     * {
     *   "links": [
     *     {
     *       "element": "<a href='https://example.com'>Example</a>",
     *       "href": "https://example.com",
     *       "title": "Example",
     *       "role": "link",
     *       "tagName": "a",
     *       "xpath": "/html/body/a",
     *     }
     *   ]
     * }
     * ```
     */
    app.post<{ Body: LinksCodeIn | string }>(
        '/',
        {
            schema: {
                operationId: 'analyzeLinks',
                summary: 'Analyze HTML code and return links with accessibility information',
                description: 'Analyzes the provided HTML code and returns all links with comprehensive accessibility information including accessible names, roles, and DOM selectors. Accepts both JSON format ({"code": "html"}) and raw HTML (Content-Type: text/html).',
                tags: ['Links'],
                body: {
                    oneOf: [
                        LinksCodeInSchema,
                        {
                            type: 'string',
                            description: 'Raw HTML content (when Content-Type is text/html)'
                        }
                    ]
                },
                response: {
                    200: {
                        description: 'Analysis completed successfully',
                        ...LinksCodeOutSchema
                    },
                    400: {
                        description: 'Invalid request - code is required and must be a non-empty string',
                        ...LinksCodeErrorSchema
                    },
                    413: {
                        description: 'Request too large - code exceeds maximum allowed size',
                        ...LinksCodeErrorSchema
                    },
                    500: {
                        description: 'Internal server error during code analysis',
                        ...LinksCodeErrorSchema
                    }
                }
            }
        },
        async (request, reply) => {
            try {
                let htmlCode: string;
                
                // Check content type and extract HTML accordingly
                const contentType = request.headers['content-type'] || '';
                
                if (contentType.includes('text/html')) {
                    // Raw HTML content
                    htmlCode = request.body as string;
                } else {
                    // JSON content
                    const body = request.body as LinksCodeIn;
                    htmlCode = body?.code || '';
                }
                
                // Validate input
                if (!htmlCode || typeof htmlCode !== 'string' || htmlCode.trim().length === 0) {
                    return reply.status(400).send({
                        error: 'HTML code is required and must be a non-empty string',
                        statusCode: 400
                    });
                }

                // Extract links with error handling
                const links = await extractLinks(htmlCode);
                
                // Log successful analysis
                app.log.info(`Successfully analyzed ${links.length} links from HTML code`);
                
                return reply.send({ links });
                
            } catch (error) {
                // Enhanced error logging with more context
                app.log.error({
                    error: error instanceof Error ? error.message : String(error),
                    stack: error instanceof Error ? error.stack : undefined,
                    contentType: request.headers['content-type'],
                    bodyLength: typeof request.body === 'string' ? request.body.length : JSON.stringify(request.body || {}).length
                }, 'Error analyzing links');
                
                // Return appropriate error response
                const statusCode = error instanceof Error && error.message.includes('too large') ? 413 : 500;
                const errorMessage = statusCode === 413 
                    ? 'Request too large - HTML code exceeds maximum allowed size'
                    : 'Internal server error during links analysis';
                
                return reply.status(statusCode).send({
                    error: errorMessage,
                    statusCode
                });
            }
        }
    );
}