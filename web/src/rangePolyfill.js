/**
 * Range Fetch Polyfill for CheerpJ
 * Ensures that HTTP Range requests returning HTTP 200 OK (from CDNs/proxies that ignore Range)
 * are transparently converted into HTTP 206 Partial Content responses with correct byte slicing.
 */
export function installRangeFetchPolyfill() {
    if (window.__rangeFetchPolyfillInstalled) return;
    window.__rangeFetchPolyfillInstalled = true;

    const originalFetch = window.fetch;
    window.fetch = async function (input, init) {
        let rangeHeader = null;
        if (init && init.headers) {
            if (init.headers instanceof Headers) {
                rangeHeader = init.headers.get('Range') || init.headers.get('range');
            } else if (typeof init.headers === 'object') {
                rangeHeader = init.headers['Range'] || init.headers['range'] || init.headers['RANGE'];
            }
        }

        const response = await originalFetch.apply(this, arguments);

        if (rangeHeader && response.status === 200) {
            try {
                const match = rangeHeader.match(/bytes=(\d+)-(\d+)?/);
                if (match) {
                    const fullBuffer = await response.clone().arrayBuffer();
                    const totalLength = fullBuffer.byteLength;
                    const start = parseInt(match[1], 10);
                    const end = match[2] !== undefined && match[2] !== '' ? parseInt(match[2], 10) : totalLength - 1;
                    const safeEnd = Math.min(end, totalLength - 1);

                    if (start <= safeEnd && start < totalLength) {
                        const slicedBuffer = fullBuffer.slice(start, safeEnd + 1);
                        const responseHeaders = new Headers(response.headers);
                        responseHeaders.set('Content-Range', `bytes ${start}-${safeEnd}/${totalLength}`);
                        responseHeaders.set('Content-Length', String(slicedBuffer.byteLength));
                        responseHeaders.set('Accept-Ranges', 'bytes');

                        return new Response(slicedBuffer, {
                            status: 206,
                            statusText: 'Partial Content',
                            headers: responseHeaders
                        });
                    }
                }
            } catch (e) {
                console.warn('Range fetch polyfill fallback error:', e);
            }
        }
        return response;
    };
}
