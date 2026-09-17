import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import ErrorBoundary from "@/components/ErrorBoundary";

export default function Shell() {
  return (
    <div className="flex min-h-screen flex-col bg-surface-darker">
      <Navbar />
      <main className="flex-1">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
      <Footer />
    </div>
  );
}
