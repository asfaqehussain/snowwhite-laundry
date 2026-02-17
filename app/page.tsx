import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 h-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between relative">

          {/* Mobile Menu Button Placeholder (Left) */}
          <div className="w-24 md:w-32 flex justify-start">
            {/* Optional: <button className="p-2 text-slate-600"><MenuIcon /></button> */}
          </div>

          {/* Centered Logo */}
          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group cursor-pointer w-full max-w-[60%] sm:max-w-none">
            <span className="text-[10px] leading-tight sm:text-base md:text-lg font-extrabold tracking-widest sm:tracking-[0.15em] text-slate-900 uppercase text-center drop-shadow-sm">
              Snow White Washing
            </span>
          </div>

          {/* Right: Login Button */}
          <div className="w-24 md:w-32 flex justify-end">
            <Link
              href="/login"
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-full transition-all shadow-md hover:shadow-lg flex items-center gap-2 whitespace-nowrap"
            >
              <span>Login</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow ">

        {/* Hero Section */}
        <div className="relative isolate px-6 pt-4 lg:px-8 bg-slate-50 overflow-hidden">
          {/* Abstract Background Elements */}
          <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80 pointer-events-none" aria-hidden="true">
            <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-brand-200 to-indigo-200 opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" style={{ clipPath: "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)" }}></div>
          </div>

          <div className="mx-auto max-w-2xl py-20 sm:py-32 lg:py-40 text-center">
            <div className="flex justify-center mb-8">
              <div className="h-64 w-64 relative drop-shadow-2xl filter hover:scale-105 transition-transform duration-500">
                <img
                  src="/logo.png"
                  alt="Snow White Washing Company"
                  className="object-contain w-full h-full"
                />
              </div>
            </div>
            <div className="hidden sm:mb-8 sm:flex sm:justify-center">
              <div className="relative rounded-full px-3 py-1 text-sm leading-6 text-slate-600 ring-1 ring-slate-900/10 hover:ring-slate-900/20">
                Serving you since 1952. <a href="#about" className="font-semibold text-brand-600"><span className="absolute inset-0" aria-hidden="true"></span>Read more <span aria-hidden="true">&rarr;</span></a>
              </div>
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl font-heading">
              Premium Laundry Services in Abu
            </h1>
            <p className="mt-6 text-lg leading-8 text-slate-600">
              Experience the difference with Snow White Washing Company. We provide top-tier wash & fold, dry cleaning, and stain removal services with fast pickup and delivery.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <a href="#services" className="rounded-md bg-brand-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 transition-colors">
                Our Services
              </a>
              <a href="#contact" className="text-sm font-semibold leading-6 text-slate-900">
                Contact Us <span aria-hidden="true">→</span>
              </a>
            </div>
          </div>

          <div className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)] pointer-events-none" aria-hidden="true">
            <div className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-[#ff80b5] to-brand-300 opacity-20 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]" style={{ clipPath: "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)" }}></div>
          </div>
        </div>

        {/* Features / Services Grid */}
        <section id="services" className="py-24 bg-white sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl lg:text-center">
              <h2 className="text-base font-semibold leading-7 text-brand-600">Faster, Cleaner, Better</h2>
              <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Everything you need for your clothes</p>
              <p className="mt-6 text-lg leading-8 text-slate-600">
                We handle your garments with the utmost care, using eco-friendly products and state-of-the-art equipment.
              </p>
            </div>
            <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
              <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
                {/* Service 1 */}
                <div className="relative pl-16">
                  <dt className="text-base font-semibold leading-7 text-slate-900">
                    <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600">
                      <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                      </svg>
                    </div>
                    Wash & Fold
                  </dt>
                  <dd className="mt-2 text-base leading-7 text-slate-600">Perfect for your daily laundry needs. We wash, dry, and neatly fold your clothes.</dd>
                </div>
                {/* Service 2 */}
                <div className="relative pl-16">
                  <dt className="text-base font-semibold leading-7 text-slate-900">
                    <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600">
                      <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                      </svg>
                    </div>
                    Dry Cleaning
                  </dt>
                  <dd className="mt-2 text-base leading-7 text-slate-600">Special care for your delicate fabrics. We use premium solvents to keep them looking new.</dd>
                </div>
                {/* Service 3 */}
                <div className="relative pl-16">
                  <dt className="text-base font-semibold leading-7 text-slate-900">
                    <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600">
                      <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    Fast Pickup & Delivery
                  </dt>
                  <dd className="mt-2 text-base leading-7 text-slate-600">Schedule a pickup and let us handle the rest. We deliver your clean clothes right to your door.</dd>
                </div>
                {/* Service 4 */}
                <div className="relative pl-16">
                  <dt className="text-base font-semibold leading-7 text-slate-900">
                    <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600">
                      <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zm-7.518-.267A8.25 8.25 0 1120.25 10.5M8.288 14.212A5.25 5.25 0 1117.25 10.5" />
                      </svg>
                    </div>
                    Stain Removal
                  </dt>
                  <dd className="mt-2 text-base leading-7 text-slate-600">Tough stains are no match for our experts. We treat every spot with precision.</dd>
                </div>
              </dl>
            </div>
          </div>
        </section>

        {/* CTA / Contact Section */}
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
              className="rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-900 shadow-sm hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white mt-4"
            >
              Get Started by Logging In
            </Link>
          </div>
          <svg viewBox="0 0 1024 1024" className="absolute left-1/2 top-1/2 -z-10 h-[64rem] w-[64rem] -translate-x-1/2 [mask-image:radial-gradient(closest-side,white,transparent)]" aria-hidden="true">
            <circle cx="512" cy="512" r="512" fill="url(#gradient)" fillOpacity="0.7"></circle>
            <defs>
              <radialGradient id="gradient">
                <stop stopColor="#7775D6"></stop>
                <stop offset="1" stopColor="#E935C1"></stop>
              </radialGradient>
            </defs>
          </svg>
        </section>

      </main>

      {/* Footer */}
      <footer className="bg-white">
        <div className="mx-auto max-w-7xl px-6 py-12 md:flex md:items-center md:justify-between lg:px-8">
          <div className="flex justify-center space-x-6 md:order-2">
            {/* Social icons or links could go here */}
          </div>
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
