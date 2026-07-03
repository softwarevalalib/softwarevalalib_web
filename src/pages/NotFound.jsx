import React from "react";
import { Link } from "react-router-dom";

function NotFound() {
  return (
    <div className="mx-auto my-20 max-w-xl rounded-3xl border border-slate-200 bg-slate-50 p-10 text-center shadow-lg">
      <h1 className="text-4xl font-bold text-slate-900">Ooops chief! 😢</h1>
      <p className="mt-4 text-slate-600">
        The page you are trying to reach was not found. Click the button below
        to return home.
      </p>
      <Link
        to="/"
        className="mt-8 inline-flex rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
      >
        Go Back Please 😌
      </Link>
    </div>
  );
}

export default NotFound;
