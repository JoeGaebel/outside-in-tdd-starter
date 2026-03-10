export async function fetchApi<T = unknown>(url: string, options?: RequestInit): Promise<T> {
    const response = await fetch(url, {cache: 'no-store', ...options});

    if (!response.ok) {
        let errorMessage: string;
        try {
            const body = await response.json();
            errorMessage = body.error || `Request failed with status ${response.status}`;
        } catch {
            errorMessage = `Request failed with status ${response.status}`;
        }
        throw new Error(errorMessage);
    }

    return response.json() as Promise<T>;
}
