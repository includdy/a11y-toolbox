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
        getAccessibleText: (element: Element) => string;
    }
}

/**
 * Puppeteer-based HTML parser for link extraction
 */
export class BrowserManager {
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
     * Create a new page with HTML content and load required scripts
     * @param htmlString - The HTML string to load
     * @returns Configured page instance
     */
    async createPageWithScripts(htmlString: string): Promise<Page> {
        await this.init();
        
        const page = await this.browser!.newPage();
        
        // Set the HTML content
        await page.setContent(htmlString, { waitUntil: 'domcontentloaded' });
        
        // Read only the modules that are actually used
        const escapeSelectorCode = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'escape-selector.js'), 'utf8');
        const getXpathCode = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'getxpath.js'), 'utf8');
        const getSelectorCode = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'get-selector.js'), 'utf8');
        const getFriendlyUriEndCode = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'get-friendly-uri-end.js'), 'utf8');
        const getNodeAttributesCode = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'get-node-attributes.js'), 'utf8');
        const enhancedSelectorCode = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'enhanced-selector.js'), 'utf8');
        const getAccessibleTextCode = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'accessible-text.js'), 'utf8');
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

        // Load the accessible text logic
        await page.addScriptTag({
            content: getAccessibleTextCode
                .replace('export default getAccessibleText;', 'window.getAccessibleText = getAccessibleText;')
        });
        
        // Verify only the required functions are loaded
        const functionsAvailable = await page.evaluate(() => {
            return {
                escapeSelector: typeof window.escapeSelector === 'function',
                getXpath: typeof window.getXpath === 'function',
                getSelector: typeof window.getSelector === 'function',
                getFriendlyUriEnd: typeof window.getFriendlyUriEnd === 'function',
                getNodeAttributes: typeof window.getNodeAttributes === 'function',
                getAccessibleText: typeof window.getAccessibleText === 'function'
            };
        });
        
        // Only log if there are issues
        const hasIssues = Object.values(functionsAvailable).some(available => !available);
        if (hasIssues) {
            console.log('Functions availability check:', functionsAvailable);
        }
        
        return page;
    }
}

// Create a singleton instance
const browserManager = new BrowserManager();

// Graceful shutdown
process.on('SIGINT', async () => {
    await browserManager.close();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    await browserManager.close();
    process.exit(0);
});

export { browserManager };
