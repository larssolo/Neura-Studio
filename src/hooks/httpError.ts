/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/** Fælles fejlbesked-formatering for API-kald på tværs af domæne-hooks. */
export function httpErrorMessage(status: number, serverMsg?: string): string {
  if (serverMsg) return serverMsg;
  if (status === 404) {
    return 'Backenden svarer ikke (404). Kør appen med "npm run dev" og åbn http://localhost:3000 — ikke en anden port eller en bygget fil.';
  }
  return `Serveren svarede med status ${status}`;
}
