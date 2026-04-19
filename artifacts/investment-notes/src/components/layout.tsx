import { Link, useLocation } from "wouter";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Plus, LayoutList, Calendar, PieChart, Building2, ChevronDown } from "lucide-react";
import { useListUsers } from "@workspace/api-client-react";
import { useActiveUser } from "@/contexts/user-context";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { RoleBadge } from "@/components/badges";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { activeUser, setActiveUser } = useActiveUser();
  const { data: users } = useListUsers();

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
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={location === "/companies"}>
                      <Link href="/companies">
                        <span className="flex items-center gap-2 cursor-pointer w-full">
                          <Building2 className="w-4 h-4" />
                          <span>Companies</span>
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          {/* Active user switcher at the bottom */}
          <div className="mt-auto p-4 border-t border-sidebar-border">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Acting as
            </p>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-md bg-sidebar-accent hover:bg-sidebar-accent/80 transition-colors text-left">
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-sm font-medium text-sidebar-foreground truncate">
                      {activeUser?.fullName ?? "Select user..."}
                    </span>
                    {activeUser?.role && (
                      <RoleBadge role={activeUser.role} />
                    )}
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-52">
                <DropdownMenuLabel className="text-xs text-muted-foreground">Switch user</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {users?.map(u => (
                  <DropdownMenuItem
                    key={u.id}
                    className={`flex flex-col items-start gap-0.5 cursor-pointer ${activeUser?.id === u.id ? "bg-accent" : ""}`}
                    onClick={() => setActiveUser({ id: u.id, fullName: u.fullName, role: u.role })}
                  >
                    <span className="font-medium text-sm">{u.fullName}</span>
                    <RoleBadge role={u.role} />
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </Sidebar>

        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 border-b border-border flex items-center px-4 lg:hidden">
            <SidebarTrigger />
            <span className="ml-4 font-semibold text-foreground">Investment Notes App</span>
          </header>
          <main className="flex-1 overflow-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
