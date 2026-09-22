# Production checklist

- [ ] Rotate all local/demo secrets and set strong JWT secrets.
- [ ] Disable `ADMIN_BOOTSTRAP_ENABLED` after first secure setup.
- [ ] Remove development OTP display and use a real out-of-band OTP provider.
- [ ] Configure HTTPS, strict CORS and secure cookie/token strategy.
- [ ] Put NID/prescription/receipt files in private object storage with signed URLs.
- [ ] Implement and verify official payment gateway webhooks before accepting automated verification.
- [ ] Restrict Google Maps keys by API and application origin.
- [ ] Add queue workers, retry policies and idempotency for external calls.
- [ ] Add backups, monitoring, alerting and audit retention policy.
- [ ] Run security testing and local legal review, especially Medicine Express.
- [ ] Load-test pricing, matching, tracking and admin queues.
