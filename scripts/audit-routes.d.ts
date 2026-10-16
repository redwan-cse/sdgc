export function parseRoutesCsv(
  csvPath: string,
): Array<{ legacyUrl: string; targetRoute: string; type: string; status: string; notes: string }>;
export function getPathFromUrl(legacyUrl: string): string;
export function traceRedirects(
  baseUrl: string,
  reqPath: string,
  options?: { maxHops?: number },
): Promise<{
  path: string;
  status: number;
  location: string | null;
  hops: number;
  loopDetected: boolean;
  finalUrl: string;
  error?: string;
}>;
export function auditRoutes(config: { baseUrl?: string; routesCsvPath?: string }): Promise<{
  timestamp: string;
  baseUrl: string;
  totalAudited: number;
  passedCount: number;
  failedCount: number;
  queryPreservationCheck: {
    path: string;
    finalUrl: string;
    passed: boolean;
  };
  notFoundCheck: {
    path: string;
    status: number;
    passed: boolean;
  };
  results: Array<{
    path: string;
    expectedType: string;
    expectedTarget: string;
    status: number;
    hops: number;
    finalUrl: string;
    pass: boolean;
    failureReason: string;
  }>;
}>;
