import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import CallFloat from "./CallFloat";
import AgentChat from "./AgentChat";
import ScrollProgress from "./ScrollProgress";

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <ScrollProgress />
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <CallFloat />
      <AgentChat />
    </div>
  );
}