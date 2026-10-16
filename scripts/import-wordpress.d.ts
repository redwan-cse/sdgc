export function sanitizeHtml(html: string): string;
export function isLocalTarget(urlString: string): boolean;
export function computeFileHash(filePath: string): string;
export function computeDirectoryHashes(dir: string): Record<string, string>;
export function parseArgs(argv?: string[]): {
  dryRun: boolean;
  inputDir: string;
  supabaseUrl: string;
};
export function runImport(options: {
  dryRun?: boolean;
  inputDir?: string;
  supabaseUrl?: string;
  supabaseServiceKey?: string;
}): Promise<{
  timestamp: string;
  dryRun: boolean;
  targetUrl: string;
  inputDirectory: string;
  fileHashes: Record<string, string>;
  counts: {
    pages: { total: number; created: number; updated: number; skipped: number; rejected: number };
    venues: { total: number; created: number; updated: number; skipped: number; rejected: number };
    events: { total: number; created: number; updated: number; skipped: number; rejected: number };
    media: { total: number; created: number; updated: number; skipped: number; rejected: number };
    users: { total: number; created: number; updated: number; skipped: number; rejected: number };
    legacyMappings: { total: number; created: number; updated: number; skipped: number };
  };
  warnings: string[];
  errors: string[];
}>;
