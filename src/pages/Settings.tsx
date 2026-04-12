import React from "react";
import { useAppStore } from "@/store";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { HardDrive, FileText, Key } from "lucide-react";

export function Settings() {
  const { settings, updateSettings } = useAppStore();

  const handleDriveToggle = (checked: boolean) => {
    // In a real app, this would initiate the OAuth flow
    // For this prototype, we simulate the connection state
    updateSettings({ driveConnected: checked });
  };

  const handleDocsToggle = (checked: boolean) => {
    updateSettings({ docsConnected: checked });
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Settings & Integrations
        </h1>
        <p className="text-zinc-500 mt-2">
          Manage your external connections and API keys.
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Key className="w-5 h-5 mr-2" />
              Bring Your Own Key (BYOK)
            </CardTitle>
            <CardDescription>
              Your Gemini API Key is securely injected by the AI Studio
              environment.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10 p-3 rounded-md border border-green-200 dark:border-green-900">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span>Gemini API Key is configured and active.</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Google Workspace Integrations</CardTitle>
            <CardDescription>
              Connect your Google account to allow agents to read from Drive and
              write to Docs.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-full">
                  <HardDrive className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <Label className="text-base font-semibold">
                    Google Drive
                  </Label>
                  <p className="text-sm text-zinc-500">
                    Allow agents to read files and folders.
                  </p>
                </div>
              </div>
              <Switch
                checked={settings.driveConnected}
                onCheckedChange={handleDriveToggle}
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-full">
                  <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <Label className="text-base font-semibold">Google Docs</Label>
                  <p className="text-sm text-zinc-500">
                    Allow agents to create and edit documents.
                  </p>
                </div>
              </div>
              <Switch
                checked={settings.docsConnected}
                onCheckedChange={handleDocsToggle}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
