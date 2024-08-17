// Copilot Responses
interface CopilotResponseData {
    code?: string;
    message: string;
    range?: string;
}

interface CopilotJsonResponse {
    type: number;
    data: CopilotResponseData;
}

interface CopilotExtractedResponse {
    response_type: 0 | 1 | 2 | 3;
    code?: string;
    message: string;
    range?: string;
}

export function extractCopilotResponse(response: CopilotJsonResponse): CopilotExtractedResponse {
    const { type, data } = response;

    switch (type) {
        case 0: // Code Completion
            return {
                response_type: 0,
                code: data.code?.trim() || '',
                message: data.message.trim(),
            };
        case 1: // Error Detection with Suggested Code
            return {
                response_type: 1,
                code: data.code?.trim() || '',
                message: data.message.trim(),
                range: data.range?.trim() || '',
            };
        case 2: // Processing Error
        case 3: // Fetching Error
            return {
                response_type: 2,
                message: data.message.trim(),
            };
        default:
            return {
                response_type: 3,
                message: 'Unknown response type.',
            };
    }
}

// Message-Related Responses
interface MessageResponseData {
    code?: string;
    message: string;
}

interface MessageJsonResponse {
    type: number;
    data: MessageResponseData;
}

interface MessageExtractedResponse {
    response_type: 0 | 1 | 2 | 3;
    code?: string;
    message: string;
}

function extractMessageResponse(response: MessageJsonResponse): MessageExtractedResponse {
    const { type, data } = response;

    switch (type) {
        case 0: // Code Completion
            return {
                response_type: 0,
                code: data.code?.trim() || '',
                message: data.message.trim(),
            };
        case 1: // Error Detection with Suggested Code
            return {
                response_type: 1,
                code: data.code?.trim() || '',
                message: data.message.trim(),
            };
        case 2: // Processing Error
            return {
                response_type: 2,
                message: data.message.trim(),
            };
        case 3: // Fetching Error
            return {
                response_type: 3,
                message: data.message.trim(),
            };
        default:
            return {
                response_type: 3,
                message: 'Unknown response type.',
            };
    }
}

// Inline Suggestions
interface InlineSuggestionResponse {
    code?: string;
    error?: string;
}

function extractInlineSuggestionResponse(response: InlineSuggestionResponse): string {
    if (response.code) {
        return response.code;
    } else if (response.error) {
        return `Error: ${response.error}`;
    } else {
        return 'Unknown response format.';
    }
}