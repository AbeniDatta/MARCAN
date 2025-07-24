import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, X, Send, Bot, User, Trash2 } from "lucide-react";
import api from "@/api";
import { auth } from "@/firebase";
import { profileApi } from "@/services/api";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Message {
    id: string;
    text: string;
    isUser: boolean;
    timestamp: Date;
    data?: any; // For storing RAG response data
}

const Chatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [chatbotName, setChatbotName] = useState("Marcy");
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "1",
            text: `Hey there! 👋 I'm ${chatbotName}, your AI assistant for the MARCAN website. \n\nNeed help finding suppliers, managing listings, or navigating the marketplace? I've got you covered.\n\nHere's what I can do:\n• Match you with manufacturers\n• Help manage and optimize listings\n• Guide you through platform features\n• Answer any questions along the way\n\nWhat can I help you with today? 😊`,
            isUser: false,
            timestamp: new Date(),
        },
    ]);
    const [inputValue, setInputValue] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                const user = auth.currentUser;
                if (user) {
                    const profile = await profileApi.getUserProfile(user.uid);
                    if (profile.chatbotName && profile.chatbotName.trim()) {
                        setChatbotName(profile.chatbotName);
                    }
                }
            } catch (error) {
                console.error('Error fetching user profile for chatbot name:', error);
                // Keep default "Marcy" if there's an error
            }
        };

        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) {
                fetchUserProfile();
            } else {
                setChatbotName("Marcy"); // Reset to default when signed out
            }
        });

        // Listen for profile updates
        const handleProfileUpdate = (event: CustomEvent) => {
            if (event.detail?.chatbotName) {
                setChatbotName(event.detail.chatbotName);
            }
        };

        window.addEventListener('profileUpdated', handleProfileUpdate as EventListener);

        return () => {
            unsubscribe();
            window.removeEventListener('profileUpdated', handleProfileUpdate as EventListener);
        };
    }, []);

    // Update welcome message when chatbotName changes
    useEffect(() => {
        setMessages(prev => {
            // Only update the first message (welcome message) if it exists and is from the bot
            if (prev.length > 0 && !prev[0].isUser) {
                const updatedMessages = [...prev];
                updatedMessages[0] = {
                    ...updatedMessages[0],
                    text: `Hey there! 👋 I'm ${chatbotName}, your AI assistant for the MARCAN website. \n\nNeed help finding suppliers, managing listings, or navigating the marketplace? I've got you covered.\n\nHere's what I can do:\n• Match you with manufacturers\n• Help manage and optimize listings\n• Guide you through platform features\n• Answer any questions along the way\n\nWhat can I help you with today? 😊`
                };
                return updatedMessages;
            }
            return prev;
        });
    }, [chatbotName]);

    // Clear chat function
    const clearChat = () => {
        setMessages([
            {
                id: Date.now().toString(),
                text: `Hey there! 👋 I'm ${chatbotName}, your AI assistant for the MARCAN website. \n\nNeed help finding suppliers, managing listings, or navigating the marketplace? I've got you covered.\n\nHere's what I can do:\n• Match you with manufacturers\n• Help manage and optimize listings\n• Guide you through platform features\n• Answer any questions along the way\n\nWhat can I help you with today? 😊`,
                isUser: false,
                timestamp: new Date(),
            },
        ]);
    };

    // RAG-powered AI response using the backend API
    const getAIResponse = async (userMessage: string): Promise<string> => {
        try {
            console.log('Sending chat query:', userMessage);
            const response = await api.post('/chat/query', {
                query: userMessage
            });

            console.log('Chat API response:', response.data);

            if (response.data.success) {
                return response.data.response;
            } else {
                console.error('Chat API returned error:', response.data);
                return "I'm sorry, I encountered an error processing your request. Please try again.";
            }
        } catch (error: any) {
            console.error('Chat API error details:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status,
                url: error.config?.url
            });

            if (error.response?.status === 404) {
                return "I'm sorry, the chat service is not available right now. Please try again later.";
            } else if (error.response?.status === 500) {
                return "I'm sorry, there was a server error. Please try again in a moment.";
            } else if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
                return "I'm having trouble connecting to the server. Please make sure the backend is running and try again.";
            } else {
                return "I'm having trouble connecting to the server right now. Please try again in a moment.";
            }
        }
    };

    const handleSendMessage = async () => {
        if (!inputValue.trim()) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            text: inputValue.trim(),
            isUser: true,
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInputValue("");
        setIsTyping(true);

        try {
            const aiResponse = await getAIResponse(userMessage.text);
            const aiMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: aiResponse,
                isUser: false,
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            console.error('Error getting AI response:', error);
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: "I'm sorry, I encountered an error. Please try again.",
                isUser: false,
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <TooltipProvider>
            <div className="fixed bottom-4 right-4 z-50">
                {/* Chat Toggle Button */}
                {!isOpen && (
                    <Button
                        onClick={() => setIsOpen(true)}
                        className="h-14 px-4 rounded-full bg-red-600 hover:bg-red-700 shadow-lg border-2 border-white"
                    >
                        <span className="text-white font-semibold text-sm">Ask {chatbotName}</span>
                    </Button>
                )}

                {/* Chat Window */}
                {isOpen && (
                    <Card className="w-96 h-[500px] shadow-xl border-2 border-red-200 bg-white">
                        <CardContent className="p-0 h-full flex flex-col">
                            {/* Header */}
                            <div className="bg-red-600 text-white p-4 rounded-t-lg flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Bot className="h-5 w-5" />
                                    <span className="font-bold text-lg">Ask {chatbotName}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                onClick={clearChat}
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-white hover:bg-red-700"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Clear chat</p>
                                        </TooltipContent>
                                    </Tooltip>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                onClick={() => setIsOpen(false)}
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-white hover:bg-red-700"
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Minimize chat</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                            </div>

                            {/* Messages */}
                            <ScrollArea className="flex-1 p-4 bg-gray-50">
                                <div className="space-y-4">
                                    {messages.map((message) => (
                                        <div
                                            key={message.id}
                                            className={`flex ${message.isUser ? "justify-end" : "justify-start"}`}
                                        >
                                            <div
                                                className={`max-w-[80%] rounded-lg p-3 ${message.isUser
                                                    ? "bg-red-600 text-white"
                                                    : "bg-white text-gray-900 border border-gray-200"
                                                    }`}
                                            >
                                                <div className="flex items-start gap-2">
                                                    {!message.isUser && <Bot className="h-4 w-4 mt-0.5 flex-shrink-0 text-red-600" />}
                                                    <div className="text-sm whitespace-pre-line">{message.text}</div>
                                                    {message.isUser && <User className="h-4 w-4 mt-0.5 flex-shrink-0" />}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {isTyping && (
                                        <div className="flex justify-start">
                                            <div className="bg-white text-gray-900 rounded-lg p-3 border border-gray-200">
                                                <div className="flex items-center gap-2">
                                                    <Bot className="h-4 w-4 text-red-600" />
                                                    <div className="flex space-x-1">
                                                        <div className="w-2 h-2 bg-red-400 rounded-full animate-bounce"></div>
                                                        <div className="w-2 h-2 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                                                        <div className="w-2 h-2 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>
                            </ScrollArea>

                            {/* Input */}
                            <div className="p-4 border-t border-gray-200 bg-white">
                                <div className="flex gap-2">
                                    <Input
                                        ref={inputRef}
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        placeholder="Ask me anything..."
                                        className="flex-1 border-gray-300 focus:border-red-500 focus:ring-red-500"
                                    />
                                    <Button
                                        onClick={handleSendMessage}
                                        disabled={!inputValue.trim() || isTyping}
                                        size="icon"
                                        className="bg-red-600 hover:bg-red-700 border-2 border-red-600 hover:border-red-700"
                                    >
                                        <Send className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </TooltipProvider>
    );
};

export default Chatbot; 