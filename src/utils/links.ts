import puppeteer, { Browser, Page } from 'puppeteer';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Extend Window interface to include our custom functions
declare global {
    interface Window {
        escapeSelector: (value: string) => string;
        getXpath: (element: Element) => string;
        getSelector: (element: Element) => string;
        getFriendlyUriEnd: (uri: string) => string;
        getNodeAttributes: (node: Element) => Attr[];
    }
}

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
    innerText: string;
}

/**
 * Puppeteer-based HTML parser for link extraction
 */
class LinkParser {
    private browser: Browser | null = null;

    constructor() {
        // Using imported functions from common.ts directly
    }

    /**
     * Initialize the browser instance
     */
    async init(): Promise<void> {
        if (!this.browser) {
            this.browser = await puppeteer.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
        }
    }

    /**
     * Close the browser instance
     */
    async close(): Promise<void> {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
    }

    /**
     * Extract links from HTML using the browser environment
     * @param htmlString - The HTML string to parse
     * @returns Array of link information
     */
    async extractLinks(htmlString: string): Promise<LinkInfo[]> {
        await this.init();
        
        const page = await this.browser!.newPage();
        
        try {
            // Set the HTML content
            await page.setContent(htmlString, { waitUntil: 'domcontentloaded' });
            
            // Read only the modules that are actually used
            const escapeSelectorCode = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'common/escape-selector.js'), 'utf8');
            const getXpathCode = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'common/getxpath.js'), 'utf8');
            const getSelectorCode = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'common/get-selector.js'), 'utf8');
            const getFriendlyUriEndCode = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'common/get-friendly-uri-end.js'), 'utf8');
            const getNodeAttributesCode = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'common/get-node-attributes.js'), 'utf8');
            const enhancedSelectorCode = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'common/enhanced-selector.js'), 'utf8');
            
            // Load modules in proper dependency order
            // First load escapeSelector (no dependencies)
            await page.addScriptTag({
                content: escapeSelectorCode.replace('export default escapeSelector;', 'window.escapeSelector = escapeSelector;')
            });
            
            // Load getFriendlyUriEnd (depends on escapeSelector)
            await page.addScriptTag({
                content: getFriendlyUriEndCode
                    .replace(/import.*?from.*?['"].*?['"];?\s*/g, '')
                    .replace('export default getFriendlyUriEnd;', 'window.getFriendlyUriEnd = getFriendlyUriEnd;')
                    .replace(/escapeSelector\(/g, 'window.escapeSelector(')
            });
            
            // Load getNodeAttributes (depends on escapeSelector)
            await page.addScriptTag({
                content: getNodeAttributesCode
                    .replace(/import.*?from.*?['"].*?['"];?\s*/g, '')
                    .replace('export default getNodeAttributes;', 'window.getNodeAttributes = getNodeAttributes;')
                    .replace(/escapeSelector\(/g, 'window.escapeSelector(')
            });
            
            // Load getXpath (depends on escapeSelector)
            await page.addScriptTag({
                content: getXpathCode
                    .replace('import escapeSelector from \'./escape-selector.js\';', '')
                    .replace('export default getXpath;', 'window.getXpath = getXpath;')
                    .replace(/escapeSelector\(/g, 'window.escapeSelector(')
            });
            
            // Load the base get-selector.js functions (without the final export)
            await page.addScriptTag({
                content: getSelectorCode
                    .replace(/import.*?from.*?['"].*?['"];?\s*/g, '')
                    .replace('export default memoize(getSelector);', '')
                    .replace('export function getSelectorData', 'window.getSelectorData = function getSelectorData')
                    .replace(/escapeSelector\(/g, 'window.escapeSelector(')
                    .replace(/getFriendlyUriEnd\(/g, 'window.getFriendlyUriEnd(')
                    .replace(/getNodeAttributes\(/g, 'window.getNodeAttributes(')
                    // Provide stub implementations for unused functions
                    .replace(/matchesSelector\(/g, 'window.matchesSelector(')
                    .replace(/isXHTML\(/g, 'window.isXHTML(')
                    .replace(/getShadowSelector\(/g, 'window.getShadowSelector(')
                    .replace(/memoize\(/g, 'window.memoize(')
            });
            
            // Load the enhanced selector logic
            await page.addScriptTag({
                content: enhancedSelectorCode
            });
            
            // Verify only the required functions are loaded
            const functionsAvailable = await page.evaluate(() => {
                return {
                    escapeSelector: typeof window.escapeSelector === 'function',
                    getXpath: typeof window.getXpath === 'function',
                    getSelector: typeof window.getSelector === 'function',
                    getFriendlyUriEnd: typeof window.getFriendlyUriEnd === 'function',
                    getNodeAttributes: typeof window.getNodeAttributes === 'function'
                };
            });
            
            // Only log if there are issues
            const hasIssues = Object.values(functionsAvailable).some(available => !available);
            if (hasIssues) {
                console.log('Functions availability check:', functionsAvailable);
            }
            
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
                            
                        } catch (e) {
                            // Fallback if functions fail
                            console.error('Function execution failed:', e);
                            xpath = 'error-generating-xpath';
                            selector = 'error-generating-selector';
                        }
                        
                        const linkInfo = {
                            element: originalHTML,
                            href: href || undefined,
                            title: title || undefined,
                            role: role || undefined,
                            tagName: tagName,
                            xpath: xpath,
                            selector: selector,
                            innerText: element.textContent || ''
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
}

// Create a singleton instance
const linkParser = new LinkParser();

/**
 * Extracts all link elements from an HTML document string
 * 
 * @param htmlString - The HTML document as a string
 * @returns Array of LinkInfo objects containing link details
 */
async function extractLinks(htmlString: string): Promise<LinkInfo[]> {
    return await linkParser.extractLinks(htmlString);
}

// Graceful shutdown
process.on('SIGINT', async () => {
    await linkParser.close();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    await linkParser.close();
    process.exit(0);
});

export { extractLinks, type LinkInfo };
