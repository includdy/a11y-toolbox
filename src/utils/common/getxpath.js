import escapeSelector from './escape-selector.js';

function getXPathArray(node, path) {
  let sibling, count;
  // Gets an XPath for an element which describes its hierarchical location.
  if (!node) {
    return [];
  }
  if (!path && node.nodeType === 9) {
    // special case for when we are called and give the document itself as the starting node
    path = [
      {
        str: 'html'
      }
    ];
    return path;
  }
  path = path || [];
  if (node.parentNode && node.parentNode !== node) {
    path = getXPathArray(node.parentNode, path);
  }

  if (node.previousSibling) {
    count = 1;
    sibling = node.previousSibling;
    do {
      if (sibling.nodeType === 1 && sibling.nodeName === node.nodeName) {
        count++;
      }
      sibling = sibling.previousSibling;
    } while (sibling);
    if (count === 1) {
      count = null;
    }
  } else if (node.nextSibling) {
    sibling = node.nextSibling;
    do {
      if (sibling.nodeType === 1 && sibling.nodeName === node.nodeName) {
        count = 1;
        sibling = null;
      } else {
        count = null;
        sibling = sibling.previousSibling;
      }
    } while (sibling);
  }

  if (node.nodeType === 1) {
    const element = {};
    element.str = node.nodeName.toLowerCase();
    
      // add the id and the count so we can construct robust versions of the xpath
      const id = node.getAttribute && escapeSelector(node.getAttribute('id'));
      if (id && node.ownerDocument.querySelectorAll('#' + id).length === 1) {
          element.id = node.getAttribute('id');
      }
      
      // add class information
      const className = node.getAttribute && node.getAttribute('class');
      if (className && className.trim()) {
          // Store the first class for XPath (most specific usually)
          const classes = className.trim().split(/\s+/);
          if (classes.length > 0) {
              element.className = classes[0];
          }
      }
    
    if (count > 1) {
        element.count = count;
    }
    path.push(element);
  }
  return path;
}

// Robust is intended to allow xpaths to be robust to changes in the HTML structure of the page
// This means always use the id when present, then class, then count
function xpathToString(xpathArray) {
  return xpathArray.reduce((str, elm) => {
    if (elm.id) {
      return str + `/${elm.str}[@id='${elm.id}']`;
    } else if (elm.className) {
      return str + `/${elm.str}[@class='${elm.className}']`;
    } else {
      return str + `/${elm.str}` + (elm.count > 0 ? `[${elm.count}]` : '');
    }
  }, '');
}

function getXpath(node) {
  const xpathArray = getXPathArray(node);
  return xpathToString(xpathArray);
}

export default getXpath;