// Mock API endpoints for development
// In production, replace these with your actual backend integrations

const mockLiteLLMChat = async (body: any) => {
  const { 
    provider = "litellm",
    model = "gpt-3.5-turbo", 
    messages = [],
    temperature = 0.7,
    top_p = 0.9,
    max_tokens = 2048,
    stop = [],
    tools = [],
    metadata = {}
  } = body;

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));

  const mockResponse = "I'm a mock LiteLLM response. This would normally connect to your LiteLLM endpoint and stream the actual AI response. You can replace this with your real LiteLLM integration.";
  
  return mockResponse;
};

const mockOpenWebUIChat = async (body: any) => {
  const { 
    provider = "openwebui",
    model = "gpt-3.5-turbo", 
    messages = [],
    temperature = 0.7,
    top_p = 0.9,
    max_tokens = 2048,
    stop = [],
    tools = [],
    metadata = {}
  } = body;

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 700));

  const mockResponse = "I'm a mock OpenWebUI response. This would normally connect to your OpenWebUI endpoint and stream the actual AI response. You can replace this with your real OpenWebUI integration.";
  
  return mockResponse;
};

export { mockLiteLLMChat, mockOpenWebUIChat };