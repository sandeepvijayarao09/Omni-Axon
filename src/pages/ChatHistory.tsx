import React from 'react';
import { useAppStore } from '@/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Calendar, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function ChatHistory() {
  const { chatSessions, setCurrentSessionId } = useAppStore();
  const navigate = useNavigate();

  const handleOpenSession = (id: string) => {
    setCurrentSessionId(id);
    navigate('/');
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Chat History</h1>
        <p className="text-zinc-500 mt-2">Review your past interactions with the Master Agent.</p>
      </div>

      <div className="space-y-4">
        {chatSessions.length === 0 ? (
          <div className="p-12 text-center border-2 border-dashed rounded-xl border-zinc-200 dark:border-zinc-800">
            <MessageSquare className="w-8 h-8 mx-auto text-zinc-300 dark:text-zinc-700 mb-4" />
            <p className="text-zinc-500">No chat history yet. Start a conversation on the home page.</p>
          </div>
        ) : (
          chatSessions.map(session => (
            <Card 
              key={session.id} 
              className="cursor-pointer hover:border-indigo-500/50 transition-colors"
              onClick={() => handleOpenSession(session.id)}
            >
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center shrink-0">
                    <MessageSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-zinc-900 dark:text-zinc-100 line-clamp-1">
                      {session.title || 'New Conversation'}
                    </h3>
                    <div className="flex items-center text-xs text-zinc-500 mt-1">
                      <Calendar className="w-3 h-3 mr-1" />
                      {new Date(session.date).toLocaleString()}
                      <span className="mx-2">•</span>
                      {session.messages.length} messages
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-zinc-400" />
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
