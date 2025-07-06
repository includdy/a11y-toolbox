// Browser-compatible accessible text computation
// This implementation handles the most common cases without external dependencies

/**
 * Normalizes whitespace in text according to accessibility standards:
 * - Multiple spaces → single space
 * - Tabs, line breaks, carriage returns → spaces
 * - Leading/trailing whitespace → removed
 * - Extra indentation → simplified
 */
const normalizeText = (text) => {
    if (!text || typeof text !== 'string') {
        return '';
    }
    return text.replace(/\s+/g, ' ').trim();
}

/**
 * Checks if an element should be ignored for accessible name computation
 * Based on ARIA specification and axe-core standards
 */
const shouldIgnoreElement = (element) => {
    // Check if element is hidden from accessibility tree
    if (element.getAttribute('aria-hidden') === 'true') {
        return true;
    }
    
    // Check if element has presentation or none role
    const role = element.getAttribute('role');
    if (role === 'presentation' || role === 'none') {
        return true;
    }
    
    // Check if element is visually hidden
    try {
        const computedStyle = window.getComputedStyle(element);
        
        // Elements with display: none should be ignored
        if (computedStyle.display === 'none') {
            return true;
        }
        
        // Elements with visibility: hidden should be ignored
        if (computedStyle.visibility === 'hidden') {
            return true;
        }
        
        // display: contents elements should have their children processed
        if (computedStyle.display === 'contents') {
            return false;
        }
    } catch (error) {
        // If we can't get computed styles, don't ignore the element
        console.warn('Failed to get computed styles for element:', element, error);
    }
    
    return false;
}

const arialabelledbyText = (element, inLabelledByContext) => {
    // Early exit guards
    if (inLabelledByContext || !element?.getAttribute?.('aria-labelledby')) {
        return '';
    }

    const arialabelledby = element.getAttribute('aria-labelledby');
    
    // Smart IDREF parsing
    const idrefs = arialabelledby
        .trim()
        .split(/\s+/)
        .filter(id => id && id.length > 0)
        .filter((id, index, arr) => arr.indexOf(id) === index); // Remove duplicates

    if (idrefs.length === 0) {
        return '';
    }

    // Smart element resolution - handle multiple elements with same ID
    const referencedElements = [];
    
    for (const id of idrefs) {
        try {
            // Use querySelectorAll to find ALL elements with this ID
            // This handles the case where multiple elements have the same ID
            const elements = document.querySelectorAll(`[id="${CSS.escape(id)}"]`);
            
            // Add all matching elements to our collection
            elements.forEach(el => {
                if (el && el.nodeType === 1) {
                    referencedElements.push(el);
                }
            });
        } catch (error) {
            console.warn(`Failed to find elements with ID: ${id}`, error);
            
            // Fallback to getElementById if querySelectorAll fails
            try {
                const fallbackElement = document.getElementById(id);
                if (fallbackElement && fallbackElement.nodeType === 1) {
                    referencedElements.push(fallbackElement);
                }
            } catch (fallbackError) {
                console.warn(`Fallback getElementById also failed for ID: ${id}`, fallbackError);
            }
        }
    }

    if (referencedElements.length === 0) {
        return '';
    }

    // Smart text accumulation - process ALL matched elements
    const accessibleNames = referencedElements
        .map(refElement => {
            try {
                const text = getAccessibleText(refElement, true);
                return text?.trim() || '';
            } catch (error) {
                console.warn('Failed to get accessible text for element:', refElement, error);
                return refElement.textContent?.trim() || '';
            }
        })
        .filter(text => text.length > 0);

    // Smart concatenation
    return accessibleNames.length > 0 
        ? accessibleNames.join(' ').replace(/\s+/g, ' ').trim()
        : '';
}

const arialabelText = (element) => {
    const ariaLabel = element.getAttribute('aria-label') || '';
    return normalizeText(ariaLabel);
}

// Helper function to get pseudo-element content
const getPseudoElementContent = (element) => {
    let beforeContent = '';
    let afterContent = '';
    
    try {
        // Get ::before content
        const beforeStyles = window.getComputedStyle(element, '::before');
        const beforeContentValue = beforeStyles.getPropertyValue('content');
        if (beforeContentValue && beforeContentValue !== 'none' && beforeContentValue !== '""') {
            // Check if ::before pseudo-element is visible to assistive technologies
            const beforeDisplay = beforeStyles.getPropertyValue('display');
            const beforeVisibility = beforeStyles.getPropertyValue('visibility');
            
            // Only include content if pseudo-element is visible
            if (beforeDisplay !== 'none' && beforeVisibility !== 'hidden') {
                // Remove quotes from content value
                beforeContent = beforeContentValue.replace(/^["']|["']$/g, '');
            }
        }
        
        // Get ::after content
        const afterStyles = window.getComputedStyle(element, '::after');
        const afterContentValue = afterStyles.getPropertyValue('content');
        if (afterContentValue && afterContentValue !== 'none' && afterContentValue !== '""') {
            // Check if ::after pseudo-element is visible to assistive technologies
            const afterDisplay = afterStyles.getPropertyValue('display');
            const afterVisibility = afterStyles.getPropertyValue('visibility');
            
            // Only include content if pseudo-element is visible
            if (afterDisplay !== 'none' && afterVisibility !== 'hidden') {
                // Remove quotes from content value
                afterContent = afterContentValue.replace(/^["']|["']$/g, '');
            }
        }
    } catch (error) {
        // Ignore errors - pseudo-elements might not be supported or accessible
    }
    
    return { beforeContent, afterContent };
};

/**
 * Gets role-specific accessible name computation
 * Based on ARIA specification and axe-core standards
 */
const getRoleSpecificName = (element) => {
    const role = element.getAttribute('role');
    if (!role) return '';
    
    switch (role.toLowerCase()) {
        case 'button':
            return computeChildAccessibleName(element);
        
        case 'link':
            const linkName = computeChildAccessibleName(element);
            return linkName || element.getAttribute('title') || '';
        
        case 'textbox':
        case 'searchbox':
            // Check for aria-placeholder first, then placeholder
            return element.getAttribute('aria-placeholder') || 
                   element.getAttribute('placeholder') || '';
        
        case 'slider':
        case 'spinbutton':
        case 'progressbar':
            // Use aria-valuetext if available, otherwise aria-valuenow
            const valueText = element.getAttribute('aria-valuetext');
            if (valueText) return valueText;
            
            const valueNow = element.getAttribute('aria-valuenow');
            if (valueNow) return valueNow;
            
            return '';
        
        case 'img':
            return element.getAttribute('alt') || '';
        
        case 'heading':
            return computeChildAccessibleName(element);
        
        case 'group':
        case 'region':
            // Groups and regions can have accessible names from their content
            return computeChildAccessibleName(element);
        
        default:
            return '';
    }
}

const nativeTextAlternative = (element) => {
    // Browser-compatible implementation of accessible name computation
    // This handles common cases without external dependencies
    
    if (!element || element.nodeType !== 1) {
        return '';
    }

    // Check if element should be ignored
    if (shouldIgnoreElement(element)) {
        return '';
    }

    // Check for role-specific name computation first
    const roleSpecificName = getRoleSpecificName(element);
    if (roleSpecificName) {
        return roleSpecificName;
    }

    const tagName = element.tagName.toLowerCase();
    
    // Handle different element types according to HTML-AAM specification
    switch (tagName) {
        case 'img':
            // Images: alt attribute, then title, then filename fallback
            const altText = element.getAttribute('alt');
            if (altText !== null) {
                return altText; // Include empty alt for decorative images
            }
            
            const titleText = element.getAttribute('title');
            if (titleText) {
                return titleText;
            }
            
            return '';
            
        case 'input':
            const inputType = element.getAttribute('type')?.toLowerCase() || 'text';
            switch (inputType) {
                case 'submit':
                case 'reset':
                case 'button':
                    // Button inputs: value attribute, then default text
                    return element.getAttribute('value') || 
                           (inputType === 'submit' ? 'Submit' : 
                            inputType === 'reset' ? 'Reset' : '');
                case 'image':
                    // Image inputs: alt attribute, then value, then default
                    return element.getAttribute('alt') || 
                           element.getAttribute('value') || 
                           'Submit';
                case 'file':
                    // File inputs: custom handling
                    return element.getAttribute('value') || 'Choose file';
                case 'range':
                    // Range inputs: aria-valuetext, then aria-valuenow, then value
                    return element.getAttribute('aria-valuetext') ||
                           element.getAttribute('aria-valuenow') ||
                           element.getAttribute('value') || '';
                default:
                    // Other inputs: associated label, aria-placeholder, placeholder, or title
                    const associatedLabel = getAssociatedLabel(element);
                    if (associatedLabel) {
                        return associatedLabel;
                    }
                    
                    // Check aria-placeholder before placeholder
                    const ariaPlaceholder = element.getAttribute('aria-placeholder');
                    if (ariaPlaceholder) {
                        return ariaPlaceholder;
                    }
                    
                    return element.getAttribute('placeholder') || 
                           element.getAttribute('title') || '';
            }
            
        case 'button':
            // Buttons: compute accessible name from child content
            const buttonAccessibleName = computeChildAccessibleName(element);
            return buttonAccessibleName || element.getAttribute('title') || '';
            
        case 'select':
            // Select: first selected option's text, then first option
            const selectedOption = element.querySelector('option[selected]') || 
                                 element.querySelector('option');
            if (selectedOption) {
                return selectedOption.getAttribute('label') || selectedOption.textContent || '';
            }
            
            // If no options, check for associated label
            const selectLabel = getAssociatedLabel(element);
            return selectLabel || '';
            
        case 'textarea':
            // Textarea: associated label, aria-placeholder, placeholder, or title
            const textareaLabel = getAssociatedLabel(element);
            if (textareaLabel) {
                return textareaLabel;
            }
            
            const textareaAriaPlaceholder = element.getAttribute('aria-placeholder');
            if (textareaAriaPlaceholder) {
                return textareaAriaPlaceholder;
            }
            
            return element.getAttribute('placeholder') || 
                   element.getAttribute('title') || '';
            
        case 'a':
            // Links: compute accessible name from child content, then title attribute
            const linkAccessibleName = computeChildAccessibleName(element);
            if (linkAccessibleName.trim()) {
                return linkAccessibleName;
            }
            return element.getAttribute('title') || '';
            
        case 'fieldset':
            // Fieldset: legend text
            const legend = element.querySelector('legend');
            return legend ? (legend.textContent || '').trim() : '';
            
        case 'figure':
            // Figure: figcaption text
            const figcaption = element.querySelector('figcaption');
            return figcaption ? (figcaption.textContent || '').trim() : '';
            
        case 'table':
            // Table: caption text, then summary attribute
            const caption = element.querySelector('caption');
            if (caption) {
                return (caption.textContent || '').trim();
            }
            return element.getAttribute('summary') || '';
            
        case 'iframe':
            // iframes: title attribute
            return element.getAttribute('title') || '';
                   
        case 'object':
        case 'embed':
            // Objects/embeds: title attribute
            const objectTitle = element.getAttribute('title');
            if (objectTitle) return objectTitle;
            
            return '';
            
        case 'audio':
        case 'video':
            // Media elements: title
            const mediaTitle = element.getAttribute('title');
            if (mediaTitle) return mediaTitle;
            
            return '';
            
        case 'canvas':
            // Canvas: title, then fallback content
            const canvasTitle = element.getAttribute('title');
            if (canvasTitle) return canvasTitle;
            
            return element.textContent?.trim() || '';
            
        case 'svg':
            // SVG: title element, then title attribute
            const svgTitle = element.querySelector('title');
            if (svgTitle) return (svgTitle.textContent || '').trim();
            
            return element.getAttribute('title') || '';
            
        case 'math':
            // MathML: annotation[encoding="text/plain"], then deprecated alttext attribute, then title
            const ann = element.querySelector('semantics > annotation[encoding="text/plain"]');
            if (ann && ann.textContent.trim()) {
                return ann.textContent.trim();
            }
            
            return element.getAttribute('alttext') || 
                   element.getAttribute('title') || '';
            
        default:
            // Special handling for contenteditable elements
            if (element.hasAttribute('contenteditable') && element.getAttribute('contenteditable') !== 'false') {
                // For contenteditable elements, return their title directly
                return element.title || '';
            }
            
            // Generic elements: compute accessible name from children (respecting aria-hidden)
            const childAccessibleName = computeChildAccessibleName(element);
            if (childAccessibleName.trim()) {
                // Include pseudo-element content with child accessible name
                const pseudoContent = getPseudoElementContent(element);
                let combinedContent = '';
                if (pseudoContent.beforeContent) {
                    combinedContent += pseudoContent.beforeContent;
                }
                combinedContent += childAccessibleName;
                if (pseudoContent.afterContent) {
                    combinedContent += pseudoContent.afterContent;
                }
                return combinedContent;
            }
            
            // If no child accessible name, check for pseudo-element content only
            const pseudoContent = getPseudoElementContent(element);
            let combinedContent = '';
            if (pseudoContent.beforeContent) {
                combinedContent += pseudoContent.beforeContent;
            }
            if (pseudoContent.afterContent) {
                combinedContent += pseudoContent.afterContent;
            }
            
            if (combinedContent.trim()) {
                return combinedContent;
            }
            return element.getAttribute('title') || '';
    }
}

// Helper function to compute accessible name from child elements
const computeChildAccessibleName = (element, depth = 0) => {
    let accessibleName = '';
    
    // Limit recursion depth to prevent infinite loops and performance issues
    if (depth > 2) {
        return '';
    }
    
    // Walk through all child nodes
    for (const child of element.childNodes) {
        if (child.nodeType === 1) { // Element node
            // Skip elements that should be ignored (handles visibility)
            if (shouldIgnoreElement(child)) {
                continue;
            }
            
            const tagName = child.tagName.toLowerCase();
            
            // For specific elements that contribute to accessible name, use getAccessibleText
            switch (tagName) {
                case 'img':
                    // Images contribute their accessible text (alt, title, etc.)
                    const imgName = getAccessibleText(child, true);
                    if (imgName) {
                        accessibleName += imgName + ' ';
                    }
                    break;
                    
                case 'input':
                    // Form inputs contribute their accessible name
                    const inputType = child.getAttribute('type')?.toLowerCase() || 'text';
                    switch (inputType) {
                        case 'submit':
                        case 'reset':
                        case 'button':
                        case 'image':
                            const inputName = getAccessibleText(child, true);
                            if (inputName) {
                                accessibleName += inputName + ' ';
                            }
                            break;
                        default:
                            // Other inputs don't typically contribute to parent accessible name
                            break;
                    }
                    break;
                    
                case 'svg':
                    // SVG elements contribute their accessible name
                    const svgName = getAccessibleText(child, true);
                    if (svgName) {
                        accessibleName += svgName + ' ';
                    }
                    break;
                    
                default:
                    // For other elements, check if they have aria-label or aria-labelledby
                    if (child.getAttribute('aria-label')) {
                        accessibleName += child.getAttribute('aria-label') + ' ';
                    } else if (child.getAttribute('aria-labelledby')) {
                        // Use getAccessibleText to properly handle aria-labelledby
                        const childName = getAccessibleText(child, true);
                        if (childName) {
                            accessibleName += childName + ' ';
                        }
                    } else {
                        // For generic elements (span, div, etc.), recursively compute their accessible name
                        // but only if they're not hidden and within depth limits
                        if (depth < 2) {
                            // Only recurse two levels deep
                            accessibleName += computeChildAccessibleName(child, depth + 1);
                        } else {
                            // At max depth, only include direct text content, not nested elements
                            for (const grandchild of child.childNodes) {
                                if (grandchild.nodeType === 3) { // Text node
                                    accessibleName += grandchild.textContent;
                                }
                                // Don't include nested element content at max depth
                            }
                        }
                    }
                    break;
            }
        } else if (child.nodeType === 3) { // Text node
            accessibleName += child.textContent;
        }
    }
    
    return accessibleName.replace(/\s+/g, ' ').trim();
}

// Helper function to get associated label for form controls
const getAssociatedLabel = (element) => {
    // Check for explicit label association via 'for' attribute
    const id = element.getAttribute('id');
    if (id) {
        const label = document.querySelector(`label[for="${CSS.escape(id)}"]`);
        if (label) {
            return (label.textContent || '').trim();
        }
    }
    
    // Check for implicit label association (element inside label)
    const parentLabel = element.closest('label');
    if (parentLabel) {
        // For implicit labels, we need to exclude the input's own content
        const labelClone = parentLabel.cloneNode(true);
        const inputsInLabel = labelClone.querySelectorAll('input, select, textarea');
        inputsInLabel.forEach(input => input.remove());
        return (labelClone.textContent || '').trim();
    }
    
    return '';
}

const getAccessibleText = (element, inLabelledByContext = false) => {
    // Smart parameter validation
    if (!element || element.nodeType !== 1) {
        return '';
    }

    try {
        // Step 1: Check if element should be ignored
        if (shouldIgnoreElement(element)) {
            return '';
        }

        // Step 2B - arialabelledbyText (only if not in labelledby context)
        if (!inLabelledByContext && element.getAttribute('aria-labelledby')) {
            // If aria-labelledby is present, use its result even if empty
            // Don't fall back to other methods if aria-labelledby is explicitly set
            const accessibleText = normalizeText(arialabelledbyText(element, inLabelledByContext));
            return accessibleText; // Return even if empty - don't fall back
        }

        // Step 2C - arialabelText
        let accessibleText = normalizeText(arialabelText(element));

        if (accessibleText) {
            return accessibleText;
        }

        // Step 2D - nativeTextAlternative
        accessibleText = normalizeText(nativeTextAlternative(element));

        return accessibleText;
        
    } catch (error) {
        console.warn('Error in getAccessibleText:', error);
        // Fallback to basic text content if everything fails
        return normalizeText(element.textContent || element.getAttribute('title') || '');
    }
};

export default getAccessibleText;
export { getPseudoElementContent };