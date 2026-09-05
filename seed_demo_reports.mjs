import postgres from "postgres";
import "dotenv/config";
import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";

const sql = postgres(process.env.DATABASE_URL, { prepare: false });

const businessId = randomUUID();
const locationId = randomUUID();
const slug = "glow-and-co-demo-" + Date.now().toString(36);

function daysAgo(n, hour, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, minute, 0, 0);
  return d;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function main() {
  await sql`
    insert into businesses (id, slug, name, email, phone, business_type, language, plan, plan_expires_at, referral_code, cancellation_policy, deposit_policy, onboarding_completed_at)
    values (${businessId}, ${slug}, 'Glow & Co. Salon', 'owner@glowandco.demo', '+94771112222', 'salon_barber', 'en', 'pro', now() + interval '30 days', ${slug}, 'Please contact us to cancel or reschedule.', 'A deposit is required to secure your booking.', now())
  `;

  await sql`
    insert into locations (id, business_id, name, slug, timezone, is_default, is_active, sort_order)
    values (${locationId}, ${businessId}, 'Glow & Co. Salon', 'main', 'Asia/Colombo', true, true, 0)
  `;

  const password = "DemoReports2026!";
  const passwordHash = await bcrypt.hash(password, 10);
  await sql`
    insert into users (id, business_id, name, email, password_hash, role)
    values (${randomUUID()}, ${businessId}, 'Demo Owner', 'owner@glowandco.demo', ${passwordHash}, 'owner')
  `;

  const staffNames = ["Amaya Fernando", "Nadeesha Perera", "Ishara Silva"];
  const staffIds = [];
  for (const name of staffNames) {
    const id = randomUUID();
    staffIds.push(id);
    await sql`
      insert into staff (id, business_id, name, bio, is_active)
      values (${id}, ${businessId}, ${name}, 'Senior stylist', true)
    `;
    await sql`insert into staff_locations (staff_id, location_id, is_primary) values (${id}, ${locationId}, true)`;
  }

  const serviceDefs = [
    { name: "Haircut & Style", duration: 45, price: 2500 },
    { name: "Hair Colour", duration: 90, price: 6000 },
    { name: "Facial Treatment", duration: 60, price: 3800 },
    { name: "Manicure", duration: 30, price: 1500 },
  ];
  const serviceIds = [];
  for (const s of serviceDefs) {
    const id = randomUUID();
    serviceIds.push({ id, price: s.price });
    await sql`
      insert into services (id, business_id, name, duration_minutes, price_lkr, description, requires_payment, deposit_percent, before_buffer, after_buffer, minimum_notice_hours)
      values (${id}, ${businessId}, ${s.name}, ${s.duration}, ${s.price}, ${s.name + " service"}, false, 0, 0, 0, 2)
    `;
    for (const staffId of staffIds) {
      await sql`insert into staff_services (staff_id, service_id) values (${staffId}, ${id})`;
    }
  }

  const clientFirstNames = ["Kavya", "Nimal", "Amali", "Tharindu", "Sanduni", "Ruwani", "Chamath", "Dilani", "Isuru", "Hiruni", "Kasun", "Nethmi", "Yasas", "Piumi", "Lahiru", "Sachini", "Roshan", "Vindya"];
  const clientLastNames = ["Senanayake", "Perera", "Fernando", "Jayasuriya", "Wickramasinghe", "Gunawardena", "Rathnayake", "Dissanayake", "Bandara", "Weerasinghe"];
  const clientIds = [];
  for (let i = 0; i < 20; i++) {
    const id = randomUUID();
    const name = `${pick(clientFirstNames)} ${pick(clientLastNames)}`;
    const phone = `+9477${(1000000 + i).toString().slice(-7)}`;
    clientIds.push({ id, name, phone });
    await sql`
      insert into clients (id, business_id, name, phone, stage, created_at)
      values (${id}, ${businessId}, ${name}, ${phone}, 'active', ${daysAgo(30 + i, 10)})
    `;
  }

  let bookingCount = 0;
  let paymentCount = 0;
  let reviewCount = 0;

  for (let dayOffset = 29; dayOffset >= 0; dayOffset--) {
    const dow = daysAgo(dayOffset, 0).getDay();
    const isWeekend = dow === 0 || dow === 6;
    const bookingsToday = isWeekend ? 5 + Math.floor(Math.random() * 3) : 2 + Math.floor(Math.random() * 3);

    for (let b = 0; b < bookingsToday; b++) {
      const hourPool = [9, 10, 11, 11, 12, 13, 14, 14, 15, 16, 16, 17];
      const hour = pick(hourPool);
      const minute = pick([0, 15, 30, 45]);
      const service = pick(serviceIds);
      const staffId = pick(staffIds);
      const client = pick(clientIds);
      const startsAt = daysAgo(dayOffset, hour, minute);
      const serviceDef = serviceDefs[serviceIds.findIndex((s) => s.id === service.id)];
      const endsAt = new Date(startsAt.getTime() + serviceDef.duration * 60000);

      const roll = Math.random();
      const status = roll < 0.84 ? "completed" : roll < 0.93 ? "cancelled" : "no_show";
      const bookingId = randomUUID();

      await sql`
        insert into bookings (id, business_id, service_id, staff_id, location_id, client_id, client_name, client_phone, starts_at, ends_at, status, source, created_at)
        values (${bookingId}, ${businessId}, ${service.id}, ${staffId}, ${locationId}, ${client.id}, ${client.name}, ${client.phone}, ${startsAt}, ${endsAt}, ${status}, ${pick(["public", "public", "public", "whatsapp", "instagram"])}, ${startsAt})
      `;
      bookingCount++;

      if (status === "completed") {
        await sql`
          insert into payments (id, booking_id, amount_lkr, provider, currency, status, created_at)
          values (${randomUUID()}, ${bookingId}, ${service.price}, 'payhere', 'LKR', 'success', ${startsAt})
        `;
        paymentCount++;

        if (Math.random() < 0.4) {
          const rating = Math.random() < 0.75 ? 5 : Math.random() < 0.7 ? 4 : 3;
          await sql`
            insert into reviews (id, business_id, booking_id, client_name, rating, comment, is_published, created_at)
            values (${randomUUID()}, ${businessId}, ${bookingId}, ${client.name}, ${rating}, ${pick([
              "Loved my new look!", "Great service as always.", "Friendly staff, will come back.", "Highly recommend Glow & Co.", "Quick and professional.", null,
            ])}, true, ${new Date(startsAt.getTime() + 3600000)})
          `;
          reviewCount++;
        }
      }
    }
  }

  console.log(JSON.stringify({ businessId, slug, email: "owner@glowandco.demo", password, loginUrl: "http://localhost:3002/auth/signin", staff: staffIds.length, services: serviceIds.length, clients: clientIds.length, bookings: bookingCount, payments: paymentCount, reviews: reviewCount }, null, 2));
  await sql.end();
}

main().catch(async (err) => {
  console.error(err);
  await sql.end();
  process.exit(1);
});
