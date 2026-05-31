# Dinaya AI Voice Receptionist Setup

Status: coming soon. Tenant setup requests, voice API keys, voice profile reads, Twilio relay, and `voice_agent` booking creation are paused until Dinaya explicitly rolls out the feature.

Dinaya AI Voice Receptionist is planned as a Growth/Managed Max add-on for businesses that want callers to ask questions and book appointments by phone.

## Phone Flow

1. The customer calls a normal phone number.
2. The business forwards that number to the AI provider number, or uses a provider-issued number directly.
3. The AI provider answers and follows the approved call script.
4. The provider calls Dinaya to read business, branch, service, staff, and endpoint data.
5. The provider checks availability before offering appointment times.
6. The provider creates a booking through Dinaya with source `voice_agent`.
7. Dinaya handles normal booking validation, double-booking protection, notifications, payments, webhooks, automations, and dashboard reporting.
8. If the caller asks for something outside the approved flow, the provider transfers or escalates to the configured handoff phone.

## Recommended Providers

- Peak Agents for managed Sri Lanka-local setup.
- Twilio, Vapi, Retell, or another SIP-capable voice AI provider if Dinaya runs the voice layer directly later.

The future release is expected to start as a managed setup flow. Dinaya generates the setup pack, then platform staff configure the provider.

## Required Dinaya Setup

These steps are for the future rollout and are not currently available to tenant users.

1. Upgrade the business to Growth or Managed Max.
2. Open `Dashboard -> Integrations -> AI Voice Receptionist`.
3. Save the setup form with:
   - business phone
   - human handoff phone
   - supported languages
   - opening rules
   - service rules
   - booking rules
   - FAQ notes
   - welcome and fallback messages
4. Generate a voice API key.
5. Copy the key immediately. It is shown only once.
6. Give the setup pack to the provider.
7. Track provider status in `Admin -> AI Voice`.

## Required API Scopes

Voice providers should use a dedicated key with:

- `voice:read`
- `voice:write`
- `bookings:read`
- `bookings:write`

Send the key as:

```http
Authorization: Bearer dinaya_...
```

## Provider Read Endpoint

```http
GET /api/v1/voice/profile
```

Requires `voice:read`.

Returns:

- business profile
- active locations
- active services
- active staff
- staff-service assignments
- staff-location assignments
- voice setup rules
- endpoint templates

The response does not include PayHere secrets, webhook secrets, client records, or other tenant data.

## Booking Endpoint

```http
POST /api/v1/bookings
```

Requires `bookings:write`.

To mark the booking as voice-created, include:

```json
{
  "source": "voice_agent"
}
```

The key must also include `voice:write`, otherwise Dinaya rejects the request.

## Availability Endpoint

```http
GET /api/v1/availability?businessId={businessId}&serviceId={serviceId}&staffId={staffId}&date={yyyy-mm-dd}
```

The provider must offer only returned slots. Dinaya still performs final conflict checks when creating the booking.

## Handoff Rules

Transfer or escalate to the handoff phone when:

- the caller asks for a refund, complaint, discount, or custom package
- the caller requests a time that Dinaya does not return as available
- the caller wants to change payment terms
- the caller gives unclear contact details after one retry
- the caller asks for services not listed by Dinaya
- the provider cannot confirm the booking API response

## Test Checklist

- Call the number and confirm the welcome message.
- Ask for service prices and confirm answers match Dinaya.
- Ask for a booking date and confirm the provider uses available slots only.
- Create a test booking and confirm it appears in the dashboard with source `voice_agent`.
- Try to double-book the same staff/time and confirm Dinaya rejects it.
- Trigger a payment-required booking and confirm the booking remains pending when appropriate.
- Confirm customer and business notifications still send.
- Confirm handoff transfers to the configured phone.
- Revoke the API key and confirm provider calls fail with `401`.

## Phase 2: Dinaya-hosted Twilio voice

When Dinaya runs the voice layer directly:

1. Set `TWILIO_CONVERSATION_RELAY_WS_URL` to your ConversationRelay WebSocket handler.
2. Point the Twilio number voice webhook to:

```http
POST /api/v1/voice/twilio?businessId={businessId}
```

3. The webhook returns TwiML that connects callers to ConversationRelay using the business welcome message from voice setup.
4. Booking creation still uses `POST /api/v1/bookings` with source `voice_agent`.
