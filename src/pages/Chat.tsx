import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '@/store';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Bot, User, Loader2, Paperclip, X, FileText, Image as ImageIcon } from 'lucide-react';
import { executeWorkflow, classifyAndRespond } from '@/lib/gemini';
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
    setCurrentSessionId,
    addExecution
  } = useAppStore();
  
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [attachments, setAttachments] = useState<{ name: string; type: string; data: string }[]>([]);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentSession = chatSessions.find(s => s.id === currentSessionId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentSession?.messages]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInput(val);
    
    // Check for @ mention
    const match = val.match(/@(\w*)$/);
    if (match) {
      setShowMentions(true);
      setMentionFilter(match[1].toLowerCase());
    } else {
      setShowMentions(false);
    }
  };

  const insertMention = (workflowName: string) => {
    setInput(input.replace(/@\w*$/, `@"${workflowName}" `));
    setShowMentions(false);
    // Focus back on textarea could go here
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setAttachments(prev => [...prev, {
            name: file.name,
            type: file.type,
            data: event.target!.result as string
          }]);
        }
      };
      reader.readAsDataURL(file);
    });
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if ((!input.trim() && attachments.length === 0) || isProcessing) return;

    let sessionId = currentSessionId;
    
    // Create new session if none exists
    if (!sessionId) {
      sessionId = `session-${Date.now()}`;
      addChatSession({
        id: sessionId,
        title: input.slice(0, 30) || 'New Chat',
        date: new Date().toISOString(),
        messages: []
      });
    }

    const userMessageId = `msg-${Date.now()}`;
    addMessageToSession(sessionId, {
      id: userMessageId,
      role: 'user',
      content: input,
      attachments: attachments.length > 0 ? [...attachments] : undefined
    });

    const assistantMessageId = `msg-${Date.now() + 1}`;
    addMessageToSession(sessionId, {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      logs: []
    });

    const currentInput = input;
    const currentAttachments = [...attachments];
    setInput('');
    setAttachments([]);
    setShowMentions(false);
    setIsProcessing(true);

    try {
      // Check if a workflow was explicitly mentioned
      let forcedWorkflow = null;
      const mentionMatch = currentInput.match(/@"([^"]+)"/);
      if (mentionMatch) {
        forcedWorkflow = workflows.find(w => w.name === mentionMatch[1]);
      }

      const historyMessages = currentSession?.messages.slice(-6) || [];
      const chatHistory = historyMessages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n');

      let classification;
      if (forcedWorkflow) {
        classification = { intent: 'workflow', workflowId: forcedWorkflow.id };
      } else {
        // Step 1: Classify intent
        classification = await classifyAndRespond(currentInput, workflows, chatHistory);
      }

      // Prepare input with attachments for the agent
      let fullInput = currentInput;
      if (currentAttachments.length > 0) {
        const attachmentContext = currentAttachments.map(a => `[Attached File: ${a.name}]`).join('\n');
        fullInput = `${attachmentContext}\n\n${currentInput}`;
      }

      if (classification.intent === 'chat') {
        // Just a conversational response
        updateMessageContent(sessionId, assistantMessageId, classification.chatResponse || "I'm here to help!");
      } else if (classification.intent === 'workflow' && classification.workflowId) {
        // Route to workflow
        const workflowToRun = workflows.find(w => w.id === classification.workflowId) || workflows[0];
        
        updateMessageLogs(sessionId, assistantMessageId, { 
          step: 'Master Agent', 
          output: `Task detected. Routing to workflow: ${workflowToRun.name}` 
        });

        const executionId = `exec-${Date.now()}`;
        addExecution({
          id: executionId,
          workflowId: workflowToRun.id,
          workflowName: workflowToRun.name,
          status: 'running',
          startTime: new Date().toISOString(),
          logs: [],
          triggerInput: fullInput
        });

        const finalOutput = await executeWorkflow(
          workflowToRun,
          agents,
          fullInput,
          (step, output) => {
            updateMessageLogs(sessionId!, assistantMessageId, { step, output });
            useAppStore.getState().addExecutionLog(executionId, { step, output, timestamp: new Date().toISOString() });
          },
          chatHistory
        );

        useAppStore.getState().updateExecution(executionId, { status: 'completed', endTime: new Date().toISOString() });
        updateMessageContent(sessionId, assistantMessageId, finalOutput);
      } else if (classification.intent === 'dynamic_task') {
        // Handle dynamic task creation
        updateMessageLogs(sessionId, assistantMessageId, { 
          step: 'Master Agent', 
          output: `No existing workflow found. Creating dynamic workflow: ${classification.dynamicTaskName || 'Ad-hoc Task'}` 
        });

        const dynamicAgentsList = classification.dynamicAgents?.map((a: any, index: number) => ({
          id: `dyn-agent-${index}`,
          name: a.name || `Agent ${index + 1}`,
          role: a.role || 'Assistant',
          systemPrompt: a.systemPrompt || 'You are a helpful assistant.',
          tools: a.tools || []
        })) || [];

        if (dynamicAgentsList.length === 0) {
          dynamicAgentsList.push({
            id: 'dyn-agent-fallback',
            name: 'Task Solver',
            role: 'General Assistant',
            systemPrompt: 'You are a helpful assistant solving the user\'s task.',
            tools: ['Google Docs', 'Google Drive']
          });
        }

        const dynamicWorkflow = {
          id: 'dynamic',
          name: classification.dynamicTaskName || 'Ad-hoc Task',
          task: fullInput,
          memory: 'Disabled',
          tools: [],
          agentsPermitted: dynamicAgentsList.map((a: any) => a.name)
        };

        const executionId = `exec-${Date.now()}`;
        addExecution({
          id: executionId,
          workflowId: 'dynamic',
          workflowName: dynamicWorkflow.name,
          status: 'running',
          startTime: new Date().toISOString(),
          logs: [],
          triggerInput: fullInput
        });

        const finalOutput = await executeWorkflow(
          dynamicWorkflow,
          dynamicAgentsList,
          fullInput,
          (step, output) => {
            updateMessageLogs(sessionId!, assistantMessageId, { step, output });
            useAppStore.getState().addExecutionLog(executionId, { step, output, timestamp: new Date().toISOString() });
          },
          chatHistory
        );

        useAppStore.getState().updateExecution(executionId, { status: 'completed', endTime: new Date().toISOString() });
        updateMessageContent(sessionId, assistantMessageId, finalOutput);
      } else {
        updateMessageContent(sessionId, assistantMessageId, "I couldn't determine how to handle that request.");
      }
    } catch (error) {
      updateMessageContent(sessionId, assistantMessageId, "An error occurred during execution.");
      // Find the running execution and mark it failed
      const runningExec = useAppStore.getState().executions.find(e => e.status === 'running');
      if (runningExec) {
        useAppStore.getState().updateExecution(runningExec.id, { status: 'failed', endTime: new Date().toISOString() });
      }
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

  const filteredWorkflows = workflows.filter(w => w.name.toLowerCase().includes(mentionFilter));

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto w-full relative">
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {!currentSession || currentSession.messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 text-zinc-500">
            <Bot className="w-12 h-12 text-zinc-300 dark:text-zinc-700" />
            <div>
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">How can I help you today?</h2>
              <p className="mt-2 text-sm max-w-md">
                I am your Master Agent. Ask me a question, or describe a task and I will route it through your configured workflows and sub-agents. Use @ to mention a specific workflow.
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
                
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {msg.attachments.map((att, i) => (
                      <div key={i} className="flex items-center gap-1.5 bg-white/20 px-2 py-1 rounded text-xs">
                        {att.type.startsWith('image/') ? <ImageIcon className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                        <span className="truncate max-w-[150px]">{att.name}</span>
                      </div>
                    ))}
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

      <div className="p-4 bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 relative">
        {showMentions && filteredWorkflows.length > 0 && (
          <div className="absolute bottom-full left-4 mb-2 w-64 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-lg overflow-hidden z-10">
            <div className="px-3 py-2 text-xs font-semibold text-zinc-500 bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800">
              Select Workflow
            </div>
            <div className="max-h-48 overflow-y-auto">
              {filteredWorkflows.map(w => (
                <button
                  key={w.id}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  onClick={() => insertMention(w.name)}
                >
                  {w.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3 max-w-4xl mx-auto">
            {attachments.map((att, i) => (
              <div key={i} className="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 rounded-full text-sm shadow-sm">
                {att.type.startsWith('image/') ? <ImageIcon className="w-4 h-4 text-indigo-500" /> : <FileText className="w-4 h-4 text-indigo-500" />}
                <span className="truncate max-w-[150px]">{att.name}</span>
                <button onClick={() => removeAttachment(i)} className="text-zinc-400 hover:text-zinc-600">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="relative flex items-end gap-2 max-w-4xl mx-auto bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm focus-within:ring-1 focus-within:ring-indigo-500 transition-shadow">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            multiple 
            accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,image/*"
          />
          <Button 
            variant="ghost" 
            size="icon" 
            className="mb-1 ml-1 rounded-full text-zinc-400 hover:text-zinc-600"
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip className="w-5 h-5" />
          </Button>
          <Textarea
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question, @mention a workflow, or attach files..."
            className="min-h-[60px] max-h-[200px] resize-none border-0 focus-visible:ring-0 shadow-none py-3 px-2 bg-transparent"
            disabled={isProcessing}
          />
          <div className="mb-2 mr-2">
            <Button 
              size="icon" 
              className="rounded-full h-8 w-8 bg-indigo-600 hover:bg-indigo-700 text-white" 
              onClick={handleSend}
              disabled={(!input.trim() && attachments.length === 0) || isProcessing}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
