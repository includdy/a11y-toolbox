export function tokenizeHTML(html) {
    return html
      .replace(/<[^>]*>/g, ' ')
      .split(/\s+/)
      .filter(Boolean);
  }