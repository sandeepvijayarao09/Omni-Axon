import React, { useState } from "react";
import { useAppStore, Agent } from "@/store";
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
import { Plus, Bot, Settings2, Trash2, Sparkles, Loader2, Edit } from "lucide-react";
import { generateAgent } from "@/lib/gemini";
import { toast } from "sonner";

export function AgentBuilder() {
  const { agents, addAgent, updateAgent, deleteAgent } = useAppStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [selectedTools, setSelectedTools] = useState<string[]>([]);

  const availableTools = [
    { id: "readFromDrive", label: "Read from Google Drive" },
    { id: "writeToDocs", label: "Write to Google Docs" },
    { id: "webSearch", label: "Web Search" },
    { id: "slack", label: "Slack (Coming Soon)" },
    { id: "jira", label: "Jira (Coming Soon)" },
    { id: "github", label: "GitHub (Coming Soon)" },
    { id: "trello", label: "Trello (Coming Soon)" },
    { id: "notion", label: "Notion (Coming Soon)" },
    { id: "salesforce", label: "Salesforce (Coming Soon)" },
    { id: "hubspot", label: "HubSpot (Coming Soon)" },
    { id: "zendesk", label: "Zendesk (Coming Soon)" },
    { id: "asana", label: "Asana (Coming Soon)" },
    { id: "linear", label: "Linear (Coming Soon)" },
    { id: "intercom", label: "Intercom (Coming Soon)" },
    { id: "stripe", label: "Stripe (Coming Soon)" },
    { id: "shopify", label: "Shopify (Coming Soon)" },
    { id: "mailchimp", label: "Mailchimp (Coming Soon)" },
    { id: "figma", label: "Figma (Coming Soon)" },
    { id: "discord", label: "Discord (Coming Soon)" },
    { id: "teams", label: "Microsoft Teams (Coming Soon)" },
    { id: "dropbox", label: "Dropbox (Coming Soon)" },
    { id: "box", label: "Box (Coming Soon)" },
    { id: "airtable", label: "Airtable (Coming Soon)" },
    { id: "snowflake", label: "Snowflake (Coming Soon)" },
    { id: "datadog", label: "Datadog (Coming Soon)" },
    { id: "pagerduty", label: "PagerDuty (Coming Soon)" },
    { id: "twilio", label: "Twilio (Coming Soon)" },
    { id: "sendgrid", label: "SendGrid (Coming Soon)" },
  ];

  const handleOpenNew = () => {
    setEditingId(null);
    setName("");
    setRole("");
    setSystemPrompt("");
    setAiPrompt("");
    setSelectedTools([]);
    setIsDialogOpen(true);
  };

  const handleEdit = (agent: Agent) => {
    setEditingId(agent.id);
    setName(agent.name);
    setRole(agent.role);
    setSystemPrompt(agent.systemPrompt);
    setSelectedTools(agent.tools);
    setAiPrompt("");
    setIsDialogOpen(true);
  };

  const handleGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    try {
      const generated = await generateAgent(aiPrompt);
      if (generated.name) setName(generated.name);
      if (generated.role) setRole(generated.role);
      if (generated.systemPrompt) setSystemPrompt(generated.systemPrompt);
      toast.success("Agent profile generated successfully!");
    } catch (error) {
      toast.error("Failed to generate agent profile.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = () => {
    if (!name || !role || !systemPrompt) return;

    if (editingId) {
      updateAgent(editingId, {
        name,
        role,
        systemPrompt,
        tools: selectedTools,
      });
      toast.success("Agent updated successfully!");
    } else {
      addAgent({
        id: `agent-${Date.now()}`,
        name,
        role,
        systemPrompt,
        tools: selectedTools,
      });
      toast.success("Agent created successfully!");
    }

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
          <DialogTrigger render={
            <Button onClick={handleOpenNew}>
              <Plus className="w-4 h-4 mr-2" />
              New Agent
            </Button>
          } />
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Agent" : "Create Custom Agent"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
              
              {/* AI Generation Section */}
              {!editingId && (
                <div className="p-4 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900 rounded-lg space-y-3">
                  <Label className="text-indigo-700 dark:text-indigo-300 flex items-center">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Auto-Generate with AI
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder="e.g. A friendly customer support agent for a SaaS company..."
                      className="bg-white dark:bg-zinc-900"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleGenerate();
                        }
                      }}
                    />
                    <Button 
                      onClick={handleGenerate} 
                      disabled={isGenerating || !aiPrompt.trim()}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                      {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Generate"}
                    </Button>
                  </div>
                </div>
              )}

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
                <Label>External Tools (Manual Selection)</Label>
                <div className="flex flex-wrap gap-2">
                  {availableTools.map((tool) => (
                    <Badge
                      key={tool.id}
                      variant={
                        selectedTools.includes(tool.label) ? "default" : "outline"
                      }
                      className="cursor-pointer"
                      onClick={() => toggleTool(tool.label)}
                    >
                      {tool.label}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={!name || !role || !systemPrompt}>
                {editingId ? "Update Agent" : "Save Agent"}
              </Button>
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
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(agent)}
                  >
                    <Edit className="w-4 h-4 text-zinc-500" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteAgent(agent.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
              <CardDescription>{agent.role}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col space-y-4">
              <div className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-3">
                {agent.systemPrompt}
              </div>
              <div className="flex flex-wrap gap-1 mt-auto">
                {agent.tools.map((toolLabel) => (
                  <Badge key={toolLabel} variant="secondary" className="text-xs">
                    {toolLabel}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
