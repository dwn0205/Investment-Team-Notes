import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/layout";
import { UserProvider } from "@/contexts/user-context";
import NotFound from "@/pages/not-found";
import NotesPage from "@/pages/notes";
import NewNotePage from "@/pages/notes/new";
import WeeklyPage from "@/pages/weekly";
import QuarterlyPage from "@/pages/quarterly";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,
      refetchOnMount: true,
      refetchOnWindowFocus: true,
    },
  },
});

function Router() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={() => <Redirect to="/notes" />} />
        <Route path="/notes" component={NotesPage} />
        <Route path="/notes/new" component={NewNotePage} />
        <Route path="/weekly" component={WeeklyPage} />
        <Route path="/quarterly" component={QuarterlyPage} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <UserProvider>
            <Router />
            <Toaster />
          </UserProvider>
        </WouterRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
