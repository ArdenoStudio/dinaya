# 05 Promo, Referral, and Influencer Playbook

Last updated: 2026-06-03, Asia/Colombo.

## Current Product Reality

Dinaya does not currently have a true promo-code feature for checkout or tenant customer bookings.

What exists now:

- Dinaya Deals: businesses can publish limited discounts for specific service slots.
- Referral codes: businesses have referral codes and referral URLs.
- Booking attribution: UTM, referral, and channel parameters can tag booking source.
- PayHere payments/subscriptions: Dinaya can process payments through PayHere.
- Plan gates: Starter, Pro, and Growth features are enforced in product.

What does not exist yet:

- A customer-entered promo code box in booking checkout.
- Platform subscription promo codes for Dinaya plans.
- Automatic influencer affiliate code redemption.
- Promo redemption tables, limits, fraud checks, or payout reports.

Launch implication:

> Use manual campaign codes, referral links, UTMs, and Dinaya Deals now. Build real promo codes only after demand is proven.

## What to Do Immediately

### 1. Manual Founder Codes

Use codes in marketing, but redeem them manually.

Examples:

- `FOUNDER50`
- `DINAYA60`
- `SALONPRO`
- `COLOMBOBOOKS`
- Creator-specific: `NIMA10`, `STYLEBYAMA`, etc.

How to run:

1. Creator or post says: "DM Dinaya with code FOUNDER50."
2. Lead sheet records code, source, UTM, and referrer.
3. Dinaya manually grants setup/trial/discount terms.
4. Only count payouts after the business activates and becomes paid.

Rules:

- Do not show an in-app promo input unless it is built.
- Do not promise automatic discount at checkout.
- Keep code terms simple and written.

### 2. Use Dinaya Deals for Tenant Promotions

For businesses already onboarded:

- Encourage them to publish Deals for slow slots.
- Position Deals as "fill quiet times" rather than "discount your whole brand."
- Track deal impressions, redemptions, and revenue.

Good examples:

- "Tuesday 2 PM haircut slot, 20 percent off, 3 spots only."
- "Weekday facial slots, 15 percent off, valid until Friday."
- "First 5 bookings through Dinaya this week get a limited service Deal."

### 3. Use Referral Links and UTMs

For every channel:

- Instagram bio: `?utm_source=instagram&utm_medium=bio`
- Story link: `?utm_source=instagram&utm_medium=story`
- Creator: `?utm_source=creator&utm_campaign=[creator-name]`
- WhatsApp broadcast: `?utm_source=whatsapp&utm_medium=broadcast`
- Business referral: existing referral code link with `?ref=[code]`

Track:

- Source
- Campaign
- Creator/referrer
- Lead quality
- Activation
- Paid conversion

## Promo-Code Product Roadmap

Build promo codes in two separate layers. Do not merge them too early.

### Layer A: Dinaya Subscription Promo Codes

Used when a business subscribes to Dinaya.

Needed fields:

- Code
- Description
- Discount type: percent, fixed amount, free months, setup waived
- Applies to plan: Starter, Pro, Growth, all
- Applies to interval: monthly, annual, both
- Valid from/to
- Max redemptions
- Max redemptions per business/email
- First invoice only or recurring duration
- Created by admin
- Status: active, paused, expired

Needed flows:

- Apply code before PayHere checkout/subscription creation.
- Store discounted amount and original amount.
- Store redemption record.
- Validate code server-side.
- Show clear terms before payment.
- Prevent using multiple codes unless explicitly allowed.

Important PayHere note:

- Recurring subscriptions need extra care. If a promo changes recurring amount, Dinaya must decide whether the discount is first period only, fixed number of periods, or forever. The PayHere Recurring API charges the customer according to the time period and amount sent, so the subscription logic must be explicit before implementation.

### Layer B: Tenant Booking Promo Codes

Used by a tenant's customers when booking a service.

Needed fields:

- Business ID
- Code
- Discount type: percent or fixed LKR
- Service/location/staff scope
- Minimum spend
- Valid dates
- Max redemptions overall
- Max redemptions per customer phone/email
- First booking only or repeat allowed
- Cannot combine with Deal, unless allowed
- Created by business owner/staff
- Status

Needed flows:

- Promo input in booking confirmation step.
- Server-side validation in booking API.
- Discounted price and amount due calculation.
- PayHere amount uses discounted price.
- Redemption row after successful booking/payment.
- Reports: revenue, redemptions, top codes, source.

Fraud controls:

- Normalize codes to uppercase.
- Rate-limit failed code attempts.
- Use customer phone/email for per-customer limits.
- Do not apply code after payment success.
- Audit who created/edited codes.

### Layer C: Influencer/Affiliate Codes

Used by creator partners to drive business signups.

Needed fields:

- Partner ID
- Code
- Referral URL
- Commission model
- Payout status
- Conversion status
- Attribution window

Recommended payout trigger:

- Pay only after referred business becomes paid and remains active for 30 days.

## Influencer Strategy

Do not start with generic lifestyle influencers. Start with operator-creators and niche micro-creators who can credibly talk to service businesses.

Best influencer types:

- Salon owners who create content.
- Makeup artists and bridal creators.
- Fitness/wellness coaches with appointment services.
- Skin/aesthetic clinic educators.
- Wedding vendors.
- Local city pages.
- SME/business creators.
- Freelance marketers who work with salons and clinics.
- Photographers/videographers who serve local businesses.

Follower range:

- Nano: 1,000-10,000 followers with strong local trust.
- Micro: 10,000-50,000 followers with niche engagement.

Selection checklist:

- Audience includes business owners or appointment buyers.
- Comments are real and local.
- Creator can show a real booking workflow.
- Creator is willing to disclose partnership.
- Creator has clean brand fit.
- Creator can drive measurable clicks/leads, not just views.

## Partner Programs

### Founder Partners

Who:

- 5-10 respected service businesses.

Offer:

- Free Growth/Pro for 6 months.
- Free concierge setup.
- Featured case study.
- Referral code.
- Early product influence.

Ask:

- Use Dinaya publicly.
- Post one setup video or story.
- Give feedback.
- Allow anonymized metrics or testimonial.

### Creator Affiliates

Who:

- 10-20 creators in beauty, wellness, business, local city pages.

Offer:

- Commission per paid business.
- Bonus for first 5 paid businesses.
- Unique tracking link/code.
- Usage rights for their video as an ad.

Ask:

- 1 reel or TikTok.
- 3 story frames.
- Link/code in bio or story.
- Clear disclosure.

### Agency Partners

Who:

- Web designers, social media managers, branding studios, business consultants.

Offer:

- Referral commission.
- White-glove setup support.
- Co-branded "booking page setup" package.

Ask:

- Recommend Dinaya to clients.
- Help collect service menus and brand assets.
- Support client onboarding.

## Influencer Outreach Script

> Hey [Name], we are launching Dinaya, a Sri Lankan booking platform for service businesses. Your audience overlaps with the exact businesses we are helping: salons, wellness, clinics, creators, and local service brands.
>
> We are not looking for a generic shoutout. We want a founder partner/creator partner who can show a real booking workflow and help businesses get set up.
>
> We can give you a tracked code/link, free setup for your own business or a business you choose, and commission for paid businesses that come through you.
>
> Want to test a demo booking page and see if it fits your audience?

## Creator Brief

Hook options:

- "If your salon still takes bookings only through DMs, watch this."
- "I set up a booking page for a Sri Lankan service business."
- "This is how customers can book without waiting for a reply."
- "Small businesses in Sri Lanka need this before running more ads."

Must show:

- Booking link from Instagram/WhatsApp.
- Customer choosing service/time.
- Owner dashboard or booking confirmation.
- Call to action: DM Dinaya or use creator link/code.

Must say:

- Dinaya is for Sri Lankan service businesses.
- Early businesses can get free setup/founder access.
- Partnership is sponsored/affiliate if payment or commission exists.

Do not say:

- "Guaranteed more bookings."
- "AI receptionist is live for everyone."
- "Promo code works automatically in app" until it is built.

## Promo Terms Template

Use this for every code:

> Code: [CODE]
>
> Offer: [discount/trial/setup benefit]
>
> Eligibility: [new businesses / specific vertical / plan]
>
> Valid from: [date]
>
> Valid until: [date]
>
> Limit: [first X businesses / one per business]
>
> Redemption: [DM Dinaya / signup link / manual approval]
>
> Notes: Cannot be combined with other launch offers unless approved by Dinaya.

