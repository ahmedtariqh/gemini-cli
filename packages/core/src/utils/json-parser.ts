/**
 * Parses JSON with recovery for common LLM errors.
 */


export function robustJsonParse(text: string): any {
  try {
    return JSON.parse(text);
  } catch (e) {
    // 1. Extract JSON object from markdown code blocks
    const match = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (match) {
      try {
        return JSON.parse(match[1]);
      } catch (e2) {
        // continue
      }
    }

    // 2. Find first '{' and try to parse/repair
    const openIndex = text.indexOf('{');
    if (openIndex !== -1) {
        let snippet = text.slice(openIndex);
        // Try deleting from end until valid
        // or just try common fixes
        try {
            return JSON.parse(snippet);
        } catch (e3) {
             // 3. Try appending '}' if missing
             try {
                 return JSON.parse(snippet + '}');
             } catch(e4) {}
             try {
                 return JSON.parse(snippet + '}}');
             } catch(e5) {}
        }
    }
    throw e;
  }
}
