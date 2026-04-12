import React, { useEffect, useState } from "react";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HardDrive, FileText, Key, Loader2, AlertCircle, User, Blocks } from "lucide-react";
import { toast } from "sonner";

export function Settings() {
  const { settings, updateSettings, userProfile, updateUserProfile } = useAppStore();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  const mockTools = [
    "Slack", "Jira", "GitHub", "Trello", "Notion", 
    "Salesforce", "HubSpot", "Zendesk", "Asana", "Linear", 
    "Intercom", "Stripe", "Shopify", "Mailchimp", "Figma", 
    "Discord", "Microsoft Teams", "Dropbox", "Box", "Airtable", 
    "Snowflake", "Datadog", "PagerDuty", "Twilio", "SendGrid"
  ];

  useEffect(() => {
    checkAuthStatus();

    const handleMessage = (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost')) {
        return;
      }
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        setIsConnecting(false);
        checkAuthStatus();
        toast.success("Successfully connected to Google Workspace");
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const checkAuthStatus = async () => {
    try {
      const res = await fetch('/api/auth/status');
      const data = await res.json();
      setIsConnected(data.connected);
      updateSettings({ driveConnected: data.connected, docsConnected: data.connected });
    } catch (error) {
      console.error("Failed to check auth status", error);
    } finally {
      setIsChecking(false);
    }
  };

  const handleConnect = async () => {
    if (isConnected) {
      // Disconnect
      try {
        await fetch('/api/auth/disconnect', { method: 'POST' });
        setIsConnected(false);
        updateSettings({ driveConnected: false, docsConnected: false });
        toast.success("Disconnected from Google Workspace");
      } catch (error) {
        toast.error("Failed to disconnect");
      }
      return;
    }

    setIsConnecting(true);
    try {
      const response = await fetch('/api/auth/url');
      if (!response.ok) {
        throw new Error('Failed to get auth URL');
      }
      const { url } = await response.json();

      const authWindow = window.open(
        url,
        'oauth_popup',
        'width=600,height=700'
      );

      if (!authWindow) {
        setIsConnecting(false);
        toast.error('Please allow popups for this site to connect your account.');
      }
    } catch (error) {
      console.error('OAuth error:', error);
      setIsConnecting(false);
      toast.error('Failed to initiate connection');
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Settings & Integrations
        </h1>
        <p className="text-zinc-500 mt-2">
          Manage your personal information, external connections, and API keys.
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="w-5 h-5 mr-2" />
              User Profile
            </CardTitle>
            <CardDescription>
              Manage your personal information and preferences.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input
                  value={userProfile.name}
                  onChange={(e) => updateUserProfile({ name: e.target.value })}
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <Label>Email Address</Label>
                <Input
                  value={userProfile.email}
                  onChange={(e) => updateUserProfile({ email: e.target.value })}
                  placeholder="john@example.com"
                  type="email"
                />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Input
                  value={userProfile.role}
                  onChange={(e) => updateUserProfile({ role: e.target.value })}
                  placeholder="System Administrator"
                />
              </div>
              <div className="space-y-2">
                <Label>Company</Label>
                <Input
                  value={userProfile.company}
                  onChange={(e) => updateUserProfile({ company: e.target.value })}
                  placeholder="Omni Axiom Corp"
                />
              </div>
            </div>
          </CardContent>
        </Card>

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
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Google Workspace Integrations</CardTitle>
                <CardDescription className="mt-1">
                  Connect your Google account to allow agents to read from Drive and write to Docs.
                </CardDescription>
              </div>
              <Button 
                variant={isConnected ? "outline" : "default"}
                onClick={handleConnect}
                disabled={isChecking || isConnecting}
              >
                {isChecking || isConnecting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                {isConnected ? "Disconnect" : "Connect Google Account"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {!isConnected && !isChecking && (
              <div className="flex items-start space-x-3 text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 p-4 rounded-md border border-amber-200 dark:border-amber-900">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold mb-1">OAuth Setup Required</p>
                  <p>To use this feature, you must configure Google OAuth credentials in the AI Studio Settings panel.</p>
                  <ul className="list-disc ml-5 mt-2 space-y-1">
                    <li>Set <strong>GOOGLE_CLIENT_ID</strong> and <strong>GOOGLE_CLIENT_SECRET</strong></li>
                    <li>Add this callback URL to your Google Cloud Console: <code className="bg-amber-100 dark:bg-amber-900/50 px-1 py-0.5 rounded text-xs break-all">{window.location.origin}/api/auth/callback</code></li>
                  </ul>
                </div>
              </div>
            )}

            <div className={`flex items-center justify-between p-4 border rounded-lg transition-opacity ${isConnected ? 'opacity-100' : 'opacity-50'}`}>
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
              <div className="flex items-center space-x-2">
                <span className="text-sm text-zinc-500">{isConnected ? 'Connected' : 'Disconnected'}</span>
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-zinc-300 dark:bg-zinc-700'}`} />
              </div>
            </div>

            <div className={`flex items-center justify-between p-4 border rounded-lg transition-opacity ${isConnected ? 'opacity-100' : 'opacity-50'}`}>
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
              <div className="flex items-center space-x-2">
                <span className="text-sm text-zinc-500">{isConnected ? 'Connected' : 'Disconnected'}</span>
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-zinc-300 dark:bg-zinc-700'}`} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Blocks className="w-5 h-5 mr-2" />
              External Integrations (Coming Soon)
            </CardTitle>
            <CardDescription>
              Connect Omni Axiom to your favorite enterprise tools. These integrations are currently in development.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mockTools.map((tool) => (
                <div key={tool} className="flex items-center justify-between p-3 border rounded-lg opacity-60 bg-zinc-50 dark:bg-zinc-900/50">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-500">
                      {tool.charAt(0)}
                    </div>
                    <div>
                      <Label className="text-sm font-semibold">{tool}</Label>
                      <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Coming Soon</p>
                    </div>
                  </div>
                  <Switch disabled checked={false} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
