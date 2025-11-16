export interface File {
  name: string;
  language: string;
  content: string;
}

export interface Project {
  name: string;
  files: File[];
}

export interface EditorPosition {
  lineNumber: number;
  column: number;
}
