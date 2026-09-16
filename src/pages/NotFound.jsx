import { Link } from "react-router-dom";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="mx-auto grid min-h-[60vh] max-w-7xl place-items-center px-4 text-center">
      <div>
        <h1 className="text-7xl font-black text-brand">404</h1>
        <p className="mt-3 text-lg">This page got isekai'd somewhere else.</p>
        <Link to="/" className="btn-brand mt-6">
          <Home className="h-4 w-4" /> Back home
        </Link>
      </div>
    </div>
  );
}
