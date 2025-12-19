export function mockRequest(body = {}, query = {}) {
    return {
        json: async () => body,
        nextUrl: {
            searchParams: new URLSearchParams(query)
        }
    };
}