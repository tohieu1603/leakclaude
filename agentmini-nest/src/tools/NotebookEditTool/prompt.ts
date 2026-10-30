export const NOTEBOOK_EDIT_TOOL_NAME = 'NotebookEdit';

export const PROMPT = `Edit a Jupyter notebook (.ipynb) by replacing, inserting, or deleting a cell.

Parameters:
- notebookPath: absolute path to the .ipynb file
- cellIndex: 0-based index of the cell to operate on
- mode: one of 'replace' | 'insert' | 'delete'
- cellType (replace/insert only): 'code' or 'markdown' (default 'code')
- source (replace/insert only): the new cell source as a single string

Saves the notebook in place. Preserves notebook metadata (kernelspec, language_info) and other cells. Cell outputs of replaced cells are cleared.`;
