import {UnifiedResponse} from  "./fetch";

export async function ToStandardResponse(response: UnifiedResponse): Promise<Response> {
    if (response instanceof Response) {
        return response;
    } else {
        // Convert UndiciResponse to standard Response
        const body = await response.text();
        const headers = new Headers();
        response.headers.forEach((value, key) => headers.append(key, value));
        return new Response(body, {
            status: response.status,
            statusText: response.statusText,
            headers,
        });
    }
}