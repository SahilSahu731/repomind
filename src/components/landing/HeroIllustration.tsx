const files = [
  { name: "src", indent: 0, kind: "folder" },
  { name: "app", indent: 1, kind: "folder" },
  { name: "api", indent: 2, kind: "folder" },
  { name: "route.ts", indent: 3, kind: "file" },
  { name: "components", indent: 1, kind: "folder" },
  { name: "RepositoryMap.tsx", indent: 2, kind: "file" },
];

export function HeroIllustration() {
  return (
    <div className="relative mx-auto w-full max-w-[39rem]" aria-label="Example RepoMind architecture analysis">
      <div className="absolute -left-8 top-8 h-28 w-28 rounded-full bg-[#d97757]/35 blur-3xl" />
      <div className="absolute -right-8 bottom-12 h-36 w-36 rounded-full bg-[#7b8f72]/30 blur-3xl" />

      <div className="relative overflow-hidden rounded-[1.75rem] border border-[#25231f] bg-[#22211d] text-[#f2efe7] shadow-[0_30px_90px_-42px_rgba(38,35,29,.65)]">
        <div className="flex items-center justify-between border-b border-white/12 px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#d97757]" />
            <span className="font-mono text-[10px] uppercase tracking-[.18em] text-[#aaa69b]">
              architecture / overview
            </span>
          </div>
          <span className="rounded-full border border-white/14 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[.12em] text-[#cdc8bc]">
            complete
          </span>
        </div>

        <div className="grid min-h-[30rem] md:grid-cols-[.86fr_1.4fr]">
          <div className="border-b border-white/12 p-5 md:border-b-0 md:border-r">
            <p className="font-mono text-[9px] uppercase tracking-[.18em] text-[#858176]">Repository tree</p>
            <div className="mt-5 space-y-3.5">
              {files.map((file) => (
                <div
                  key={`${file.indent}-${file.name}`}
                  className="flex items-center gap-2 font-mono text-[10px] text-[#cbc6ba]"
                  style={{ paddingLeft: `${file.indent * 12}px` }}
                >
                  <span className={file.kind === "folder" ? "text-[#d97757]" : "text-[#77746c]"}>
                    {file.kind === "folder" ? "◆" : "·"}
                  </span>
                  {file.name}
                </div>
              ))}
            </div>

            <div className="mt-8 border-t border-white/12 pt-5">
              <div className="flex items-end justify-between">
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-[.16em] text-[#858176]">Contribution score</p>
                  <p className="mt-1 font-serif text-4xl text-[#f2efe7]">84</p>
                </div>
                <span className="mb-1 text-xs text-[#9aaa91]">Strong</span>
              </div>
              <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-[84%] rounded-full bg-[#9aaa91]" />
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden p-5 sm:p-7">
            <div className="flex items-center justify-between">
              <p className="font-mono text-[9px] uppercase tracking-[.18em] text-[#858176]">System map</p>
              <span className="font-mono text-[9px] text-[#858176]">32 nodes · 61 edges</span>
            </div>

            <svg className="mt-6 h-56 w-full" viewBox="0 0 360 230" role="img" aria-label="Repository dependency graph">
              <g stroke="#77746c" strokeOpacity=".45" strokeWidth="1">
                <path d="M58 111 137 58 207 84 298 44" />
                <path d="M58 111 138 159 207 84 265 172" />
                <path d="M138 159 265 172 314 119 298 44" />
                <path d="M207 84 314 119" />
              </g>
              <g>
                <circle cx="58" cy="111" r="22" fill="#D97757" />
                <circle cx="137" cy="58" r="13" fill="#E8E3D8" />
                <circle cx="138" cy="159" r="17" fill="#9AAA91" />
                <circle cx="207" cy="84" r="27" fill="#E8E3D8" />
                <circle cx="265" cy="172" r="15" fill="#D97757" />
                <circle cx="298" cy="44" r="10" fill="#9AAA91" />
                <circle cx="314" cy="119" r="19" fill="#E8E3D8" />
              </g>
              <g fill="#22211d" fontFamily="ui-monospace, monospace" fontSize="7" textAnchor="middle">
                <text x="58" y="114">API</text>
                <text x="207" y="87">CORE</text>
                <text x="314" y="122">UI</text>
              </g>
            </svg>

            <div className="rounded-2xl border border-white/12 bg-white/[.035] p-4">
              <div className="flex gap-3">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#d97757]" />
                <div>
                  <p className="text-sm font-medium text-[#eeeae0]">Start with the request boundary</p>
                  <p className="mt-1.5 text-xs leading-5 text-[#aaa69b]">
                    Trace route handlers into the service layer, then review queue and persistence edges.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute -bottom-5 -left-3 hidden rounded-2xl border border-[#292721] bg-[#f7f3e8] px-4 py-3 shadow-xl sm:block">
        <p className="font-mono text-[9px] uppercase tracking-[.14em] text-[#777168]">Onboarding route</p>
        <p className="mt-1 text-sm font-medium text-[#292721]">7 steps generated</p>
      </div>
    </div>
  );
}
