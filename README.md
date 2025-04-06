# AI Assistant

An OpenAI-powered assistant with both CLI and API interfaces.

## Features

-   Command-line interface for chatting with the AI assistant
-   REST API for frontend integration
-   Uses OpenAI's Assistant API for powerful AI capabilities

## Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/ai-assistant.git
cd ai-assistant
```

2. Install dependencies:

```bash
npm install
```

3. Set up your environment variables by creating a `.env` file:

```
OPENAI_API_KEY=your_openai_api_key
PORT=3000
```

## Usage

### Command-line Interface

To start a chat session with the AI assistant via the command line:

```bash
npm start
```

Type your messages and press Enter to communicate with the assistant. Type "exit" to end the conversation.

### API Interface

The application also provides a REST API for integrating with frontend applications.

To use the API, make HTTP requests to the following endpoints:

-   `POST /api/conversations` - Create a new conversation
-   `POST /api/conversations/:conversationId/messages` - Send a message
-   `GET /api/conversations/:conversationId/messages` - Get conversation history
-   `GET /api/health` - Check API health

For detailed API documentation, see [API Documentation](src/api/README.md).

### Frontend Examples

Check out the example frontend implementations:

-   [Simple HTML/JS Example](src/api/examples/frontend-example.html)
-   [Angular Example](src/api/examples/angular-example.ts)

## Building

To build the application:

```bash
npm run build
```

## Development

The application uses TypeScript and is structured as follows:

-   `src/index.ts` - Main entry point
-   `src/openai/` - OpenAI API integration
-   `src/api/` - REST API functionality
-   `src/api/examples/` - Frontend integration examples
