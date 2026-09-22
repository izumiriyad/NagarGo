/**
 * Unit tests for pricingService.calculatePricing.
 *
 * These tests run in isolation — no MongoDB connection needed —
 * because PricingConfig.findOne is mocked via vi.mock.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Mongoose model before importing the service
vi.mock("../models/PricingConfig", () => ({
  PricingConfig: {
    findOne: vi.fn(),
  },
}));

import { calculatePricing } from "../services/pricingService";
import { PricingConfig } from "../models/PricingConfig";

const BASE_CONFIG = {
  baseFare: 30,
  perKmRate: 12,
  serviceFee: 5,
  minimumFare: 40,
  peakMultiplier: 1.3,
  emergencyMultiplier: 1.5,
  isPeakActive: false,
  riderCommissionPercent: 80,
  nagarGoCommissionPercent: 20,
};

function mockConfig(overrides = {}) {
  (PricingConfig.findOne as any).mockResolvedValue({ ...BASE_CONFIG, ...overrides });
}

describe("pricingService.calculatePricing", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("computes a basic fare correctly", async () => {
    mockConfig();
    const result = await calculatePricing({ cityId: "city1", distanceKm: 5, isEmergency: false });
    expect(result.baseFare).toBe(30);
    expect(result.distanceFare).toBe(60); // 5 km × 12
    expect(result.serviceFee).toBe(5);
    expect(result.total).toBe(95); // 30+60+5 = 95, above minimum
    expect(result.surcharges).toBe(0); // no peak, no emergency
  });

  it("enforces the minimum fare", async () => {
    mockConfig();
    const result = await calculatePricing({ cityId: "city1", distanceKm: 0.2, isEmergency: false });
    expect(result.total).toBe(BASE_CONFIG.minimumFare);
  });

  it("applies the peak multiplier when peak is active", async () => {
    mockConfig({ isPeakActive: true });
    const result = await calculatePricing({ cityId: "city1", distanceKm: 5, isEmergency: false });
    const expectedSubtotal = 30 + 60 + 5; // = 95
    const expectedTotal = Math.round(expectedSubtotal * 1.3 * 100) / 100;
    expect(result.total).toBe(expectedTotal);
    expect(result.surcharges).toBeGreaterThan(0);
  });

  it("applies the emergency multiplier", async () => {
    mockConfig();
    const result = await calculatePricing({ cityId: "city1", distanceKm: 5, isEmergency: true });
    const expectedTotal = Math.round(95 * 1.5 * 100) / 100;
    expect(result.total).toBe(expectedTotal);
  });

  it("stacks both peak and emergency multipliers", async () => {
    mockConfig({ isPeakActive: true });
    const result = await calculatePricing({ cityId: "city1", distanceKm: 5, isEmergency: true });
    const expected = Math.round(95 * 1.3 * 1.5 * 100) / 100;
    expect(result.total).toBe(expected);
  });

  it("splits commission correctly between rider and NagarGo", async () => {
    mockConfig();
    const result = await calculatePricing({ cityId: "city1", distanceKm: 5, isEmergency: false });
    expect(result.riderEarnings + result.nagarGoCommission).toBeCloseTo(result.total, 1);
    expect(result.riderEarnings).toBeCloseTo(result.total * 0.8, 1);
  });

  it("uses estimatedMinutes from input when provided", async () => {
    mockConfig();
    const result = await calculatePricing({
      cityId: "city1",
      distanceKm: 5,
      isEmergency: false,
      estimatedMinutes: 20,
    });
    expect(result.estimatedMinutes).toBe(20);
  });

  it("falls back to speed-based ETA when estimatedMinutes is not provided", async () => {
    mockConfig();
    const result = await calculatePricing({ cityId: "city1", distanceKm: 5.5, isEmergency: false });
    // 5.5 km / 22 km/h * 60 = 15 min, ceil'd
    expect(result.estimatedMinutes).toBe(15);
  });

  it("throws AppError when no pricing config exists for city", async () => {
    (PricingConfig.findOne as any).mockResolvedValue(null);
    await expect(
      calculatePricing({ cityId: "unknown-city", distanceKm: 5, isEmergency: false })
    ).rejects.toThrow("Pricing is not yet configured");
  });
});
