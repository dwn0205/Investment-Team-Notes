import { Link, useLocation } from "wouter";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Plus, LayoutList, Calendar, PieChart } from "lucide-react";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <Sidebar className="border-r border-border bg-sidebar">
          <SidebarHeader className="p-4">
            <h1 className="text-lg font-bold tracking-tight text-sidebar-foreground">
              Investment Notes App
            </h1>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <div className="px-4 mb-4">
                  <Link href="/notes/new">
                    <span className="flex items-center justify-center gap-2 w-full bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md font-medium transition-colors text-sm cursor-pointer shadow-sm">
                      <Plus className="w-4 h-4" />
                      New Note
                    </span>
                  </Link>
                </div>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={location === "/notes"}>
                      <Link href="/notes">
                        <span className="flex items-center gap-2 cursor-pointer w-full">
                          <LayoutList className="w-4 h-4" />
                          <span>All Notes</span>
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={location === "/weekly"}>
                      <Link href="/weekly">
                        <span className="flex items-center gap-2 cursor-pointer w-full">
                          <Calendar className="w-4 h-4" />
                          <span>Weekly Agenda</span>
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={location === "/quarterly"}>
                      <Link href="/quarterly">
                        <span className="flex items-center gap-2 cursor-pointer w-full">
                          <PieChart className="w-4 h-4" />
                          <span>Quarterly Summaries</span>
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 border-b border-border flex items-center px-4 lg:hidden">
            <SidebarTrigger />
            <span className="ml-4 font-semibold text-foreground">Command Center</span>
          </header>
          <main className="flex-1 overflow-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
