import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b px-6 py-4 flex items-center justify-between max-w-6xl mx-auto">
        <span className="font-bold text-xl text-primary">Dinaya.lk</span>
        <div className="flex gap-4">
          <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground">
            Log in
          </Link>
          <Link
            href="/register"
            className="text-sm bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90"
          >
            Get started free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 py-24 text-center">
        <h1 className="text-5xl font-bold tracking-tight mb-6">
          Your business, bookable online.
          <br />
          <span className="text-primary">No WhatsApp chaos.</span>
        </h1>
        <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
          Give your salon, clinic, or tuition class a free booking page. Clients
          pick a time, pay online, and you get notified. Takes 5 minutes to set up.
        </p>
        <Link
          href="/register"
          className="inline-block bg-primary text-primary-foreground px-8 py-4 rounded-lg text-lg font-medium hover:bg-primary/90"
        >
          Create your booking page →
        </Link>
        <p className="text-sm text-muted-foreground mt-4">Free forever. No credit card needed.</p>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-16 grid md:grid-cols-3 gap-8">
        {[
          {
            icon: "📅",
            title: "Self-booking page",
            desc: "Your own link at yourname.dinaya.lk. Clients book 24/7 without calling you.",
          },
          {
            icon: "💳",
            title: "Online payments",
            desc: "Accept deposits or full payment via PayHere. Eliminate no-shows instantly.",
          },
          {
            icon: "📊",
            title: "Simple dashboard",
            desc: "See all your bookings in one place. Cancel, reschedule, and track revenue.",
          },
        ].map((f) => (
          <div key={f.title} className="p-6 border rounded-xl">
            <div className="text-3xl mb-3">{f.icon}</div>
            <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
            <p className="text-muted-foreground text-sm">{f.desc}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
