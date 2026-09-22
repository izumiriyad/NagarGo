# Product flows

## Customer delivery
1. Customer signs in with phone OTP.
2. Customer creates an order. Backend calculates distance and fare.
3. Customer chooses COD/Live, Pay to Rider, or Pay to Admin.
4. Non-COD payments submit a transaction ID and amount; server checks both.
5. Admin verifies/rejects submitted payment.
6. Confirmed orders enter rider search and dispatch.
7. Rider advances through pickup/travel/destination states.
8. Customer requests pickup/delivery OTP; rider enters the code.
9. Delivery becomes `DELIVERED`; customer can rate or dispute.

## Medicine Express
1. Customer submits pharmacy, destination, items, prescription URL and pricing inputs.
2. Order is `SUBMITTED` and appears in the admin medicine queue.
3. Admin approves/rejects and records a review note.
4. Future production work connects approved orders to verified pharmacies and eligible medicine riders.

## Rider onboarding
1. Applicant submits identity/document URL, address, vehicle and bKash payout information.
2. Admin reviews application.
3. Approved rider can sign in with OTP and go online.
4. Dispatch service assigns eligible online riders; production version should use geospatial matching.
