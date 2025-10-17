import { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Settings, Key } from 'lucide-react';
import { CanvasAIAgent } from '../services/aiAgent';
import { Shape } from '../types';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface AIChatProps {
  isOpen: boolean;
  onClose: () => void;
  shapes: Shape[];
  addShape: (shape: Shape) => void;
  updateShape: (shape: Shape) => void;
  batchUpdateShapes?: (shapes: Shape[]) => void;
  deleteShape: (shapeId: string) => void;
  userId: string;
  canvasWidth: number;
  canvasHeight: number;
}

export const AIChat: React.FC<AIChatProps> = ({
  isOpen,
  onClose,
  shapes,
  addShape,
  updateShape,
  batchUpdateShapes,
  deleteShape,
  userId,
  canvasWidth,
  canvasHeight,
}) => {
  const [messages, setMessages] = useState<Message[]>([{
    id: Date.now().toString(),
    role: 'assistant',
    content: "Hi! I'm your AI canvas assistant. I can help you create and manipulate shapes with natural language commands. Try saying things like:\n\n• \"Create a red circle at position 200, 300\"\n• \"Add a text that says 'Hello World'\"\n• \"Make a 3x3 grid of squares\"\n• \"Move the blue rectangle to the center\"",
    timestamp: Date.now(),
  }]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [tempApiKey, setTempApiKey] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load API key from localStorage on mount
  useEffect(() => {
    const savedKey = localStorage.getItem('openai_api_key');
    if (savedKey) {
      setApiKey(savedKey);
    } else {
      // Show settings if no key is saved
      setShowSettings(true);
    }
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Auto-resize textarea as user types
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 120) + 'px';
    }
  }, [inputValue]);

  const handleSaveApiKey = () => {
    if (tempApiKey.trim()) {
      setApiKey(tempApiKey.trim());
      localStorage.setItem('openai_api_key', tempApiKey.trim());
      setShowSettings(false);
      setTempApiKey('');
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    if (!apiKey) {
      alert('Please set your OpenAI API key in settings first.');
      setShowSettings(true);
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    const userInput = inputValue;
    setInputValue('');
    setIsLoading(true);

    try {
      console.log('Creating AI agent...');
      console.log('API Key present:', !!apiKey);
      console.log('API Key prefix:', apiKey?.substring(0, 8));
      
      const agent = new CanvasAIAgent(apiKey, {
        shapes,
        addShape,
        updateShape,
        batchUpdateShapes,
        deleteShape,
        userId,
        canvasWidth,
        canvasHeight,
      });

      console.log('Agent created, executing command:', userInput);
      
      // Build conversation history (exclude welcome message, only include actual conversation)
      const conversationHistory = messages
        .slice(1) // Skip welcome message
        .map(msg => ({
          role: msg.role,
          content: msg.content,
        }));
      
      console.log('Passing conversation history:', conversationHistory.length, 'messages');
      const response = await agent.execute(userInput, conversationHistory);
      console.log('Response received:', response);
      console.log('Response length:', response?.length);
      console.log('Response type:', typeof response);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response || 'Command executed successfully (no response from AI).',
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      console.error('Error details:', error instanceof Error ? error.stack : error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Failed to process command'}. Please check the browser console for details.`,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const exampleCommands = [
    "Create a red circle at 300, 200",
    "Make a 3x3 grid of blue squares",
    "Add text that says 'Welcome'",
    "Create a login form",
  ];

  const handleExampleClick = (command: string) => {
    setInputValue(command);
    inputRef.current?.focus();
  };

  // Don't render if not open
  if (!isOpen) return null;

  return (
    <div className="fixed bottom-[60px] right-6 w-96 h-[600px] bg-white rounded-lg shadow-2xl flex flex-col z-50 border border-gray-300">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-600 to-gray-700 text-white p-4 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5" />
          <h3 className="font-semibold">AI Canvas Assistant</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1 hover:bg-gray-600 rounded transition-colors"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-600 rounded transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Key className="w-4 h-4" />
              <span>OpenAI API Key</span>
            </div>
            <input
              type="password"
              value={tempApiKey}
              onChange={(e) => setTempApiKey(e.target.value)}
              placeholder="sk-..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-500"
            />
            <button
              onClick={handleSaveApiKey}
              className="w-full bg-gray-700 hover:bg-gray-800 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Save API Key
            </button>
            <p className="text-xs text-gray-500">
              Your API key is stored only in your browser and never sent to our servers. 
              Get your key from{' '}
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-700 hover:underline font-medium"
              >
                OpenAI
              </a>
            </p>
          </div>
        </div>
      )}

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {!apiKey && messages.length === 1 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
                <p className="font-semibold mb-2">⚠️ No API Key Configured</p>
                <p>Click the Settings icon (⚙️) above to enter your OpenAI API key before using the AI assistant.</p>
              </div>
            )}
            
            {apiKey && messages.length === 1 && (
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  Try these example commands:
                </p>
                <div className="space-y-2">
                  {exampleCommands.map((cmd, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleExampleClick(cmd)}
                      className="w-full text-left px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm text-gray-700 transition-colors border border-gray-200"
                    >
                      {cmd}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    message.role === 'user'
                      ? 'bg-gray-700 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg px-4 py-2">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={apiKey ? "Type a command..." : "Set API key first..."}
            disabled={isLoading || !apiKey}
            rows={1}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:bg-gray-100 disabled:cursor-not-allowed resize-none overflow-hidden"
            style={{ minHeight: '38px', maxHeight: '120px' }}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading || !apiKey}
            className="bg-gray-700 hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white p-2 rounded-lg transition-colors flex-shrink-0"
            title="Send"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

