// Read tool — prompt and constants.

export const READ_TOOL_NAME = 'Read';
export const MAX_LINES_TO_READ = 2000;
export const MAX_LINE_LEN = 2000;
export const MAX_FILE_BYTES = 256 * 1024 * 1024; // 256 MiB

export const PROMPT = `Reads a file from the local filesystem. You can access any file directly by using this tool.
Assume this tool is able to read all files on the machine. If the User provides a path to a file assume that path is valid. It is okay to read a file that does not exist; an error will be returned.

Usage:
- The file_path parameter must be an absolute path, not a relative path
- By default, it reads up to ${MAX_LINES_TO_READ} lines starting from the beginning of the file
- You can optionally specify a line offset and limit (especially handy for long files), but it's recommended to read the whole file by not providing these parameters
- Results are returned using cat -n format, with line numbers starting at 1
- This tool can only read files, not directories. To list a directory, use the LS tool.
- If you read a file that exists but has empty contents you will receive a system reminder warning in place of file contents.`;
