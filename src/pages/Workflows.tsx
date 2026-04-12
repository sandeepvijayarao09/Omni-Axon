import React from 'react';
import { useAppStore } from '@/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, Wrench, CheckCircle2, Users } from 'lucide-react';

export function Workflows() {
  const { workflows } = useAppStore();

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configured Workflows</h1>
        <p className="text-zinc-500 mt-2">Pipelines available for the Master Agent to execute.</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {workflows.map(wf => (
          <Card key={wf.id} className="overflow-hidden">
            <div className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 px-6 py-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">{wf.name}</CardTitle>
                <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800">
                  Active
                </Badge>
              </div>
            </div>
            <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <div className="flex items-center space-x-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-500" />
                    <span>Task to be done</span>
                  </div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    {wf.task}
                  </p>
                </div>
                
                <div>
                  <div className="flex items-center space-x-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                    <Brain className="w-4 h-4 text-indigo-500" />
                    <span>Memory</span>
                  </div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {wf.memory}
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <div className="flex items-center space-x-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                    <Wrench className="w-4 h-4 text-indigo-500" />
                    <span>Tools Connected</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {wf.tools.map((tool, i) => (
                      <Badge key={i} variant="outline" className="bg-white dark:bg-zinc-950">
                        {tool}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center space-x-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                    <Users className="w-4 h-4 text-indigo-500" />
                    <span>Agents Permitted</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {wf.agentsPermitted.map((agent, i) => (
                      <Badge key={i} variant="secondary">
                        {agent}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {workflows.length === 0 && (
          <div className="p-12 text-center border-2 border-dashed rounded-xl border-zinc-200 dark:border-zinc-800">
            <p className="text-zinc-500">No workflows configured yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
