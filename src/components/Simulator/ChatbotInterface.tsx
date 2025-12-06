import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Minimize2, Maximize2, X, Sparkles, Zap, Settings } from 'lucide-react';
import HybridChatbotService, { HybridResponse } from '../../services/hybridChatbotService';
import OpenAIConfigModal from './OpenAIConfigModal';

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  source?: 'local' | 'openai' | 'fallback';
  confidence?: number;
}

interface ChatbotInterfaceProps {
  simulationData: any;
  isExpanded: boolean;
  onToggle: () => void;
}

const ChatbotInterface: React.FC<ChatbotInterfaceProps> = ({ 
  simulationData, 
  isExpanded, 
  onToggle 
}) => {
  const [hybridService] = useState(() => new HybridChatbotService());
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'ai',
      content: 'Bonjour ! 👋 Je suis votre assistant IA spécialisé dans l\'analyse des simulations d\'importation.\n\n🎯 **Je peux vous aider avec :**\n• Analyse des coûts et CAF\n• Optimisation transport et logistique\n• Stratégies d\'incoterms\n• Gestion des risques\n• Recommandations de prix\n• Questions complexes avec GPT-4\n\n💡 **Exemples de questions :**\n• "Quel est le montant de la CAF ?" (IA Locale)\n• "Comment optimiser ma stratégie ?" (GPT-4)\n\nQue souhaitez-vous savoir ?',
      timestamp: new Date(),
      source: 'local',
      confidence: 1.0
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOpenAIConfigured, setIsOpenAIConfigured] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  useEffect(() => {
    // Vérifier si OpenAI est configuré
    setIsOpenAIConfigured(hybridService.isOpenAIConfigured());
  }, [hybridService]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Utiliser le service hybride
      const conversationHistory = messages
        .filter(msg => msg.type === 'user' || msg.type === 'ai')
        .map(msg => ({
          role: msg.type === 'user' ? 'user' as const : 'assistant' as const,
          content: msg.content
        }));

      const response: HybridResponse = await hybridService.generateResponse(
        inputMessage.trim(),
        simulationData,
        conversationHistory
      );

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: response.content,
        timestamp: new Date(),
        source: response.source,
        confidence: response.confidence
      };

      setTimeout(() => {
        setMessages(prev => [...prev, aiMessage]);
        setIsLoading(false);
      }, 1000 + Math.random() * 2000); // Simulation d'un délai réaliste

    } catch (error) {
      console.error('Erreur lors de la génération de la réponse:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: 'Désolé, une erreur s\'est produite. Veuillez réessayer.',
        timestamp: new Date(),
        source: 'fallback',
        confidence: 0.1
      };
      setMessages(prev => [...prev, errorMessage]);
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessageContent = (content: string) => {
    // Convertir les retours à la ligne en <br>
    const lines = content.split('\n');
    return lines.map((line, index) => {
      if (line.trim().startsWith('##')) {
        return <h3 key={index} className="text-lg font-semibold text-gray-900 mb-2">{line.replace('##', '').trim()}</h3>;
      }
      if (line.trim().startsWith('**') && line.trim().endsWith('**')) {
        return <p key={index} className="font-semibold text-gray-900 mb-1">{line.replace(/\*\*/g, '')}</p>;
      }
      if (line.trim().startsWith('•')) {
        return <p key={index} className="ml-4 text-gray-700 mb-1">{line.trim()}</p>;
      }
      if (line.trim().startsWith('-')) {
        return <p key={index} className="ml-4 text-gray-700 mb-1">{line.trim()}</p>;
      }
      if (line.trim() === '') {
        return <br key={index} />;
      }
      return <p key={index} className="text-gray-700 mb-1">{line.trim()}</p>;
    });
  };

  if (!isExpanded) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={onToggle}
          className="bg-cote-ivoire-primary hover:bg-cote-ivoire-secondary text-white p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-105 flex items-center space-x-2"
        >
          <Bot className="h-6 w-6" />
          <span className="font-medium">Assistant IA</span>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-96 h-[600px] bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col">
      {/* Header */}
      <div className="bg-cote-ivoire-primary text-white p-4 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Bot className="h-5 w-5" />
          <div className="flex flex-col">
            <span className="font-semibold">Assistant IA - Importation</span>
            <div className="flex items-center space-x-2 text-xs">
              {isOpenAIConfigured ? (
                <div className="flex items-center space-x-1 bg-purple-600/20 px-2 py-1 rounded-full border border-purple-400/30">
                  <Sparkles className="h-3 w-3 text-purple-200 animate-pulse" />
                  <span className="text-purple-100 font-medium">GPT-4 + IA Locale</span>
                </div>
              ) : (
                <div className="flex items-center space-x-1 bg-yellow-600/20 px-2 py-1 rounded-full border border-yellow-400/30">
                  <Zap className="h-3 w-3 text-yellow-200" />
                  <span className="text-yellow-100 font-medium">IA Locale</span>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowConfigModal(true)}
            className="text-white hover:text-gray-200 transition-colors"
            title="Configuration OpenAI"
          >
            <Settings className="h-4 w-4" />
          </button>
          <button
            onClick={onToggle}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <Minimize2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.type === 'user'
                  ? 'bg-cote-ivoire-primary text-white'
                  : 'bg-white text-gray-900 border border-gray-200'
              }`}
            >
              <div className="flex items-start space-x-2">
                {message.type === 'ai' && (
                  <div className="flex items-center space-x-1">
                    {message.source === 'openai' ? (
                      <div className="flex items-center space-x-1 bg-purple-100 px-2 py-1 rounded-full">
                        <Sparkles className="h-4 w-4 flex-shrink-0 text-purple-600 animate-pulse" title="Powered by GPT-4" />
                        <span className="text-xs text-purple-700 font-medium">GPT-4</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-1 bg-orange-100 px-2 py-1 rounded-full">
                        <Bot className="h-4 w-4 flex-shrink-0 text-orange-600" title="IA Locale" />
                        <span className="text-xs text-orange-700 font-medium">Local</span>
                      </div>
                    )}
                  </div>
                )}
                {message.type === 'user' && (
                  <User className="h-4 w-4 mt-1 flex-shrink-0 text-white" />
                )}
                <div className="flex-1">
                  <div className="text-sm">
                    {formatMessageContent(message.content)}
                  </div>
                  <div className={`flex items-center justify-between mt-2 ${
                    message.type === 'user' ? 'text-white/70' : 'text-gray-500'
                  }`}>
                    <div className="text-xs">
                      {message.timestamp.toLocaleTimeString('fr-FR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                    {message.type === 'ai' && message.confidence && (
                      <div className="flex items-center space-x-1">
                        <div className={`w-2 h-2 rounded-full ${
                          message.confidence > 0.8 ? 'bg-green-500' : 
                          message.confidence > 0.5 ? 'bg-yellow-500' : 'bg-red-500'
                        }`} title={`Confiance: ${Math.round(message.confidence * 100)}%`}></div>
                        <span className="text-xs">
                          {Math.round(message.confidence * 100)}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white text-gray-900 border border-gray-200 rounded-lg p-3 max-w-[80%]">
              <div className="flex items-center space-x-2">
                <Bot className="h-4 w-4 text-cote-ivoire-primary" />
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-gray-200">
        <div className="flex space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Posez votre question sur la simulation..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cote-ivoire-primary focus:border-transparent text-sm"
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="bg-cote-ivoire-primary hover:bg-cote-ivoire-secondary disabled:bg-gray-300 text-white p-2 rounded-lg transition-colors"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        <div className="flex items-center justify-between mt-2">
          <div className="text-xs text-gray-500">
            💡 Essayez : "Comment réduire mes coûts ?" ou "Analyser mon transport"
          </div>
          {isOpenAIConfigured && (
            <button
              onClick={() => setInputMessage("Explique-moi comment optimiser ma stratégie d'importation de manière détaillée")}
              className="text-xs bg-purple-100 hover:bg-purple-200 text-purple-700 px-2 py-1 rounded-full transition-colors flex items-center space-x-1"
              title="Tester GPT-4"
            >
              <Sparkles className="h-3 w-3" />
              <span>Test GPT-4</span>
            </button>
          )}
        </div>
      </div>
      
      {/* Modal de configuration OpenAI */}
      <OpenAIConfigModal
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        onSave={(apiKey) => {
          hybridService.configureOpenAI(apiKey);
          setIsOpenAIConfigured(true);
        }}
      />
    </div>
  );
};

export default ChatbotInterface;
