import { describe, it, expect } from "vitest";
import { ORDER_TRANSITIONS, ORDER_STATES } from "../models/Order";

describe("order state machine", () => {
  it("only allows transitions explicitly listed for each state", () => {
    for (const state of ORDER_STATES) {
      expect(ORDER_TRANSITIONS[state]).toBeDefined();
    }
  });

  it("does not allow skipping OTP verification at pickup", () => {
    expect(ORDER_TRANSITIONS.RIDER_AT_PICKUP).not.toContain("PICKED_UP");
    expect(ORDER_TRANSITIONS.RIDER_AT_PICKUP).toContain("PICKUP_OTP_PENDING");
  });

  it("does not allow skipping OTP verification at delivery", () => {
    expect(ORDER_TRANSITIONS.RIDER_AT_DESTINATION).not.toContain("DELIVERED");
    expect(ORDER_TRANSITIONS.RIDER_AT_DESTINATION).toContain("DELIVERY_OTP_PENDING");
  });

  it("treats CANCELLED and FAILED as terminal states", () => {
    expect(ORDER_TRANSITIONS.CANCELLED).toHaveLength(0);
    expect(ORDER_TRANSITIONS.FAILED).toHaveLength(0);
  });

  it("never allows an arbitrary jump from CREATED straight to DELIVERED", () => {
    expect(ORDER_TRANSITIONS.CREATED).not.toContain("DELIVERED");
  });
});
