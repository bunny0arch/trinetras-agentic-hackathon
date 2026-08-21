import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import LegacyLanding, { CandidatePortal, RecruiterPortal } from "./pages/PlacementPortal";

function Router() {
  return <Switch>
    <Route path="/" component={LegacyLanding} />
    <Route path="/candidate" component={CandidatePortal} />
    <Route path="/recruiter" component={RecruiterPortal} />
    <Route>{() => <LegacyLanding />}</Route>
  </Switch>;
}

export default function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="dark"><TooltipProvider><Toaster /><Router /></TooltipProvider></ThemeProvider></ErrorBoundary>;
}
