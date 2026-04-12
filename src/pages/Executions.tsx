import React from "react";
import { useAppStore } from "@/store";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Activity, CheckCircle2, XCircle, Clock } from "lucide-react";

export function Executions() {
  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Execution History</h1>
        <p className="text-zinc-500 mt-2">
          View the logs and status of your recent workflow runs.
        </p>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Recent Runs</CardTitle>
            <CardDescription>No recent executions found.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
              <Activity className="w-12 h-12 mb-4 text-zinc-300 dark:text-zinc-700" />
              <p>Run a workflow from the Workflow Builder to see logs here.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
