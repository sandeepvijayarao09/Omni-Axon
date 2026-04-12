import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '@/store';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Bot, User, Loader2, ChevronDown, ChevronRight } from 'lucide-react';
import { executeWorkflow } from '@/lib/gemini';
import { cn } from '@/lib/utils';

export function Chat() {
  const { 
    workflows, 
    agents, 
    chatSessions, 
    currentSessionId, 
    addChatSession, 
    addMessageToSession, 
    updateMessageLogs,
    updateMessageContent,
    setCurrentSessionId 
  } = useAppStore();
  
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentSession = chatSessions.find(s => s.id === currentSessionId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentSession?.messages]);

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;

    let sessionId = currentSessionId;
    
    // Create new session if none exists
    if (!sessionId) {
      sessionId = `session-${Date.now()}`;
      addChatSession({
        id: sessionId,
        title: input.slice(0, 30) + '...',
        date: new Date().toISOString(),
        messages: []
      });
    }

    const userMessageId = `msg-${Date.now()}`;
    addMessageToSession(sessionId, {
      id: userMessageId,
      role: 'user',
      content: input
    });

    const assistantMessageId = `msg-${Date.now() + 1}`;
    addMessageToSession(sessionId, {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      logs: []
    });

    const currentInput = input;
    setInput('');
    setIsProcessing(true);

    try {
      // For the prototype, we just use the first workflow
      const workflowToRun = workflows[0];
      
      if (!workflowToRun) {
        updateMessageContent(sessionId, assistantMessageId, "No workflows configured. Please create a workflow first.");
        setIsProcessing(false);
        return;
      }

      const finalOutput = await executeWorkflow(
        workflowToRun,
        agents,
        currentInput,
        (step, output) => {
          updateMessageLogs(sessionId!, assistantMessageId, { step, output });
        }
      );

      updateMessageContent(sessionId, assistantMessageId, finalOutput);
    } catch (error) {
      updateMessageContent(sessionId, assistantMessageId, "An error occurred during execution.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto w-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {!currentSession || currentSession.messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 text-zinc-500">
            <Bot className="w-12 h-12 text-zinc-300 dark:text-zinc-700" />
            <div>
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">How can I help you today?</h2>
              <p className="mt-2 text-sm max-w-md">
                I am your Master Agent. Describe your task, and I will route it through your configured workflows and sub-agents.
              </p>
            </div>
          </div>
        ) : (
          currentSession.messages.map((msg) => (
            <div key={msg.id} className={cn("flex gap-4", msg.role === 'user' ? "justify-end" : "justify-start")}>
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center shrink-0">
                  <Bot className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
              )}
              
              <div className={cn(
                "max-w-[80%] rounded-2xl px-4 py-3",
                msg.role === 'user' 
                  ? "bg-indigo-600 text-white rounded-tr-sm" 
                  : "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-tl-sm shadow-sm"
              )}>
                {msg.role === 'assistant' && msg.logs && msg.logs.length > 0 && (
                  <div className="mb-3 space-y-2">
                    {msg.logs.map((log, i) => (
                      <div key={i} className="text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 rounded p-2 font-mono text-zinc-600 dark:text-zinc-400">
                        <span className="text-indigo-500 font-semibold">[{log.step}]</span> {log.output}
                      </div>
                    ))}
                    {isProcessing && msg.content === '' && (
                      <div className="flex items-center space-x-2 text-xs text-zinc-500 font-mono p-2">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Agent working...</span>
                      </div>
                    )}
                  </div>
                )}
                
                {msg.content && (
                  <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                    {msg.content}
                  </div>
                )}
              </div>

              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                  <User className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                </div>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800">
        <div className="relative flex items-end gap-2 max-w-4xl mx-auto">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask the master agent to perform a task..."
            className="min-h-[60px] max-h-[200px] resize-none pb-12 rounded-xl"
            disabled={isProcessing}
          />
          <div className="absolute right-3 bottom-3">
            <Button 
              size="icon" 
              className="rounded-full h-8 w-8" 
              onClick={handleSend}
              disabled={!input.trim() || isProcessing}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <div className="text-center mt-2 text-xs text-zinc-500">
          Master Agent will automatically route your request to the appropriate workflow.
        </div>
      </div>
    </div>
  );
}
