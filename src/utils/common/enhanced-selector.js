// Enhanced selector generation with full DOM context analysis
// This script is injected into the browser context to provide sophisticated selector generation

// Create a function to build DOM tree statistics for the entire document
function buildFullDomStatistics() {
    const data = {
        classes: {},
        tags: {},
        attributes: {}
    };
    
    // Process all elements in the document
    const allElements = document.querySelectorAll('*');
    
    allElements.forEach(node => {
        if (node.nodeType === 1) { // Element node
            // Count the tag
            const tag = node.nodeName;
            data.tags[tag] = (data.tags[tag] || 0) + 1;
            
            // Count classes
            if (node.classList && node.classList.length > 0) {
                Array.from(node.classList).forEach(cl => {
                    const ind = window.escapeSelector(cl);
                    data.classes[ind] = (data.classes[ind] || 0) + 1;
                });
            }
            
            // Count attributes (excluding ignored ones)
            if (node.hasAttributes()) {
                const ignoredAttributes = [
                    'class', 'style', 'id', 'selected', 'checked', 'disabled', 'tabindex',
                    'aria-checked', 'aria-selected', 'aria-invalid', 'aria-activedescendant',
                    'aria-busy', 'aria-disabled', 'aria-expanded', 'aria-grabbed',
                    'aria-pressed', 'aria-valuenow', 'xmlns'
                ];
                
                Array.from(window.getNodeAttributes(node))
                    .filter(at => {
                        return !ignoredAttributes.includes(at.name) && 
                               at.name.indexOf(':') === -1 && 
                               (!at.value || at.value.length < 31);
                    })
                    .forEach(at => {
                        const name = at.name;
                        let atnv;
                        
                        if (name.indexOf('href') !== -1 || name.indexOf('src') !== -1) {
                            const friendly = window.getFriendlyUriEnd(node.getAttribute(name));
                            if (friendly) {
                                atnv = window.escapeSelector(at.name) + '$="' + friendly.replace(/([\\"])/g, '\\$1').replace(/(\\r\\n|\\r|\\n)/g, '\\a ') + '"';
                            } else {
                                atnv = window.escapeSelector(at.name) + '="' + node.getAttribute(name).replace(/([\\"])/g, '\\$1').replace(/(\\r\\n|\\r|\\n)/g, '\\a ') + '"';
                            }
                        } else {
                            atnv = window.escapeSelector(name) + '="' + at.value.replace(/([\\"])/g, '\\$1').replace(/(\\r\\n|\\r|\\n)/g, '\\a ') + '"';
                        }
                        
                        if (atnv) {
                            data.attributes[atnv] = (data.attributes[atnv] || 0) + 1;
                        }
                    });
            }
        }
    });
    
    console.log('DOM Statistics:', {
        totalElements: allElements.length,
        uniqueClasses: Object.keys(data.classes).length,
        uniqueTags: Object.keys(data.tags).length,
        uniqueAttributes: Object.keys(data.attributes).length
    });
    
    return data;
}

// Set up the global axe object and selector data
window.axe = window.axe || {};
window.axe._selectorData = buildFullDomStatistics();
window.axe._memoizedFns = window.axe._memoizedFns || [];

// Create the enhanced getSelector function that generates hierarchical selectors
window.getSelector = function(element, options = {}) {
    try {
        // Call the original sophisticated getSelector function
        const result = getSelector(element, options);
        
        // Force hierarchical selectors for better context specificity
        // Even if the selector is unique in current DOM, it might not be in a larger context
        const shouldForceHierarchical = (
            // Generic class selectors
            /^\.[a-zA-Z-_]+$/.test(result) ||
            // Generic attribute selectors without hierarchy
            /^[a-zA-Z]+\[[^\]]+\]$/.test(result) ||
            // Tag selectors
            /^[a-zA-Z]+$/.test(result) ||
            // Simple class + tag selectors
            /^[a-zA-Z]+\.[a-zA-Z-_]+$/.test(result)
        );
        
        if (shouldForceHierarchical) {
            return generateContextualSelector(element, result);
        }
        
        return result;
    } catch (error) {
        console.error('Error in enhanced getSelector:', error);
        // Fallback to hierarchical selector
        return generateHierarchicalSelector(element);
    }
};

// Function to generate contextual selectors that include parent context
function generateContextualSelector(element, baseSelector) {
    // Start with the base selector from the original function
    let contextualSelector = baseSelector;
    let current = element.parentElement;
    let depth = 0;
    const maxDepth = 3; // Limit depth to avoid overly long selectors
    
    while (current && current !== document.documentElement && depth < maxDepth) {
        let parentSelector = '';
        
        // Prefer ID for parent context
        if (current.id) {
            parentSelector = '#' + window.escapeSelector(current.id);
            contextualSelector = parentSelector + ' > ' + contextualSelector;
            break; // ID is unique, stop here
        }
        
        // Use most specific class for parent
        if (current.classList && current.classList.length > 0) {
            const selectorData = window.axe._selectorData;
            let bestClass = null;
            let lowestCount = Infinity;
            
            Array.from(current.classList).forEach(cls => {
                const escapedClass = window.escapeSelector(cls);
                const count = selectorData.classes[escapedClass] || 0;
                if (count > 0 && count < lowestCount) {
                    lowestCount = count;
                    bestClass = escapedClass;
                }
            });
            
            if (bestClass) {
                parentSelector = current.tagName.toLowerCase() + '.' + bestClass;
            } else {
                parentSelector = current.tagName.toLowerCase();
            }
        } else {
            parentSelector = current.tagName.toLowerCase();
        }
        
        // Add nth-child if the parent selector is not specific enough
        const tempSelector = parentSelector + ' > ' + contextualSelector;
        const matches = document.querySelectorAll(tempSelector);
        if (matches.length > 1) {
            const siblings = Array.from(current.parentElement?.children || []);
            const index = siblings.indexOf(current) + 1;
            parentSelector += ':nth-child(' + index + ')';
        }
        
        contextualSelector = parentSelector + ' > ' + contextualSelector;
        current = current.parentElement;
        depth++;
    }
    
    return contextualSelector;
}

// Function to generate hierarchical selectors when the original fails
function generateHierarchicalSelector(element) {
    const path = [];
    let current = element;
    
    while (current && current !== document.documentElement) {
        let selector = current.tagName.toLowerCase();
        
        // Add ID if available and unique
        if (current.id) {
            const idSelector = '#' + window.escapeSelector(current.id);
            if (document.querySelectorAll(idSelector).length === 1) {
                path.unshift(idSelector);
                break; // ID is unique, no need to go further up
            }
        }
        
        // Add most specific class if available
        if (current.classList && current.classList.length > 0) {
            const selectorData = window.axe._selectorData;
            let bestClass = null;
            let lowestCount = Infinity;
            
            Array.from(current.classList).forEach(cls => {
                const escapedClass = window.escapeSelector(cls);
                const count = selectorData.classes[escapedClass] || 0;
                if (count > 0 && count < lowestCount) {
                    lowestCount = count;
                    bestClass = escapedClass;
                }
            });
            
            if (bestClass) {
                selector += '.' + bestClass;
            }
        }
        
        // Add most specific attribute if no class or class is not unique enough
        if (!selector.includes('.') && current.hasAttributes()) {
            const selectorData = window.axe._selectorData;
            let bestAttribute = null;
            let lowestCount = Infinity;
            
            Array.from(current.attributes).forEach(attr => {
                if (attr.name !== 'class' && attr.name !== 'style' && attr.name !== 'id') {
                    const attrSelector = window.escapeSelector(attr.name) + '="' + attr.value.replace(/([\\"])/g, '\\$1') + '"';
                    const count = selectorData.attributes[attrSelector] || 0;
                    if (count > 0 && count < lowestCount) {
                        lowestCount = count;
                        bestAttribute = attrSelector;
                    }
                }
            });
            
            if (bestAttribute) {
                selector += '[' + bestAttribute + ']';
            }
        }
        
        // Add nth-child if selector is still not unique at this level
        const tempSelector = path.length > 0 ? selector + ' > ' + path.join(' > ') : selector;
        const matches = document.querySelectorAll(tempSelector);
        if (matches.length > 1) {
            const parent = current.parentElement;
            if (parent) {
                const siblings = Array.from(parent.children);
                const index = siblings.indexOf(current) + 1;
                selector += ':nth-child(' + index + ')';
            }
        }
        
        path.unshift(selector);
        current = current.parentElement;
    }
    
    return path.join(' > ');
}

console.log('Enhanced getSelector with full DOM analysis loaded successfully'); 