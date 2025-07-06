import { browserManager } from './common/browser.js';

/**
 * Interface for accessible text information extracted from HTML document
 */

interface AccessibleTextInfo {
    element: string;
    tagName: string;
    innerText: string;
    accessibleText: string;
    xpath: string;
    selector: string;
    role?: string;
    ariaLabel?: string;
    ariaLabelledby?: string;
    href?: string;
    alt?: string;
    pseudoBefore?: string;
    pseudoAfter?: string;
    placeholder?: string;
    altText?: string;
    annotation?: string;
    title?: string;
}

/**
 * Extracts accessible text information from an HTML document   
 * 
 * @param htmlString - The HTML document as a string
 * @returns Array of AccessibleTextInfo objects containing accessible text details
 */
async function extractAccessibleText(htmlString: string): Promise<AccessibleTextInfo[]> {
    const page = await browserManager.createPageWithScripts(htmlString);
    
    try {
        // Execute the extraction function
        const result = await page.evaluate(() => {
            // Define selectors based on specifications:
            // TODO: Add more selectors as needed
            const selectors = [
                'a[href]',           // HTML <a> tag with href attribute
                '[role="link"]',     // Element with WAI-ARIA role="link"
                'button',            // Button elements for testing
                'input',             // Input elements (all types)
                'select',            // Select elements for testing
                'textarea',          // Textarea elements for testing
                'fieldset',          // Fieldset elements for testing
                'table',             // Table elements for testing
                'figure',            // Figure elements for testing
                'img',               // Image elements for alt text testing
                'object',            // Object elements for embedded content
                'embed',             // Embed elements for media content
                'iframe',            // Iframe elements for frame testing
                'audio',             // Audio elements for media testing
                'video',             // Video elements for media testing
                'canvas',            // Canvas elements for graphics testing
                'svg',               // SVG elements for vector graphics
                'math',              // MathML elements for mathematical content
                'label',             // Label elements for form associations
                'div[id*="pseudo"]', // Div elements with pseudo in ID for testing
                'div[role]',         // Div elements with ARIA roles
                'span[id]',          // Span elements with IDs (for aria-labelledby)
                'div[id]',           // Div elements with IDs (for aria-labelledby)
                '[aria-label]',      // Any element with aria-label
                '[aria-labelledby]', // Any element with aria-labelledby
                '[aria-hidden]',     // Any element with aria-hidden
                '[role="form"]',     // Elements with form role
                '[role="checkbox"]', // Elements with checkbox role
                '[role="radio"]',    // Elements with radio role
                '[role="button"]',   // Elements with button role
                '[role="textbox"]',  // Elements with textbox role
                '[role="slider"]',   // Elements with slider role
                '[role="progressbar"]', // Elements with progressbar role
                '[role="img"]',      // Elements with img role
                '[role="heading"]',  // Elements with heading role
                '[role="group"]',    // Elements with group role
                '[role="region"]',   // Elements with region role
                '[role="alert"]',    // Elements with alert role
                '[role="status"]',   // Elements with status role
                '[role="log"]',      // Elements with log role
                '[role="marquee"]',  // Elements with marquee role
                '[role="timer"]',    // Elements with timer role
                '[role="columnheader"]', // Elements with columnheader role
                '[role="presentation"]', // Elements with presentation role
                '[role="none"]',     // Elements with none role
                '[contenteditable]', // Elements with contenteditable
                'custom-element',    // Custom elements
                'my-autonomous-element', // Autonomous custom elements
                '[is]',              // Customized built-in elements
                'xml\\:element',     // XML namespace elements
                'xhtml\\:span'       // XHTML namespace elements
            ];

            const elementsArray: AccessibleTextInfo[] = [];
            const processedElements = new Set(); // Avoid duplicates

            selectors.forEach(selector => {
                const nodeList = document.querySelectorAll(selector);

                nodeList.forEach((element) => {
                    // Avoid duplicates
                    if (processedElements.has(element)) {
                        return;
                    }

                    processedElements.add(element);

                    // Capture original element HTML before adding attributes
                    const originalHTML = element.outerHTML;
                    
                    // Set the required data attribute for common.ts functions
                    element.setAttribute('data-a11y-el-exposed', 'true');

                    const tagName = element.tagName.toLowerCase();
                    const innerText = element.textContent || '';
                    const role = element.getAttribute('role') || undefined;
                    const ariaLabel = element.getAttribute('aria-label') || undefined;
                    const ariaLabelledby = element.getAttribute('aria-labelledby') || undefined;
                    const href = element.getAttribute('href') || undefined;
                    const alt = element.getAttribute('alt') || undefined;
                    const placeholder = element.getAttribute('placeholder') || undefined;
                    const altText = element.getAttribute('alttext') || undefined;
                    const annotation = element.querySelector('semantics > annotation[encoding="text/plain"]')?.textContent || undefined;
                    const title = element.getAttribute('title') || undefined;

                    let xpath = '';
                    let selector = '';
                    let accessibleText = '';
                    let pseudoBefore = '';
                    let pseudoAfter = '';
                    
                    try {
                        if (typeof (window as any).getXpath === 'function') {
                            xpath = (window as any).getXpath(element);
                        }
                    } catch (e) {
                        console.error('getXpath function not available');
                    }

                    try {
                        if (typeof (window as any).getSelector === 'function') {
                            selector = (window as any).getSelector(element);
                        }
                    } catch (e) {
                        console.error('getSelector function not available');
                    }

                    try {
                        if (typeof (window as any).getAccessibleText === 'function') {
                            accessibleText = (window as any).getAccessibleText(element);
                        }
                    } catch (e) {
                        console.error('getAccessibleText function not available');
                        accessibleText = element.textContent || '';
                    }
                    
                    try {
                        if (typeof (window as any).getPseudoElementContent === 'function') {
                            const pseudoContent = (window as any).getPseudoElementContent(element);
                            pseudoBefore = pseudoContent.beforeContent || undefined;
                            pseudoAfter = pseudoContent.afterContent || undefined;
                        }
                    } catch (e) {
                        console.error('getPseudoElementContent function not available');
                    }

                    elementsArray.push({
                        element: originalHTML,
                        tagName,
                        innerText,
                        accessibleText,
                        xpath,
                        selector,
                        role,
                        ariaLabel,
                        ariaLabelledby,
                        href,
                        alt,
                        ...(pseudoBefore && { pseudoBefore }),
                        ...(pseudoAfter && { pseudoAfter }),
                        placeholder,
                        altText,
                        annotation,
                        title
                    });
                });
            });

            return elementsArray;
        });

        return result;
    } finally {
        await page.close();
    }
}

export { extractAccessibleText, type AccessibleTextInfo };