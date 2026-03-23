import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SalesProvider } from "@/store/SalesContext";
import Login from "./pages/Login.tsx";
import Index from "./pages/Index.tsx";
import Settings from "./pages/Settings.tsx";
import Reports from "./pages/Reports.tsx";
import FullTable from "./pages/FullTable.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();
const AUTH_KEY = "vst_authenticated";

const App = () => {
  const [authenticated, setAuthenticated] = useState(
    () => sessionStorage.getItem(AUTH_KEY) === "true"
  );

  const handleLogin = () => {
    sessionStorage.setItem(AUTH_KEY, "true");
    setAuthenticated(true);
  };

  if (!authenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SalesProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/full-table" element={<FullTable />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </SalesProvider>
    </QueryClientProvider>
  );
};

export default App;
