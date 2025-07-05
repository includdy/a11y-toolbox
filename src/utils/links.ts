import { browserManager } from './common/browser.js';

/**
 * Interface for link information extracted from HTML document
 */
interface LinkInfo {
    element: string;
    href?: string;
    title?: string;
    role?: string;
    tagName: string;
    xpath: string;
    selector: string;
    accessibleText: string;
    innerText: string;
    pseudoBefore?: string;
    pseudoAfter?: string;
}

/**
 * Extracts all link elements from an HTML document string
 * 
 * @param htmlString - The HTML document as a string
 * @returns Array of LinkInfo objects containing link details
 */
async function extractLinks(htmlString: string): Promise<LinkInfo[]> {
    const page = await browserManager.createPageWithScripts(htmlString);
    
    try {
        // Execute the extraction function
        const result = await page.evaluate(() => {
            // Define selectors based on specifications:
            // - HTML: <a> tag with href attribute
            // - HTML: Any element with WAI-ARIA role="link" (with script-supported navigation)
            // TEMPORARY: Adding other elements for testing
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
            
            const links: any[] = [];
            const processedElements = new Set(); // Avoid duplicates
            
            selectors.forEach(selector => {
                const elements = document.querySelectorAll(selector);
                
                elements.forEach((element) => {
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
                    const href = element.getAttribute('href');
                    const role = element.getAttribute('role');
                    const title = element.getAttribute('title');
                    
                    // Use your getXpath function
                    let xpath = '';
                    let selector = '';
                    let accessibleText = '';
                    let pseudoBefore = '';
                    let pseudoAfter = '';

                    try {
                        // Call your getXpath function
                        if (typeof (window as any).getXpath === 'function') {
                            xpath = (window as any).getXpath(element);
                        } else {
                            console.error('getXpath function not available');
                            xpath = 'function-not-available';
                        }
                        if (typeof (window as any).getSelector === 'function') {
                            try {
                                selector = (window as any).getSelector(element);
                            } catch (selectorError) {
                                console.error('getSelector function failed:', selectorError);
                                selector = 'error-generating-selector';
                            }
                        } else {
                            console.error('getSelector function not available');
                            selector = 'function-not-available';
                        }
                        
                        // Calculate accessible text
                        if (typeof (window as any).getAccessibleText === 'function') {
                            try {
                                accessibleText = (window as any).getAccessibleText(element);
                            } catch (accessibleTextError) {
                                console.error('getAccessibleText function failed:', accessibleTextError);
                                accessibleText = element.textContent || '';
                            }
                        } else {
                            console.error('getAccessibleText function not available');
                            accessibleText = element.textContent || '';
                        }
                        
                    } catch (e) {
                        // Fallback if functions fail
                        console.error('Function execution failed:', e);
                        xpath = 'error-generating-xpath';
                        selector = 'error-generating-selector';
                        accessibleText = element.textContent || '';
                    }

                    try {
                        pseudoBefore = (window as any).getPseudoBefore(element);
                        pseudoAfter = (window as any).getPseudoAfter(element);
                    } catch (e) {
                        console.error('Pseudo element retrieval failed:', e);
                    }
                    
                    const linkInfo = {
                        element: originalHTML,
                        href: href || undefined,
                        title: title || undefined,
                        role: role || undefined,
                        tagName: tagName,
                        xpath: xpath,
                        selector: selector,
                        innerText: element.textContent || '',
                        pseudoBefore: pseudoBefore || undefined,
                        pseudoAfter: pseudoAfter || undefined,
                        accessibleText: accessibleText
                    };
                    
                    links.push(linkInfo);
                });
            });
            
            return links;
        }) as LinkInfo[];
        
        return result;
    } finally {
        await page.close();
    }
}

export { extractLinks, type LinkInfo };
