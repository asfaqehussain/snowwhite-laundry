import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
      {/* Abstract Background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[20%] w-[50vw] h-[50vw] bg-brand-200/30 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-20%] right-[20%] w-[50vw] h-[50vw] bg-indigo-200/30 rounded-full blur-[100px]" />
      </div>

      <div className="bg-white/80 backdrop-blur-xl p-10 md:p-14 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] max-w-xl w-full border border-white/50 relative z-10">
        <div className="mx-auto h-28 w-28 relative mb-8 transition-transform hover:scale-105 duration-500">
          <img
            src="/logo.png"
            alt="Snow White Washing Company"
            className="object-contain w-full h-full drop-shadow-md"
          />
        </div>

        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight font-heading mb-2">
          Snow White
        </h1>
        <p className="text-xl md:text-2xl text-brand-600 font-semibold tracking-wide">
          Washing Company
        </p>
        <p className="text-xs font-bold tracking-[0.2em] text-slate-400 mt-3 mb-10 text-center uppercase">
          Since 1952
        </p>

        <div className="space-y-4 mb-10 text-left bg-slate-50/80 p-6 rounded-2xl border border-slate-100">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200 pb-3 mb-4">Premium Services</h3>
          <ul className="grid grid-cols-2 gap-3 text-sm font-medium text-slate-600">
            <li className="flex items-center"><span className="text-brand-500 mr-2">✔</span> Wash & Fold</li>
            <li className="flex items-center"><span className="text-brand-500 mr-2">✔</span> Dry Cleaning</li>
            <li className="flex items-center"><span className="text-brand-500 mr-2">✔</span> Fast Pickup</li>
            <li className="flex items-center"><span className="text-brand-500 mr-2">✔</span> Stain Removal</li>
          </ul>
        </div>

        <Link
          href="/login"
          className="group block w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl transition-all shadow-xl shadow-slate-900/20 hover:shadow-2xl hover:shadow-slate-900/30 text-lg flex items-center justify-center"
        >
          Login to System
          <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
        </Link>

        <div className="mt-10 text-xs text-slate-400 space-y-1">
          <p className="font-medium text-slate-500">The Laundry Expert In Your Abu</p>
          <p>Contact: +91 7062 133 131</p>
        </div>
      </div>
    </div>
  );
}
