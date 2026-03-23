import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SalesProvider } from "@/store/SalesContext";
import { initDb, getDb, writeDb } from "@/lib/db";
import Login from "./pages/Login.tsx";
import Index from "./pages/Index.tsx";
import Settings from "./pages/Settings.tsx";
import Reports from "./pages/Reports.tsx";
import FullTable from "./pages/FullTable.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => {
  const [authenticated, setAuthenticated] = useState(false);
  const [dbInitialized, setDbInitialized] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      await initDb();
      const db = getDb();
      setAuthenticated(db.data.auth.authenticated || false);
      setDbInitialized(true);
    };
    initializeApp();
  }, []);

  const handleLogin = () => {
    const db = getDb();
    db.data.auth.authenticated = true;
    writeDb();
    setAuthenticated(true);
  };

  if (!dbInitialized) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

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
