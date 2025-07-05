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
            const selectors = [
                'a[href]',           // HTML <a> tag with href attribute
                '[role="link"]'      // Element with WAI-ARIA role="link"
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
                    
                    const linkInfo = {
                        element: originalHTML,
                        href: href || undefined,
                        title: title || undefined,
                        role: role || undefined,
                        tagName: tagName,
                        xpath: xpath,
                        selector: selector,
                        innerText: element.textContent || '',
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
