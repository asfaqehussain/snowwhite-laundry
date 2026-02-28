import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans">

      {/* ─── iOS 26 Liquid Glass Navbar ─── */}
      <header className="fixed top-5 left-1/2 -translate-x-1/2 z-50 w-full max-w-4xl px-4">
        <nav
          className="
            flex items-center justify-between
            px-5 py-3
            rounded-[28px]
            border border-white/40
            shadow-[0_8px_32px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.6)]
          "
          style={{
            background: "rgba(255,255,255,0.55)",
            backdropFilter: "blur(28px) saturate(180%)",
            WebkitBackdropFilter: "blur(28px) saturate(180%)",
          }}
        >
          {/* Brand Name */}
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center shadow-inner"
              style={{ background: "linear-gradient(135deg,#0ea5e9,#0369a1)" }}
            >
              {/* Tiny snowflake icon */}
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l1.5 3.5L17 4.5l-2 3 3.5 1.5L15 12l3.5 1.5L16 17l-4-1.5L10 17l-2.5-1.5L4 20 9 18.5l-1 3.5 3.5-2.5L12 22l1.5-2.5L17 22l-1-3.5L21 20l-3.5-4.5-2.5 1.5-2-1.5-4 1.5L4.5 10.5l3.5-1.5-2-3 3.5 1L12 2z" />
              </svg>
            </div>
            <span className="text-sm font-bold tracking-tight text-slate-800 hidden sm:block">
              Snow White Washing
            </span>
          </div>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            <a
              href="#services"
              className="text-sm font-medium text-slate-600 hover:text-slate-900 px-4 py-1.5 rounded-full hover:bg-white/60 transition-all duration-200"
            >
              Services
            </a>
            <a
              href="#contact"
              className="text-sm font-medium text-slate-600 hover:text-slate-900 px-4 py-1.5 rounded-full hover:bg-white/60 transition-all duration-200"
            >
              Contact
            </a>
          </div>

          {/* Login Button  */}
          <Link
            href="/login"
            className="
              flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white
              rounded-full shadow-md transition-all duration-200
              hover:shadow-lg hover:scale-105 active:scale-95
            "
            style={{
              background: "linear-gradient(135deg,#0ea5e9 0%,#0369a1 100%)",
              boxShadow: "0 2px 12px rgba(14,165,233,0.4),inset 0 1px 0 rgba(255,255,255,0.25)",
            }}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
            Login
          </Link>
        </nav>
      </header>

      {/* ─── Main Content ─── */}
      <main className="flex-grow">

        {/* ─── Hero Section ─── */}
        <section className="relative isolate overflow-hidden bg-gradient-to-br from-slate-50 via-white to-sky-50 min-h-screen flex items-center">

          {/* Background blobs */}
          <div
            className="pointer-events-none absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full opacity-20 -z-10"
            style={{ background: "radial-gradient(circle, #bae6fd 0%, transparent 70%)", filter: "blur(60px)" }}
          />
          <div
            className="pointer-events-none absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full opacity-15 -z-10"
            style={{ background: "radial-gradient(circle, #93c5fd 0%, transparent 70%)", filter: "blur(80px)" }}
          />

          <div className="mx-auto max-w-7xl px-6 lg:px-12 pt-32 pb-20 w-full">
            {/* Split layout: Logo LEFT | Text RIGHT */}
            <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">

              {/* LEFT — Logo (no box, full size) */}
              <div className="flex-shrink-0 flex flex-col items-center">
                <img
                  src="/logo.png"
                  alt="Snow White Washing Company Logo"
                  className="w-64 h-64 sm:w-80 sm:h-80 lg:w-96 lg:h-96 object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-500"
                />

                {/* Pill badge — centered */}
                <div
                  className="mt-6 flex items-center justify-center gap-2 px-4 py-2 rounded-full text-xs font-semibold text-sky-700"
                  style={{
                    background: "rgba(186,230,253,0.4)",
                    border: "1px solid rgba(14,165,233,0.25)",
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                  }}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
                  Serving Abu Road Since 1952
                </div>
              </div>

              {/* RIGHT — Content */}
              <div className="flex-1 text-center lg:text-left">
                <div
                  className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold text-sky-700 mb-6"
                  style={{
                    background: "rgba(186,230,253,0.35)",
                    border: "1px solid rgba(14,165,233,0.2)",
                    backdropFilter: "blur(8px)",
                  }}
                >
                  <svg className="w-3.5 h-3.5 text-sky-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                  </svg>
                  Abu Road&apos;s #1 Laundry Service
                </div>

                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.05] text-slate-900">
                  Premium{" "}
                  <span
                    className="bg-clip-text text-transparent"
                    style={{ backgroundImage: "linear-gradient(135deg,#0ea5e9 0%,#0369a1 100%)" }}
                  >
                    Laundry
                  </span>
                  <br />
                  Services
                </h1>

                <p className="mt-6 text-lg leading-8 text-slate-500 max-w-xl mx-auto lg:mx-0">
                  Experience the difference with Snow White Washing Company. We provide
                  top-tier wash &amp; fold, dry cleaning, and stain removal with fast
                  pickup &amp; delivery right to your door.
                </p>

                {/* CTA Buttons */}
                <div className="mt-10 flex flex-wrap items-center gap-4 justify-center lg:justify-start">
                  <a
                    href="#services"
                    className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full text-sm font-bold text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95"
                    style={{ background: "linear-gradient(135deg,#0ea5e9 0%,#0369a1 100%)", boxShadow: "0 4px 20px rgba(14,165,233,0.35)" }}
                  >
                    Explore Services
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </a>
                  <a
                    href="#contact"
                    className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-bold text-slate-700 transition-all duration-200 hover:bg-slate-100"
                    style={{ border: "1.5px solid rgba(15,23,42,0.12)" }}
                  >
                    Contact Us
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </a>
                </div>

                {/* Stats Row */}
                <div className="mt-14 flex flex-wrap gap-8 justify-center lg:justify-start">
                  {[
                    { value: "70+", label: "Years of Trust" },
                    { value: "5K+", label: "Happy Clients" },
                    { value: "99%", label: "Satisfaction Rate" },
                  ].map((stat) => (
                    <div key={stat.label} className="text-center lg:text-left">
                      <p className="text-3xl font-extrabold text-slate-900">{stat.value}</p>
                      <p className="text-sm text-slate-500 mt-0.5">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Services Section ─── */}
        <section id="services" className="py-24 bg-white sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl lg:text-center">
              <h2 className="text-base font-semibold leading-7 text-sky-600">Faster, Cleaner, Better</h2>
              <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Everything you need for your clothes
              </p>
              <p className="mt-6 text-lg leading-8 text-slate-600">
                We handle your garments with the utmost care, using eco-friendly products and state-of-the-art equipment.
              </p>
            </div>
            <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
              <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
                {[
                  {
                    icon: "M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z",
                    title: "Wash & Fold",
                    desc: "Perfect for your daily laundry needs. We wash, dry, and neatly fold your clothes.",
                  },
                  {
                    icon: "M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z",
                    title: "Dry Cleaning",
                    desc: "Special care for your delicate fabrics. We use premium solvents to keep them looking new.",
                  },
                  {
                    icon: "M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z",
                    title: "Fast Pickup & Delivery",
                    desc: "Schedule a pickup and let us handle the rest. We deliver your clean clothes right to your door.",
                  },
                  {
                    icon: "M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zm-7.518-.267A8.25 8.25 0 1120.25 10.5M8.288 14.212A5.25 5.25 0 1117.25 10.5",
                    title: "Stain Removal",
                    desc: "Tough stains are no match for our experts. We treat every spot with precision.",
                  },
                ].map((service) => (
                  <div key={service.title} className="relative pl-16 group">
                    <dt className="text-base font-semibold leading-7 text-slate-900">
                      <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-xl bg-sky-600 group-hover:bg-sky-500 transition-colors shadow-md">
                        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d={service.icon} />
                        </svg>
                      </div>
                      {service.title}
                    </dt>
                    <dd className="mt-2 text-base leading-7 text-slate-600">{service.desc}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </section>

        {/* ─── CTA / Contact Section ─── */}
        <section id="contact" className="relative isolate overflow-hidden bg-slate-900 px-6 py-24 shadow-2xl sm:px-24 xl:py-32">
          <h2 className="mx-auto max-w-2xl text-center text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Get your laundry done today.
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-center text-lg leading-8 text-slate-300">
            Contact the laundry experts in Abu Road.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-y-4 text-center">
            <div className="text-2xl font-semibold text-white">+91 7062 133 131</div>
            <div className="text-slate-400">Since 1952</div>
            <Link
              href="/login"
              className="rounded-full bg-white px-7 py-3 text-sm font-semibold text-slate-900 shadow-sm hover:bg-slate-100 transition-all mt-4 hover:scale-105"
            >
              Get Started by Logging In
            </Link>
          </div>
          <svg viewBox="0 0 1024 1024" className="absolute left-1/2 top-1/2 -z-10 h-[64rem] w-[64rem] -translate-x-1/2 [mask-image:radial-gradient(closest-side,white,transparent)]" aria-hidden="true">
            <circle cx="512" cy="512" r="512" fill="url(#gradient2)" fillOpacity="0.7" />
            <defs>
              <radialGradient id="gradient2">
                <stop stopColor="#0ea5e9" />
                <stop offset="1" stopColor="#0369a1" />
              </radialGradient>
            </defs>
          </svg>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white">
        <div className="mx-auto max-w-7xl px-6 py-12 md:flex md:items-center md:justify-between lg:px-8">
          <div className="flex justify-center space-x-6 md:order-2" />
          <div className="mt-8 md:order-1 md:mt-0">
            <p className="text-center text-xs leading-5 text-slate-500">
              &copy; 2026 Snow White Washing Company. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
