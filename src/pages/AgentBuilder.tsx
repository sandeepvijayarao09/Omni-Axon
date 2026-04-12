import React, { useState } from "react";
import { useAppStore } from "@/store";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Bot, Settings2, Trash2 } from "lucide-react";

export function AgentBuilder() {
  const { agents, addAgent, deleteAgent } = useAppStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [selectedTools, setSelectedTools] = useState<string[]>([]);

  const availableTools = [
    { id: "readFromDrive", label: "Read from Google Drive" },
    { id: "writeToDocs", label: "Write to Google Docs" },
    { id: "webSearch", label: "Web Search" },
  ];

  const handleSave = () => {
    if (!name || !role || !systemPrompt) return;

    addAgent({
      id: `agent-${Date.now()}`,
      name,
      role,
      systemPrompt,
      tools: selectedTools,
    });

    setName("");
    setRole("");
    setSystemPrompt("");
    setSelectedTools([]);
    setIsDialogOpen(false);
  };

  const toggleTool = (toolId: string) => {
    setSelectedTools((prev) =>
      prev.includes(toolId)
        ? prev.filter((t) => t !== toolId)
        : [...prev, toolId],
    );
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agent Builder</h1>
          <p className="text-zinc-500 mt-2">
            Create and customize specialized AI agents for your workflows.
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Agent
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create Custom Agent</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Agent Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Data Extractor"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role">Role</Label>
                <Input
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. Senior Data Analyst"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="systemPrompt">System Instructions</Label>
                <Textarea
                  id="systemPrompt"
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  placeholder="You are an expert at..."
                  className="h-32"
                />
              </div>
              <div className="grid gap-2">
                <Label>Available Tools</Label>
                <div className="flex flex-wrap gap-2">
                  {availableTools.map((tool) => (
                    <Badge
                      key={tool.id}
                      variant={
                        selectedTools.includes(tool.id) ? "default" : "outline"
                      }
                      className="cursor-pointer"
                      onClick={() => toggleTool(tool.id)}
                    >
                      {tool.label}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSave}>Save Agent</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents.map((agent) => (
          <Card key={agent.id} className="flex flex-col">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Bot className="w-5 h-5 text-indigo-600" />
                  <CardTitle>{agent.name}</CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteAgent(agent.id)}
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
              <CardDescription>{agent.role}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 space-y-4">
              <div className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-3">
                {agent.systemPrompt}
              </div>
              <div className="flex flex-wrap gap-1 mt-auto">
                {agent.tools.map((toolId) => {
                  const tool = availableTools.find((t) => t.id === toolId);
                  return tool ? (
                    <Badge key={toolId} variant="secondary" className="text-xs">
                      {tool.label}
                    </Badge>
                  ) : null;
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
