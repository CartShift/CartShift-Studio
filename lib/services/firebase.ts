export function getFirebaseFunctionsBaseUrl(functionUrl: string): string {
  if (!functionUrl) {
    return '';
  }

  try {
    const url = new URL(functionUrl);
    // Extract base URL (protocol + host) without any path
    // For Firebase Functions, the base is always: https://[region]-[project].cloudfunctions.net
    // or for 2nd gen: https://[function-name]-[hash]-[region].a.run.app
    if (url.hostname.includes('.cloudfunctions.net')) {
      // 1st gen functions: https://us-central1-project.cloudfunctions.net/functionName
      url.pathname = '';
      return url.toString().replace(/\/$/, '');
    } else if (url.hostname.includes('.a.run.app')) {
      // 2nd gen functions: https://functionName-hash-region.a.run.app
      // For 2nd gen, each function has its own URL, so we can't extract a base
      // Return the URL without the path
      url.pathname = '';
      return url.toString().replace(/\/$/, '');
    } else {
      // Fallback: remove the last path segment
      const segments = url.pathname.split('/').filter(Boolean);
      if (segments.length > 0) {
        segments.pop();
      }
      url.pathname = `/${segments.join('/')}`;
      return url.toString().replace(/\/$/, '');
    }
  } catch (e) {
    console.error('Invalid function URL:', functionUrl, e);
    return '';
  }
}

export function buildFirebaseFunctionUrl(functionUrl: string, functionName: string): string {
  const baseUrl = getFirebaseFunctionsBaseUrl(functionUrl);
  if (!baseUrl) {
    return '';
  }
  return `${baseUrl}/${functionName}`;
}
