# AI Assistant API Documentation

This API provides endpoints for frontend applications to communicate with the OpenAI-powered AI assistant.

## Base URL

All endpoints are prefixed with `/api`.

## Endpoints

### Create a Conversation

Initializes a new conversation with the AI assistant.

-   **URL**: `/conversations`
-   **Method**: `POST`
-   **Request Body**: None required
-   **Response**:
    ```json
    {
        "conversationId": "thread_abc123",
        "message": "Conversation started successfully"
    }
    ```
-   **Status Codes**:
    -   `201`: Conversation created successfully
    -   `500`: Server error

### Send a Message

Sends a user message to an existing conversation and returns the AI's response.

-   **URL**: `/conversations/:conversationId/messages`
-   **Method**: `POST`
-   **URL Parameters**:
    -   `conversationId`: The ID of the conversation
-   **Request Body**:
    ```json
    {
        "message": "Your message here"
    }
    ```
-   **Response**:
    ```json
    {
        "response": "AI assistant's response text"
    }
    ```
-   **Status Codes**:
    -   `200`: Message processed successfully
    -   `400`: Message is required
    -   `404`: Conversation not found
    -   `500`: Server error

### Get Conversation Messages

Retrieves all messages in a conversation.

-   **URL**: `/conversations/:conversationId/messages`
-   **Method**: `GET`
-   **URL Parameters**:
    -   `conversationId`: The ID of the conversation
-   **Response**:
    ```json
    {
        "messages": [
            {
                "id": "msg_abc123",
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": {
                            "value": "User message"
                        }
                    }
                ],
                "created_at": 1616791136
            },
            {
                "id": "msg_def456",
                "role": "assistant",
                "content": [
                    {
                        "type": "text",
                        "text": {
                            "value": "Assistant response"
                        }
                    }
                ],
                "created_at": 1616791142
            }
        ]
    }
    ```
-   **Status Codes**:
    -   `200`: Messages retrieved successfully
    -   `404`: Conversation not found
    -   `500`: Server error

### Health Check

Checks if the API server is running properly.

-   **URL**: `/health`
-   **Method**: `GET`
-   **Response**:
    ```json
    {
        "status": "ok"
    }
    ```
-   **Status Codes**:
    -   `200`: Server is healthy

## Error Responses

All error responses follow this format:

```json
{
    "error": "Error message",
    "details": "More detailed error information"
}
```

## Example Usage (JavaScript)

```javascript
// Start a new conversation
const startConversation = async () => {
    const response = await fetch('http://localhost:3000/api/conversations', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    const data = await response.json();
    return data.conversationId;
};

// Send a message to the conversation
const sendMessage = async (conversationId, message) => {
    const response = await fetch(`http://localhost:3000/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({message}),
    });

    const data = await response.json();
    return data.response;
};

// Get all messages in a conversation
const getMessages = async (conversationId) => {
    const response = await fetch(`http://localhost:3000/api/conversations/${conversationId}/messages`);
    const data = await response.json();
    return data.messages;
};
```
