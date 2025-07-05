import { extractLinks } from './dist/utils/links.js';

// Test HTML with multiple elements that could create generic selectors
const testHTML = `
<!DOCTYPE html>
<html>
<head>
    <title>Test Page</title>
</head>
<body>
    <div id="page">
        <header id="header">
            <div class="l-header__main">
                <div class="l-header__head">
                    <div class="l-header__left">
                        <h1 class="l-header__logo">
                            <a href="/">Home</a>
                        </h1>
                    </div>
                    <div class="l-header__right">
                        <nav class="nav">
                            <a href="/products" class="nav-link">Products</a>
                            <a href="/services" class="nav-link">Services</a>
                            <a href="/about" class="nav-link">About</a>
                        </nav>
                    </div>
                </div>
            </div>
        </header>
        <main>
            <section class="hero">
                <div class="container">
                    <h2>Welcome</h2>
                    <p>This is a test page with multiple nav-link elements.</p>
                    <div class="buttons">
                        <a href="/signup" class="btn btn-primary">Sign Up</a>
                        <a href="/login" class="btn btn-secondary">Login</a>
                    </div>
                </div>
            </section>
            <section class="content">
                <div class="container">
                    <div class="grid">
                        <div class="card">
                            <h3>Card 1</h3>
                            <p>Some content</p>
                            <a href="/card1" class="btn">Learn More</a>
                        </div>
                        <div class="card">
                            <h3>Card 2</h3>
                            <p>Some content</p>
                            <a href="/card2" class="btn">Learn More</a>
                        </div>
                    </div>
                </div>
            </section>
            <div role="link" onclick="navigate('/contact')" class="contact-link">Contact Us</div>
        </main>
        <footer>
            <div class="container">
                <div class="footer-links">
                    <a href="/privacy" class="footer-link">Privacy Policy</a>
                    <a href="/terms" class="footer-link">Terms of Service</a>
                </div>
            </div>
        </footer>
    </div>
</body>
</html>
`;

async function testSelectors() {
    console.log('Testing enhanced hierarchical selector generation...\n');
    
    try {
        console.log('Calling extractLinks...');
        const links = await extractLinks(testHTML);
        console.log('extractLinks completed');
        
        console.log(`Found ${links.length} links:\n`);
        
        links.forEach((link, index) => {
            console.log(`Link ${index + 1}:`);
            console.log(`  Text: "${link.innerText}"`);
            console.log(`  XPath: ${link.xpath}`);
            console.log(`  Selector: ${link.selector}`);
            console.log(`  Href: ${link.href || 'N/A'}`);
            console.log(`  Tag: ${link.tagName}`);
            console.log(`  Role: ${link.role || 'N/A'}`);
            console.log('');
        });
        
        // Verify selectors are unique and hierarchical
        const selectors = links.map(link => link.selector);
        const uniqueSelectors = new Set(selectors);
        
        console.log(`Generated ${selectors.length} selectors, ${uniqueSelectors.size} unique`);
        
        if (selectors.length === uniqueSelectors.size) {
            console.log('✅ All selectors are unique!');
        } else {
            console.log('❌ Some selectors are not unique:');
            const duplicates = selectors.filter((selector, index) => selectors.indexOf(selector) !== index);
            duplicates.forEach(dup => console.log(`  - ${dup}`));
        }
        
        // Check for hierarchical depth
        const hierarchicalSelectors = selectors.filter(s => s.includes(' > '));
        console.log(`\n${hierarchicalSelectors.length} out of ${selectors.length} selectors are hierarchical`);
        
        if (hierarchicalSelectors.length > 0) {
            console.log('✅ Hierarchical selectors generated successfully!');
        } else {
            console.log('❌ No hierarchical selectors found - may be too generic');
        }
        
    } catch (error) {
        console.error('Test failed:', error);
        console.error('Stack trace:', error.stack);
    }
}

console.log('Starting test execution...');
testSelectors().then(() => {
    console.log('Test execution completed');
    process.exit(0);
}).catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
}); 