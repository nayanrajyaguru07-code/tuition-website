export default function Footer() {
  return (
    <footer className="mt-auto">
      <div className="mx-auto max-w-7xl px-4">
        <div className="rounded-t-2xl bg-gradient-to-r from-orange-500/90 to-red-500/90 backdrop-blur border border-orange-200 shadow-lg px-6 py-5 flex flex-col md:flex-row items-center justify-between text-white">
          {/* BRAND */}
          <div className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-white to-orange-100 bg-clip-text text-transparent">
            Hostel Manager
          </div>

          {/* COPYRIGHT */}
          <div className="text-sm text-white/90 mt-2 md:mt-0">
            © {new Date().getFullYear()} Hostel Manager. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
