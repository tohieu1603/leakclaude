// Pure helpers for Edit/MultiEdit. Kept stateless so they're trivially testable
// and reusable across the two tools.

export function countOccurrences(haystack: string, needle: string): number {
  if (needle === '') return 0;
  // Use split-length-1 — robust for needles containing regex specials
  return haystack.split(needle).length - 1;
}

export function applyReplacement(
  source: string,
  oldString: string,
  newString: string,
  replaceAll: boolean,
): string {
  if (replaceAll) return source.split(oldString).join(newString);
  return source.replace(oldString, newString);
}

// Validate that an edit is applicable. Returns null on success, or an error
// string on failure. Used by both Edit and MultiEdit.
export function validateEdit(
  fileContent: string,
  oldString: string,
  newString: string,
  replaceAll: boolean,
): string | null {
  if (oldString === newString) {
    return 'No changes to make: old_string and new_string are exactly the same.';
  }
  if (oldString === '') {
    if (fileContent.trim() !== '') {
      return 'Cannot create new file - file already exists.';
    }
    return null;
  }
  const matches = countOccurrences(fileContent, oldString);
  if (matches === 0) {
    return `String to replace not found in file.\nString: ${oldString}`;
  }
  if (matches > 1 && !replaceAll) {
    return `Found ${matches} matches of the string to replace, but replace_all is false. To replace all occurrences, set replace_all to true. To replace only one occurrence, please provide more context to uniquely identify the instance.\nString: ${oldString}`;
  }
  return null;
}
