import { useEffect } from 'react';

const SPEED_INSIGHTS_SCRIPT_SRC = 'https://va.vercel-scripts.com/v1/speed-insights.js';

/**
 * Lightweight loader for Vercel Speed Insights.
 *
 * This mirrors the behavior of the official `@vercel/speed-insights` package
 * by injecting the client script during runtime without blocking rendering.
 */
const SpeedInsights = () => {
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const existingScript = document.querySelector(
      `script[src="${SPEED_INSIGHTS_SCRIPT_SRC}"]`
    ) as HTMLScriptElement | null;

    if (existingScript) {
      // Ensure the script keeps loading even if it was previously detached
      existingScript.defer = true;
      return;
    }

    const script = document.createElement('script');
    script.src = SPEED_INSIGHTS_SCRIPT_SRC;
    script.defer = true;
    script.setAttribute('data-source', 'anonychat-speed-insights');
    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  return null;
};

export default SpeedInsights;
