import { useNavigate } from "react-router-dom";

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center px-6">
      {/* subtle grid pattern */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)", backgroundSize: "32px 32px" }} />

      <div className="relative text-center max-w-md">
        {/* 404 number */}
        <div className="text-[10rem] font-black leading-none text-white/5 select-none mb-2">404</div>

        {/* Icon */}
        <div className="w-16 h-16 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto mb-6 -mt-8">
          <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <div className="text-xs font-black uppercase tracking-widest text-emerald-400 mb-3">Page Not Found</div>
        <h1 className="text-3xl font-black mb-3">This page doesn't exist</h1>
        <p className="text-zinc-500 mb-8 leading-relaxed">
          The page you're looking for has been moved, deleted, or never existed. Let's get you back on track.
        </p>

        <div className="flex gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="px-5 py-3 rounded-xl font-bold border border-white/10 hover:bg-white/5 transition-all text-sm"
          >
            ← Go Back
          </button>
          <button
            onClick={() => navigate("/home")}
            className="px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-black rounded-xl font-black transition-all text-sm"
          >
            Dashboard
          </button>
          <button
            onClick={() => navigate("/")}
            className="px-5 py-3 rounded-xl font-bold border border-white/10 hover:bg-white/5 transition-all text-sm"
          >
            Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
