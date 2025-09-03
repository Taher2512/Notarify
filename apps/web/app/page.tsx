"use client";

import { useState, useEffect } from "react";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import { LoginResponse, Notary } from "./types";

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [notary, setNotary] = useState<Notary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const storedNotary = localStorage.getItem("notary");

    if (token && storedNotary) {
      try {
        const parsedNotary = JSON.parse(storedNotary);
        setNotary(parsedNotary);
        setIsAuthenticated(true);
      } catch (error) {
        localStorage.removeItem("authToken");
        localStorage.removeItem("notary");
      }
    }
    setLoading(false);
  }, []);

  const handleLogin = (data: LoginResponse) => {
    setNotary(data.notary);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setNotary(null);
    setIsAuthenticated(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated || !notary) {
    return <Login onLogin={handleLogin} />;
  }

  return <Dashboard notary={notary} onLogout={handleLogout} />;
}
