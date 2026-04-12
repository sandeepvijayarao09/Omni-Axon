import React, { useState } from "react";
import { useAppStore } from "@/store";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Activity, CheckCircle2, XCircle, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

export function Executions() {
  const executions = useAppStore(state => state.executions);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 w-full">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Execution History</h1>
        <p className="text-zinc-500 mt-2">
          View the logs and status of your recent workflow runs.
        </p>
      </div>

      <div className="space-y-4">
        {executions.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Recent Runs</CardTitle>
              <CardDescription>No recent executions found.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
                <Activity className="w-12 h-12 mb-4 text-zinc-300 dark:text-zinc-700" />
                <p>Run a workflow from the Chat to see logs here.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          executions.map((execution) => (
            <Card key={execution.id} className="overflow-hidden">
              <div 
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors"
                onClick={() => toggleExpand(execution.id)}
              >
                <div className="flex items-center gap-4">
                  {execution.status === 'completed' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : execution.status === 'failed' ? (
                    <XCircle className="w-5 h-5 text-red-500" />
                  ) : (
                    <Clock className="w-5 h-5 text-amber-500 animate-pulse" />
                  )}
                  <div>
                    <h3 className="font-semibold">{execution.workflowName}</h3>
                    <p className="text-xs text-zinc-500">
                      {new Date(execution.startTime).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={cn(
                    "text-xs px-2 py-1 rounded-full font-medium",
                    execution.status === 'completed' ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                    execution.status === 'failed' ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                  )}>
                    {execution.status.charAt(0).toUpperCase() + execution.status.slice(1)}
                  </span>
                  {expandedId === execution.id ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
                </div>
              </div>
              
              {expandedId === execution.id && (
                <div className="border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-4">
                  <div className="mb-4">
                    <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Trigger Input</h4>
                    <div className="text-sm bg-white dark:bg-zinc-900 p-3 rounded-md border border-zinc-200 dark:border-zinc-800 whitespace-pre-wrap">
                      {execution.triggerInput}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Execution Logs</h4>
                    <div className="space-y-2">
                      {execution.logs.map((log, i) => (
                        <div key={i} className="text-sm bg-white dark:bg-zinc-900 p-3 rounded-md border border-zinc-200 dark:border-zinc-800 font-mono">
                          <span className="text-indigo-500 font-semibold">[{log.step}]</span> {log.output}
                        </div>
                      ))}
                      {execution.logs.length === 0 && (
                        <p className="text-sm text-zinc-500 italic">No logs generated yet.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
