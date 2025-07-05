import { Type, Static } from '@sinclair/typebox';

/**
 * Schema for the input payload of the LinksCodeIn route
 * 
 * This schema defines the structure of the request payload for the LinksCodeIn route.
 * It specifies the required fields and their constraints.
 */
export const LinksCodeInSchema = Type.Object({
    code: Type.String({
      description: 'Calculates accessible names and descriptions for all links in the code',
      minLength: 1,
      maxLength: 1000000, // Reasonable limit to prevent abuse - maybe more?
    })
  }, {
    description: 'Request payload for HTML analysis',
    additionalProperties: false, // Strict validation - no extra fields allowed
    $id: 'LinksCodeIn',
    title: 'Links Analysis Input',
  });
  
  /**
   * TypeScript type derived from the input schema
   * Provides compile-time type safety for links analysis input
   */
  export type LinksCodeIn = Static<typeof LinksCodeInSchema>;

/**
 * Output Schema for Code Analysis Results
 * 
 * Defines the structure of analysis results returned after processing the input code.
 * Each field provides specific metrics about the analyzed code snippet.
 * 
 * 
 **/
export const LinksCodeOutSchema = Type.Object({
    links: Type.Array(Type.Object({
        element: Type.String({
            description: 'The full HTML element as a string'
        }),
        href: Type.Optional(Type.String({
            description: 'The href attribute of the link, if present'
        })),
        title: Type.Optional(Type.String({
            description: 'The title attribute of the link, if present'
        })),
        role: Type.Optional(Type.String({
            description: 'The role attribute of the link, if present'
        })),
        tagName: Type.String({
            description: 'The HTML tag name (e.g., "a", "area", "link")'
        }),
        xpath: Type.String({
            description: 'XPath selector for the element'
        }),
        selector: Type.String({
            description: 'CSS selector for the element'
        }),
        accessibleText: Type.String({
            description: 'The accessible text of the element'
        }),
        pseudoBefore: Type.String({
            description: 'The content of the ::before pseudo-element, if present'
        }),
        pseudoAfter: Type.String({
            description: 'The content of the ::after pseudo-element, if present'
        }),
        innerText: Type.String({
            description: 'The text content of the element'
        })
    }), {
        description: 'Information about a link element found in the HTML'
    })
}, {
    description: 'Results of links analysis containing all found links',
    additionalProperties: false,
    $id: 'LinksCodeOut',
    title: 'Links Analysis Results'
});

/**
 * Error Response Schema for Links Analysis
 * 
 * Defines the structure of error responses that may be returned
 * when links analysis fails or validation errors occur.
 */
export const LinksCodeErrorSchema = Type.Object({
    error: Type.String(),
    statusCode: Type.Integer({
        description: 'HTTP status code',
        minimum: 400,
        maximum: 599,
        examples: [400, 413, 500]
    })
}, {
    description: 'Error response for links analysis failures',
    additionalProperties: false,
    $id: 'LinksCodeError',
    title: 'Links Analysis Error'
});


