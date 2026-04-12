import React, { useState } from 'react';
import { useAppStore, Workflow } from '@/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Brain, Wrench, CheckCircle2, Users, Plus, Edit, Trash2 } from 'lucide-react';

export function Workflows() {
  const { workflows, agents, addWorkflow, updateWorkflow, deleteWorkflow } = useAppStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [task, setTask] = useState("");
  const [memory, setMemory] = useState("Enabled");
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);

  const availableTools = [
    "Google Drive", "Google Docs", "Web Search", "Google Sheets", "Gmail", "Twitter API", "LinkedIn API", "GitHub", "Jira"
  ];

  const handleOpenNew = () => {
    setEditingId(null);
    setName("");
    setTask("");
    setMemory("Enabled");
    setSelectedTools([]);
    setSelectedAgents([]);
    setIsDialogOpen(true);
  };

  const handleEdit = (wf: Workflow) => {
    setEditingId(wf.id);
    setName(wf.name);
    setTask(wf.task);
    setMemory(wf.memory);
    setSelectedTools(wf.tools);
    setSelectedAgents(wf.agentsPermitted);
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!name || !task) return;

    if (editingId) {
      updateWorkflow(editingId, {
        name,
        task,
        memory,
        tools: selectedTools,
        agentsPermitted: selectedAgents,
      });
    } else {
      addWorkflow({
        id: `wf-${Date.now()}`,
        name,
        task,
        memory,
        tools: selectedTools,
        agentsPermitted: selectedAgents,
      });
    }

    setIsDialogOpen(false);
  };

  const toggleTool = (tool: string) => {
    setSelectedTools((prev) =>
      prev.includes(tool) ? prev.filter((t) => t !== tool) : [...prev, tool]
    );
  };

  const toggleAgent = (agentName: string) => {
    setSelectedAgents((prev) =>
      prev.includes(agentName) ? prev.filter((a) => a !== agentName) : [...prev, agentName]
    );
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configured Workflows</h1>
          <p className="text-zinc-500 mt-2">Pipelines available for the Master Agent to execute.</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger render={
            <Button onClick={handleOpenNew}>
              <Plus className="w-4 h-4 mr-2" />
              New Workflow
            </Button>
          } />
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Workflow" : "Create Workflow"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Workflow Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Weekly Analytics Report"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="task">Task to be done</Label>
                <Textarea
                  id="task"
                  value={task}
                  onChange={(e) => setTask(e.target.value)}
                  placeholder="Describe the workflow's main objective..."
                  className="h-24"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="memory">Memory</Label>
                <Input
                  id="memory"
                  value={memory}
                  onChange={(e) => setMemory(e.target.value)}
                  placeholder="e.g. Enabled (Vector DB Context)"
                />
              </div>
              <div className="grid gap-2">
                <Label>Tools Connected</Label>
                <div className="flex flex-wrap gap-2">
                  {availableTools.map((tool) => (
                    <Badge
                      key={tool}
                      variant={selectedTools.includes(tool) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleTool(tool)}
                    >
                      {tool}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Agents Permitted</Label>
                <div className="flex flex-wrap gap-2">
                  {agents.map((agent) => (
                    <Badge
                      key={agent.id}
                      variant={selectedAgents.includes(agent.name) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleAgent(agent.name)}
                    >
                      {agent.name}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={!name || !task}>
                {editingId ? "Update Workflow" : "Save Workflow"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {workflows.map(wf => (
          <Card key={wf.id} className="overflow-hidden">
            <div className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 px-6 py-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">{wf.name}</CardTitle>
                <div className="flex items-center space-x-3">
                  <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800">
                    Active
                  </Badge>
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(wf)}>
                    <Edit className="w-4 h-4 text-zinc-500" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteWorkflow(wf.id)}>
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
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
