import { Type, Static } from '@sinclair/typebox';

/**
 * Schema for the input payload of the AcctextCodeIn route
 * 
 * This schema defines the structure of the request payload for the AcctextCodeIn route.
 * It specifies the required fields and their constraints.
 */
export const AcctextCodeInSchema = Type.Object({
    code: Type.String({
        description: 'Calculates accessible text for all elements in the DOM',
        minLength: 1,
        maxLength: 1000000, // Reasonable limit to prevent abuse - maybe more?
    })
}, {
    description: 'Request payload for HTML analysis',
    additionalProperties: false, // Strict validation - no extra fields allowed
    $id: 'AcctextCodeIn',
    title: 'Accessible Text Analysis Input',
});

/**
 * TypeScript type derived from the input schema
 * Provides compile-time type safety for accessible text analysis input
 */
export type AcctextCodeIn = Static<typeof AcctextCodeInSchema>;

/**
 * Output Schema for Code Analysis Results
 * 
 * Defines the structure of analysis results returned after processing the input code.  
 * 
 * 
 **/
export const AcctextCodeOutSchema = Type.Object({
    elements: Type.Array(Type.Object({
        element: Type.String({
            description: 'The full HTML element as a string'
        }),
        tagName: Type.String({
            description: 'The HTML tag name of the element'
        }),
        innerText: Type.String({
            description: 'The text content of the element'
        }),
        accessibleText: Type.String({
            description: 'The accessible text for the element'
        }),
        xpath: Type.String({
            description: 'The XPath selector for the element'
        }),
        selector: Type.String({
            description: 'The CSS selector for the element'
        }),
        role: Type.Optional(Type.String({
            description: 'The role of the element'
        })),
        ariaLabel: Type.Optional(Type.String({
            description: 'The aria-label attribute of the element, if present'
        })),
        ariaLabelledby: Type.Optional(Type.String({
            description: 'The aria-labelledby attribute of the element, if present'
        })),
        href: Type.Optional(Type.String({
            description: 'The href attribute of the element, if present'
        })),
        alt: Type.Optional(Type.String({
            description: 'The alt attribute of the element, if present'
        })),
        pseudoBefore: Type.Optional(Type.String({
            description: 'The content of the ::before pseudo-element, if present'
        })),
        pseudoAfter: Type.Optional(Type.String({
            description: 'The content of the ::after pseudo-element, if present'
        })),
        placeholder: Type.Optional(Type.String({
            description: 'The placeholder of the element, if present'
        })),
        altText: Type.Optional(Type.String({
            description: 'The alt text of the MathML element, if present'
        })),
        annotation: Type.Optional(Type.String({
            description: 'The annotation of the MathML element, if present'
        })),
        title: Type.Optional(Type.String({
            description: 'The title attribute of the element, if present'
        }))
    }), {
        description: 'Information about an element in the DOM'
    })
}, {
    description: 'Analysis completed successfully',
    additionalProperties: false, // Strict validation - no extra fields allowed
    $id: 'AcctextCodeOut',
    title: 'Accessible Text Analysis Output',
});

/**
 * Error Response Schema for Accessible Text Analysis
 * 
 * Defines the structure of error responses that may be returned
 * when accessible text analysis fails or validation errors occur.
 */
export const AcctextCodeErrorSchema = Type.Object({
    error: Type.String(),
    statusCode: Type.Integer({
        description: 'HTTP status code',
        minimum: 400,
        maximum: 599,
        examples: [400, 413, 500]
    })
}, {
    description: 'Error response for accessible text analysis failures',
    additionalProperties: false,
    $id: 'AcctextCodeError',
    title: 'Accessible Text Analysis Error'
});

