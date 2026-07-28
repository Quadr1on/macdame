# Shiprocket vs. Macdame's cart abandonment

**Date:** 2026-07-28 · **Method:** desk research + a five-advisor LLM council with anonymised
peer review · **Status:** recommendation, not a decision

---

## Short answer

**No — not now.** Shiprocket is the wrong lever for Macdame at this stage, and the council was
close to unanimous on why. But the more important finding is that **"cart abandonment" is not
what Macdame currently has.** What it has is an unmeasurable funnel sitting on top of a payment
defect, and no amount of vendor tooling fixes a metric you do not yet own.

The single most urgent item in this memo is not a feature. It is two orders totalling **₹13,998**
whose payment state is unknown right now.

---

## The finding that outranks the question

`app/api/razorpay/create-order/route.js` writes the `orders` row with
`payment_status: 'pending'` **before** the Razorpay modal opens. Payment is then confirmed only
by `app/api/razorpay/verify/route.js`, called from the browser's success handler. **There is no
webhook.**

So a row stuck at `pending` collapses four genuinely different situations into one value:

1. The customer never opened the Razorpay modal.
2. They opened it and backed out. ← *only this one is cart abandonment*
3. **They paid, and closed the tab before the confirm call fired. Money moved; the database
   never heard.**
4. The bank declined.

Only state 2 is the problem Shiprocket sells against. State 3 is a defect that can take a
customer's money and leave them with no order.

**Two orders are in this state today** (verified against the database on 2026-07-28):

| Order number | Placed | Amount | `razorpay_order_id` | `razorpay_payment_id` |
|---|---|---|---|---|
| `MCD1785058256259536` | 2026-07-26 | ₹4,999 | present | **absent** |
| `MCD1785066171297750` | 2026-07-26 | ₹8,999 | present | **absent** |

Both have a Razorpay order created, so both are one dashboard lookup away from a definitive
answer. If either was captured, a real person paid two days ago and has received nothing.

Two further defects surfaced during review and were confirmed in the code:

- **`verify/route.js` never re-checks the amount paid.** It verifies the HMAC signature over
  `order_id|payment_id`, which proves the payment belongs to that Razorpay order — but it never
  compares the captured amount against `orders.total_amount`.
- **Stock is never decremented on purchase.** `stock_quantity` is written only by the admin
  dashboard. Nothing in the checkout path touches it, so the shop can oversell. COD would
  amplify this, because COD orders occupy stock for days before resolving.

---

## Why the abandonment number cannot be used

Macdame has **5 orders, ever.** Two are `pending`. That is not a 40% abandonment rate — with
n=5, the 95% confidence interval on 2/5 runs roughly **5% to 85%**. The data is equally
consistent with a healthy store and a badly broken one.

This matters for the vendor pitch specifically. Shiprocket Checkout advertises a **25–30%
reduction in cart abandonment** and a **20% conversion lift**. Those figures come from
[Shiprocket's own marketing blog](https://checkout.shiprocket.in/blog/cart-abandonment/), drawn
from merchants who already had volume, with no published control group. Even taken at face
value, a 25% improvement on a base of five orders is **1.25 orders**. Macdame could not detect
that result if it happened, which means it could never tell whether the spend worked.

Buying a conversion tool before owning a conversion metric is the definition of an unfalsifiable
purchase.

---

## What Shiprocket actually sells, and which part is relevant

Shiprocket is three separable products, and conflating them is how this decision goes wrong:

| Product | What it is | Relevant to abandonment? |
|---|---|---|
| **Core Shiprocket** | Courier aggregation, labels, NDR management, tracking, pincode serviceability | **No.** Entirely post-purchase. |
| **Shiprocket Checkout** | One-click checkout, phone-OTP saved addresses, COD, upfront cost display | **Yes** — but it *replaces* the Razorpay checkout already built |
| **Shiprocket Engage** | Abandoned-cart messaging | In principle — but there is no contact list to message |

Two structural problems for Macdame specifically:

1. **No plug-and-play path.** Shiprocket's connectors target Shopify, WooCommerce and Magento.
   Macdame is a bespoke Next.js app, so every integration is
   [the developer REST API route](https://apidocs.shiprocket.in/) — build it, then maintain it.
2. **Shiprocket Checkout is a replacement, not an addition.** Adopting it means removing the
   Razorpay flow, address book, and order-creation logic that already work, and handing the
   highest-trust surface of the shop to a third party — to fix a leak that has not been measured.

---

## Where the council agreed

All five advisors, reasoning independently, landed on the same three points:

1. **The webhook is the first move**, and it is a defect fix rather than an optimisation.
2. **n=5 makes every percentage meaningless**, including any ROI projected from vendor numbers.
3. **Shiprocket Checkout is premature**; core Shiprocket is a logistics decision for later, and
   Engage is meaningless without a contact list.

Three of five independently made a sharper point: **5 orders is a traffic problem, not a
conversion problem.** Optimising a funnel presumes people are entering it.

---

## Where the council clashed

**COD — the one real disagreement.** Four advisors treated COD as the highest-value
India-specific lever (COD is [40–45% of Indian e-commerce](https://swcybernetics.in/knowledge-base/cod-vs-prepaid-ecommerce-india-2026),
and 13% of shoppers abandon when their preferred method is missing). One dissented hard, and the
dissent is worth taking seriously:

> At ₹3,000–10,000 AOV on traditional wear, Indian COD RTO (return-to-origin) runs 20–30%. That
> is forward freight, return freight, and locked working capital — on a shop with no returns
> process.

Both are right about different things. COD is a **trust substitute**, not merely a payment
method — for an unknown shop asking ₹7,000 for a saree, it may be the only thing that makes a
first purchase feel safe. But unconditional COD at this AOV is a real cash risk.

**Resolution: partial-prepaid COD** (a small prepaid deposit, balance on delivery). It preserves
the trust function while capping RTO exposure. And a returns policy has to exist before COD ships
at all.

**Cart persistence.** One advisor called the unused `cart_items` table "a trap" — persisting
carts is only worth anything if you can message the person, and there is no email/SMS/WhatsApp
provider configured. That is correct on today's facts, though server-side cart data is also what
makes true funnel measurement possible later.

---

## Blind spots the peer review caught

These only emerged when advisors reviewed each other:

- **Nobody proposed reconciling the two pending orders.** Every advisor prescribed a webhook for
  *future* orders; none addressed the money possibly already taken. Four of five reviewers
  flagged this independently. It is a 20-minute dashboard task, available before any code.
- **A webhook alone is not sufficient.** It needs signature verification, idempotency (Razorpay
  retries), and a periodic reconciliation job — otherwise a single dropped webhook recreates the
  same bug.
- **Razorpay Magic Checkout was never named.** It offers one-click checkout, saved addresses and
  COD scoring *inside the payment provider already integrated*. That — not Shiprocket Checkout —
  is the real comparison, and it does not require replacing the stack.
- **Transactional email is not marketing.** An order-confirmation email is a trust and record-keeping
  baseline, and it was filed under "marketing tooling" and deferred.
- **No analytics are installed.** The "is this traffic or conversion?" question that three
  advisors raised is currently unanswerable, because nothing measures sessions.

One advisor argued the whole framing is wrong — that the **uniforms line is a B2B business**
(schools order 300–800 units annually against a purchase order, where no cart exists to abandon).
Reviewers were split: the observation is genuinely interesting, but it smuggles in a quarter of
unbudgeted work (PO handling, GST invoicing, credit terms, a sales motion) while payments are
still broken. **Worth exploring after the payment path is trustworthy, not instead of it.**

---

## Recommended sequence

Ordered by ratio of payoff to effort. Nothing here needs Shiprocket.

| # | Action | Effort | Why now |
|---|---|---|---|
| 0 | **Reconcile the two pending orders** against the Razorpay dashboard. Fulfil or refund. | ~20 min | Real money, real people, two days old |
| 1 | **Razorpay webhook** — signature-verified, idempotent, plus a reconciliation job | ~4–6 h | Stops silent payment loss; makes every later metric trustworthy |
| 2 | **Amount check in `verify`** — compare captured amount to `total_amount` | ~30 min | Closes an underpayment gap |
| 3 | **Stock decrement on payment success** | ~2 h | Prevents overselling; a prerequisite for COD |
| 4 | **Guest checkout** — remove the forced `/login?next=/checkout` wall | ~1–1.5 d | Forced account creation is a documented top-three abandonment cause and Shiprocket cannot fix it for you |
| 5 | **Transactional order-confirmation email** | ~3 h | Trust baseline; also unlocks recovery messaging later |
| 6 | **Partial-prepaid COD** (after a returns policy exists) | ~1 d | Trust substitute, RTO capped |
| 7 | **Basic analytics** | ~1 h | Answers whether this is traffic or conversion |
| 8 | Reassess Shiprocket **core** (logistics only) | — | When manual booking hurts — roughly **30+ parcels/month** |

**Explicitly do not build yet:** cart persistence (no messaging channel to use it), pincode
serviceability (no courier account to query), Shiprocket Checkout (replaces working code),
Shiprocket Engage (no list).

**Also drop:** the ₹99 / free-above-₹999 shipping rule. Every product is priced above ₹999, so
the fee never fires — it is a free-shipping banner dressed up as a fee, and one advisor reading
it cold took it as a sign of carelessness. Either say "free shipping" plainly or set a threshold
that means something.

---

## The one thing to do first

**Open the Razorpay dashboard and look up the two `razorpay_order_id`s on orders
`MCD1785058256259536` (₹4,999) and `MCD1785066171297750` (₹8,999).** If either was captured,
fulfil or refund it today.

Everything else in this memo is engineering. That one is a customer.

---

## Sources

- [Shiprocket Checkout — cart abandonment](https://checkout.shiprocket.in/blog/cart-abandonment/) (vendor marketing; claims unverified)
- [Cart abandonment statistics 2025 — Shiprocket](https://checkout.shiprocket.in/blog/latest-cart-abandonment-statistics-2025/) (vendor-published)
- [Shiprocket API documentation](https://apidocs.shiprocket.in/)
- [Shiprocket channel integrations](https://www.shiprocket.in/channel-integrations/)
- [Razorpay — reasons for high cart abandonment](https://razorpay.com/learn/reasons-for-high-cart-abandonment-rate/)
- [Razorpay — cart abandonment benchmarks 2026](https://razorpay.com/learn/cart-abandonment-rate-101/)
- [COD vs prepaid in Indian e-commerce, 2026](https://swcybernetics.in/knowledge-base/cod-vs-prepaid-ecommerce-india-2026)
- [Reducing cart abandonment for Indian D2C, 2026](https://blog.netstager.com/reduce-cart-abandonment-in-2026-with-custom-shopify/)

Baymard's 48% hidden-cost figure is cited second-hand through the sources above and was not
verified against Baymard directly.
