import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Workflow, Bot, Settings, Layers, Activity, Menu, MessageSquare, History } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

export function Layout() {
  const [isOpen, setIsOpen] = useState(false);

  const NavItems = () => (
    <>
      <div className="h-16 flex items-center px-6 border-b border-zinc-200 dark:border-zinc-800">
        <Layers className="w-6 h-6 mr-2 text-indigo-600 dark:text-indigo-400" />
        <span className="font-bold text-lg tracking-tight">Orchestrator</span>
      </div>
      
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <NavItem to="/" icon={<MessageSquare className="w-5 h-5" />} label="Chat" onClick={() => setIsOpen(false)} />
        <NavItem to="/history" icon={<History className="w-5 h-5" />} label="Chat History" onClick={() => setIsOpen(false)} />
        <NavItem to="/workflows" icon={<Workflow className="w-5 h-5" />} label="Workflows" onClick={() => setIsOpen(false)} />
        <NavItem to="/agents" icon={<Bot className="w-5 h-5" />} label="Agent Builder" onClick={() => setIsOpen(false)} />
        <NavItem to="/executions" icon={<Activity className="w-5 h-5" />} label="Executions" onClick={() => setIsOpen(false)} />
        <NavItem to="/settings" icon={<Settings className="w-5 h-5" />} label="Settings" onClick={() => setIsOpen(false)} />
      </nav>
      
      <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 text-xs text-zinc-500">
        <p>BYOK Orchestrator v1.0</p>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 flex-col">
      {/* Top Navigation Bar */}
      <header className="h-14 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center px-4 shrink-0">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="mr-2">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0 flex flex-col">
            <NavItems />
          </SheetContent>
        </Sheet>
        <div className="flex items-center font-semibold">
          <Layers className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400" />
          Orchestrator
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto flex flex-col relative">
        <Outlet />
      </main>
    </div>
  );
}

function NavItem({ to, icon, label, onClick }: { to: string; icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          "flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
          isActive 
            ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400" 
            : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800/50"
        )
      }
    >
      {icon}
      <span className="ml-3">{label}</span>
    </NavLink>
  );
}
