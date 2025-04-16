# AI Chat App

You are an expert in TypeScript, Next.js App Router, React, and Tailwind. Follow @Next.js docs for Data Fetching, Rendering, and Routing. Use Vercel AI SDK for handling AI interactions and streaming responses.

Your job is to create an AI chat application with the following specific features and key points to implement:

1. Integration with Vercel AI SDK:
   - Implement the Vercel AI SDK to handle all AI-related operations.
   - Use the SDK's built-in functions for creating chat completions and managing conversation state.

2. Support for Anthropic's Claude:
   - Integrate Anthropic's Claude 3.5 Sonnet model.
   - Implement model-specific configurations and API calls.

3. Real-time chat interface:
   - Develop a responsive chat UI with a scrollable message list, displaying user and AI messages.
   - Implement a fixed-position input field at the bottom of the chat interface.
   - Display the entire chat history, including previous conversations if applicable.

4. Streaming responses:
   - Utilize the Vercel AI SDK's streaming capabilities to display AI responses in real-time.
   - Implement a typing indicator while the AI is generating a response.

5. Comprehensive error handling and loading states:
   - Create informative error messages for various scenarios (e.g., API errors, network issues).
   - Implement loading spinners or skeleton loaders for all asynchronous operations.
   - Add retry mechanisms for failed API calls.

6. API route update:
   - Implement the Anthropic API route using Vercel AI SDK.
   - Ensure proper error handling and response formatting.

7. Chat history management:
   - Implement a robust system to maintain and display the chat history correctly.
   - Store chat history in the browser's local storage or a database for persistence across sessions.
   - Provide options to clear chat history or start a new conversation.

8. Vercel AI SDK integration for interactions and streaming:
   - Utilize the SDK's built-in hooks (e.g., useChat, useCompletion) for managing chat state and interactions.
   - Implement server-side streaming using the SDK's StreamingTextResponse for efficient response handling.

9. Enhanced user experience:
    - Add a "Stop generating" button to halt ongoing AI responses.
    - Implement markdown rendering for AI responses to support formatted text, code blocks, and lists.
    - Add a copy-to-clipboard feature for individual messages.

Use the existing Anthropic configuration and Vercel AI SDK functions from the codebase. Implement the AI chat functionality in new page components for the chat interface. Create all necessary components for the user interface and AI interactions, including but not limited to:
- ChatInterface component for the main chat UI
- MessageList component to display chat messages
- InputField component for user input
- ErrorDisplay component for showing error messages
- LoadingIndicator component for asynchronous operations

Remember to use TypeScript for type safety, including proper type definitions for all components, functions, and API responses. Utilize Tailwind CSS for responsive and consistent styling across the application. Leverage Next.js App Router for efficient routing and data fetching, implementing server-side rendering or static generation where appropriate to optimize performance.