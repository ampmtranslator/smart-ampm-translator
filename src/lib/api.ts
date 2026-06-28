/**
 * Logged Fetch Utility
 * Wraps the native fetch function to log all outgoing requests, responses, and errors.
 */

export async function loggedFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const url = typeof input === 'string' ? input : (input as any).url || String(input);
  const method = init?.method || 'GET';
  
  const startTime = performance.now();
  const requestId = Math.random().toString(36).substring(2, 7).toUpperCase();

  // Log outgoing request details
  console.log(`%c[API REQ ${requestId}] ${method} ${url}`, 'color: #3b82f6; font-weight: bold;', {
    headers: init?.headers,
    body: init?.body ? (typeof init.body === 'string' && init.body.length > 500 
      ? init.body.substring(0, 500) + '... (truncated)' 
      : init.body) : undefined
  });

  try {
    const response = await window.fetch(input, init);
    const duration = (performance.now() - startTime).toFixed(1);
    
    const statusColor = response.status >= 200 && response.status < 300 ? '#10b981' : '#ef4444';
    console.log(`%c[API RES ${requestId}] ${response.status} ${response.statusText} (${duration}ms)`, `color: ${statusColor}; font-weight: bold;`);

    // Clone the response so we can read the body without consuming the original response stream
    const clonedResponse = response.clone();
    const contentType = response.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      clonedResponse.json().then(data => {
        console.log(`%c[API BODY ${requestId}] JSON Response:`, 'color: #8b5cf6;', data);
      }).catch(err => {
        console.error(`%c[API BODY ${requestId}] Failed to parse JSON response:`, 'color: #ef4444;', err);
      });
    } else {
      clonedResponse.text().then(text => {
        if (text.includes('FUNCTION_INVOCATION_FAILED')) {
          console.warn(`%c[API BODY ${requestId}] Vercel Error Detected: FUNCTION_INVOCATION_FAILED!`, 'color: #f59e0b; font-weight: bold;');
        }
        console.log(`%c[API BODY ${requestId}] Text Response (first 1000 chars):`, 'color: #6b7280;', text.substring(0, 1000));
      }).catch(err => {
        console.error(`%c[API BODY ${requestId}] Failed to read text response:`, 'color: #ef4444;', err);
      });
    }

    return response;
  } catch (error: any) {
    const duration = (performance.now() - startTime).toFixed(1);
    console.error(`%c[API ERR ${requestId}] Failed after ${duration}ms:`, 'color: #ef4444; font-weight: bold;', error);
    throw error;
  }
}
