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


const getAccessibleText = (element, inLabelledByContext = false) => {
    // Smart parameter validation
    if (!element || element.nodeType !== 1) {
        return '';
    }

    try {
        // Step 2B - arialabelledbyText
        let accessibleText = arialabelledbyText(element, inLabelledByContext);

        if (accessibleText) {
            return accessibleText;
        }

        // Step 2C - arialabelText
        accessibleText = arialabelText(element);

        if (accessibleText) {
            return accessibleText;
        }

        // Step 2D - nativeTextAlternative
        const textContent = element.textContent || '';
        return normalizeText(textContent);
        
    } catch (error) {
        console.warn('Error in getAccessibleText:', error);
        return normalizeText(element.textContent || '');
    }
};

export default getAccessibleText;