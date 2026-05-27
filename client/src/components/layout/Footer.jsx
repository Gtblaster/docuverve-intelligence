export default function Footer() {
  return (
    <footer className="border-t border-white/5 py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-docuverve-500 to-purple-600 flex items-center justify-center">
              <span className="text-white text-xs font-black">V</span>
            </div>
            <span className="text-sm text-white/40">
              DocuVerve Intelligence &copy; {new Date().getFullYear()}
            </span>
          </div>

          {/* Privacy badge */}
          <div className="flex items-center gap-2 text-xs text-white/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            In-memory processing · No server storage · Privacy-first
          </div>
        </div>
      </div>
    </footer>
  );
}
