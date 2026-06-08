/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';

/** Tema-tilstand (mørkt/lyst) med persistens i localStorage. */
export function useTheme() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('brand_surface_theme');
    return (saved === 'light' || saved === 'dark') ? saved : 'dark';
  });

  useEffect(() => {
    localStorage.setItem('brand_surface_theme', theme);
  }, [theme]);

  return { theme, setTheme };
}
