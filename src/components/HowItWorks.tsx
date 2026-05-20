import { Orbit } from "@/components/Orbit";

/** Dinaya logo mark — the spiral/link icon used across the brand */
function DinayaMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="255 285 960 920"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M 819.949219 499.695312 L 563.980469 755.773438 C 513.210938 806.554688 513.210938 889.15625 563.980469 939.941406 C 614.75 990.777344 697.378906 990.726562 748.09375 939.941406 L 966.117188 721.851562 C 982.484375 705.480469 982.484375 678.953125 966.117188 662.582031 C 949.75 646.207031 923.230469 646.207031 906.863281 662.582031 L 688.84375 880.671875 C 670.753906 898.707031 641.375 898.761719 623.234375 880.671875 C 605.144531 862.578125 605.144531 833.132812 623.234375 815.042969 L 879.203125 558.96875 C 931.742188 506.464844 1017.1875 506.464844 1069.671875 558.96875 C 1095.097656 584.425781 1109.117188 618.265625 1109.117188 654.257812 C 1109.117188 690.226562 1095.097656 724.0625 1069.671875 749.523438 L 782.496094 1036.789062 C 740.375 1078.921875 684.367188 1102.117188 624.816406 1102.117188 C 565.261719 1102.117188 509.285156 1078.921875 467.164062 1036.789062 C 380.222656 949.820312 380.222656 808.328125 467.164062 721.359375 L 797.144531 391.253906 C 813.511719 374.878906 813.511719 348.355469 797.144531 331.980469 C 780.773438 315.609375 754.257812 315.609375 737.890625 331.980469 L 407.910156 662.089844 C 288.285156 781.722656 288.285156 976.425781 407.910156 1096.058594 C 465.828125 1154.019531 542.867188 1185.945312 624.816406 1185.945312 C 706.765625 1185.945312 783.804688 1154.019531 841.746094 1096.058594 L 1128.925781 808.792969 C 1214.121094 723.570312 1214.121094 584.917969 1128.925781 499.695312 C 1043.78125 414.558594 905.144531 414.445312 819.949219 499.695312 Z"
        fill="#2563EB"
      />
    </svg>
  );
}

/** Individual orbit node */
function OrbitNode({
  icon,
  badgeBg,
  badgeIcon,
  badgeLabel,
  pingDelay,
}: {
  icon: string;
  badgeBg: string;
  badgeIcon: string;
  badgeLabel: string;
  pingDelay: string;
}) {
  return (
    <div className="relative flex items-center justify-center">
      {/* Icon + white circle */}
      <i className={`bi ${icon} z-10 text-[18px] text-gray-800`} />
      <div className="absolute size-10 rounded-full bg-white/60 ring-1 shadow-lg ring-black/5" />

      {/* Status badge */}
      <div className="absolute -top-5 left-4">
        <div className="flex gap-0.5">
          <div
            className={`flex items-center justify-center rounded-l-full ${badgeBg} p-1 ring-1 ring-gray-200`}
          >
            <i className={`bi ${badgeIcon} text-[9px] text-white`} />
          </div>
          <div className="rounded-r-full bg-white/70 py-0.5 pr-1.5 pl-1 text-[11px] whitespace-nowrap ring-1 ring-gray-200 text-gray-700 font-medium">
            {badgeLabel}
          </div>
        </div>
      </div>

      {/* Ping ring */}
      <div
        className="absolute size-10 animate-[ping_7s_ease_infinite] rounded-full ring-1 ring-blue-500/40"
        style={{ animationDelay: pingDelay }}
      />
    </div>
  );
}

export function HowItWorks() {
  return (
    <section className="border-t">
      <div className="max-w-6xl mx-auto px-6 py-20 grid grid-cols-1 gap-12 md:grid-cols-2 md:gap-0">

        {/* Left — text */}
        <div className="my-auto px-2 md:pr-12">
          <h2 className="relative text-sm font-semibold tracking-tight text-primary mb-3">
            <span className="absolute top-0.5 -left-3 h-4 w-[3px] rounded-r-sm bg-primary" />
            How it works
          </h2>
          <p className="font-cal text-3xl md:text-4xl tracking-tight text-balance text-gray-900">
            Your entire booking workflow, automated
          </p>
          <p className="mt-4 text-gray-500 text-balance leading-relaxed">
            From the moment a client picks a time to the final review request
            — Dinaya handles every step. No back-and-forth messages,
            no missed bookings, no chasing payments.
          </p>

          {/* Step legend */}
          <ol className="mt-8 space-y-3">
            {[
              { icon: "bi-phone",        label: "Client books on your page",        color: "bg-blue-600" },
              { icon: "bi-credit-card",  label: "Payment collected automatically",  color: "bg-green-500" },
              { icon: "bi-bell",         label: "You get an instant notification",  color: "bg-blue-600" },
              { icon: "bi-check-circle", label: "Appointment confirmed",            color: "bg-emerald-500" },
              { icon: "bi-star",         label: "Review request sent after visit",  color: "bg-amber-500" },
            ].map(({ icon, label, color }, i) => (
              <li key={i} className="flex items-center gap-3 text-sm text-gray-600">
                <span className={`flex size-6 shrink-0 items-center justify-center rounded-full ${color}`}>
                  <i className={`bi ${icon} text-[10px] text-white`} />
                </span>
                {label}
              </li>
            ))}
          </ol>
        </div>

        {/* Right — orbit diagram */}
        <div className="relative flex items-center justify-center overflow-hidden">
          <div className="pointer-events-none py-16 select-none">
            <Orbit
              durationSeconds={40}
              radiusPx={148}
              keepUpright
              defaultObjectSize={40}
              orbitingObjects={[
                /* 1 — Client books */
                <OrbitNode
                  key="books"
                  icon="bi-phone"
                  badgeBg="bg-blue-600"
                  badgeIcon="bi-phone"
                  badgeLabel="New booking!"
                  pingDelay="0s"
                />,
                /* 2 — Payment received */
                <OrbitNode
                  key="payment"
                  icon="bi-credit-card"
                  badgeBg="bg-green-500"
                  badgeIcon="bi-check"
                  badgeLabel="Rs. 2,500 paid"
                  pingDelay="2s"
                />,
                /* 3 — You're notified */
                <OrbitNode
                  key="notify"
                  icon="bi-bell"
                  badgeBg="bg-blue-600"
                  badgeIcon="bi-bell"
                  badgeLabel="You're notified"
                  pingDelay="4s"
                />,
                /* 4 — Confirmed */
                <OrbitNode
                  key="confirmed"
                  icon="bi-check-circle"
                  badgeBg="bg-emerald-500"
                  badgeIcon="bi-check-lg"
                  badgeLabel="Confirmed"
                  pingDelay="6s"
                />,
                /* 5 — Review sent */
                <OrbitNode
                  key="review"
                  icon="bi-star"
                  badgeBg="bg-amber-500"
                  badgeIcon="bi-star"
                  badgeLabel="Review sent"
                  pingDelay="1s"
                />,
              ]}
            >
              {/* Centre — Dinaya mark */}
              <div className="relative flex items-center justify-center">
                <div className="rounded-full p-1 ring-1 ring-black/10">
                  <div className="relative z-10 flex size-20 items-center justify-center rounded-full bg-white ring-1 shadow-[inset_0px_-15px_20px_rgba(0,0,0,0.08),0_7px_10px_0_rgba(0,0,0,0.12)] ring-black/15">
                    <DinayaMark className="size-10" />
                  </div>
                  {/* Spinning cobalt glow */}
                  <div className="absolute inset-12 animate-[spin_8s_linear_infinite] rounded-full bg-gradient-to-t from-transparent via-blue-400 to-transparent blur-lg opacity-60" />
                </div>
              </div>
            </Orbit>
          </div>
        </div>

      </div>
    </section>
  );
}
