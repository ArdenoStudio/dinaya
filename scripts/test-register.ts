import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

async function testRegister() {
  const slug = `test-full-reg-${Date.now().toString(36)}`;
  const email = `${slug}@test.local`;

  try {
    const [biz] = await sql`
      INSERT INTO businesses (slug, name, email, business_type, language, cancellation_policy, deposit_policy)
      VALUES (${slug}, 'Test Biz', ${email}, 'other', 'en', 'Cancel early.', 'Deposit required.')
      RETURNING id
    `;
    console.log("Business:", biz.id);

    await sql`
      INSERT INTO users (business_id, name, email, password_hash, role)
      VALUES (${biz.id}, 'Test User', ${email}, 'fakehash', 'owner')
    `;
    console.log("User ok");

    const [stf] = await sql`
      INSERT INTO staff (business_id, name, bio, is_active)
      VALUES (${biz.id}, 'Test User', 'Owner', true)
      RETURNING id
    `;
    console.log("Staff:", stf.id);

    const [svc] = await sql`
      INSERT INTO services (business_id, name, duration_minutes, price_lkr, description, requires_payment, deposit_percent, before_buffer, after_buffer, minimum_notice_hours)
      VALUES (${biz.id}, 'Consultation', 30, 0, 'Test', false, 0, 0, 0, 2)
      RETURNING id
    `;
    console.log("Service:", svc.id);

    await sql`INSERT INTO staff_services (staff_id, service_id) VALUES (${stf.id}, ${svc.id})`;
    console.log("StaffService ok");

    await sql`INSERT INTO availability (staff_id, day_of_week, start_time, end_time) VALUES (${stf.id}, 1, '09:00', '17:00')`;
    console.log("Availability ok");

    const [loc] = await sql`
      INSERT INTO locations (business_id, name, slug, timezone, is_default, is_active, sort_order)
      VALUES (${biz.id}, 'Test Biz', 'main', 'Asia/Colombo', true, true, 0)
      RETURNING id
    `;
    console.log("Location:", loc.id);

    await sql`INSERT INTO staff_locations (staff_id, location_id, is_primary) VALUES (${stf.id}, ${loc.id}, true)`;
    console.log("StaffLocation ok");

    await sql`
      INSERT INTO message_templates (business_id, channel, name, body, variables)
      VALUES (${biz.id}, 'whatsapp', 'Booking confirmation', 'Hi {{clientName}}', '["clientName"]')
    `;
    console.log("MessageTemplate ok");

    await sql`DELETE FROM businesses WHERE id = ${biz.id}`;
    console.log("SUCCESS - cleaned up");
  } catch (e: unknown) {
    const err = e as Error;
    console.error("FAILED:", err.message);
  }
  process.exit(0);
}

testRegister();
