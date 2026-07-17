import { describe, expect, it } from "vitest";
import {
  CAREER_VENUE_LEVELS,
  COMMERCIAL_COLLABORATION_TEMPLATES,
  EQUIPMENT_CATALOG,
  RECORD_CONTRACTS,
  type EquipmentSlot,
} from "./career";

const EQUIPMENT_SLOTS: readonly EquipmentSlot[] = [
  "guitar",
  "pedals",
  "amplifier",
];

describe("职业系统配置", () => {
  it("完整覆盖五级场地与设计规格中的成长数值", () => {
    expect(CAREER_VENUE_LEVELS.map((venue) => venue.level)).toEqual([
      1, 2, 3, 4, 5,
    ]);
    expect(CAREER_VENUE_LEVELS.map((venue) => venue.difficulty)).toEqual([
      30, 45, 60, 75, 88,
    ]);
    expect(
      CAREER_VENUE_LEVELS.map((venue) => venue.invitationFeeRange),
    ).toEqual([
      [1_000, 3_000],
      [4_000, 8_000],
      [10_000, 20_000],
      [30_000, 60_000],
      [80_000, 150_000],
    ]);
    expect(
      CAREER_VENUE_LEVELS.map((venue) => venue.basePopularityGain),
    ).toEqual([1, 2, 4, 7, 10]);
    expect(
      CAREER_VENUE_LEVELS.map((venue) => venue.actionPointCost),
    ).toEqual([2, 2, 2, 3, 3]);

    const selfHostedRules = CAREER_VENUE_LEVELS.map(
      (venue) => venue.selfHosted,
    );
    expect(selfHostedRules).toEqual([
      { available: true, upfrontCost: 2_000, stableRevenue: 3_000 },
      { available: true, upfrontCost: 6_000, stableRevenue: 8_000 },
      { available: true, upfrontCost: 15_000, stableRevenue: 20_000 },
      { available: false, upfrontCost: null, stableRevenue: null },
      { available: false, upfrontCost: null, stableRevenue: null },
    ]);

    for (const venue of CAREER_VENUE_LEVELS) {
      expect(venue.invitationFeeRange[0]).toBeLessThanOrEqual(
        venue.invitationFeeRange[1],
      );
      expect(venue.unlock.description.length).toBeGreaterThan(0);
    }
  });

  it("每个设备槽都包含四档设备且价格与隐藏修正递增", () => {
    expect(EQUIPMENT_CATALOG).toHaveLength(12);

    for (const slot of EQUIPMENT_SLOTS) {
      const equipment = EQUIPMENT_CATALOG.filter(
        (option) => option.slot === slot,
      );

      expect(equipment.map((option) => option.tier)).toEqual([
        "starter",
        "advanced",
        "professional",
        "top",
      ]);
      expect(equipment.map((option) => option.price)).toEqual([
        0, 8_000, 25_000, 60_000,
      ]);
      expect(
        equipment.map(
          (option) => option.hiddenModifiers.performanceCheckBonus,
        ),
      ).toEqual([0, 1, 2, 3]);
      expect(
        equipment.map((option) => option.hiddenModifiers.albumCheckBonus),
      ).toEqual([0, 1, 2, 3]);
      expect(
        equipment.map((option) => option.hiddenModifiers.trainingCheckBonus),
      ).toEqual([0, 1, 2, 3]);
    }
  });

  it("唱片合约以更高约束换取更高签约金与更低制作成本", () => {
    const independent = RECORD_CONTRACTS.find(
      (contract) => contract.id === "independent",
    )!;
    const smallLabel = RECORD_CONTRACTS.find(
      (contract) => contract.id === "smallLabel",
    )!;
    const majorLabel = RECORD_CONTRACTS.find(
      (contract) => contract.id === "majorLabel",
    )!;

    expect(independent).toMatchObject({
      signingBonus: 0,
      productionCostMultiplier: 1,
      releaseRevenueShare: 1,
      promotionPopularityBonus: 0,
      durationMonths: null,
      releaseRequirement: {
        requiredAlbums: 0,
        deadlineMonths: null,
      },
    });

    expect(smallLabel.signingBonus).toBeGreaterThan(independent.signingBonus);
    expect(majorLabel.signingBonus).toBeGreaterThan(smallLabel.signingBonus);
    expect(smallLabel.productionCostMultiplier).toBeLessThan(
      independent.productionCostMultiplier,
    );
    expect(majorLabel.productionCostMultiplier).toBeLessThan(
      smallLabel.productionCostMultiplier,
    );
    expect(smallLabel.releaseRevenueShare).toBeLessThan(
      independent.releaseRevenueShare,
    );
    expect(majorLabel.releaseRevenueShare).toBeLessThan(
      smallLabel.releaseRevenueShare,
    );
    expect(majorLabel.promotionPopularityBonus).toBeGreaterThan(
      smallLabel.promotionPopularityBonus,
    );

    for (const contract of [smallLabel, majorLabel]) {
      expect(contract.durationMonths).toBeGreaterThan(0);
      expect(contract.releaseRequirement.requiredAlbums).toBe(1);
      expect(contract.releaseRequirement.deadlineMonths).toBe(
        contract.durationMonths,
      );
      expect(contract.breach).toEqual({
        repaySigningBonus: true,
        basePopularityPenalty: 3,
      });
    }
  });

  it("提供四类零 AP 接受成本的商业合作模板", () => {
    expect(
      COMMERCIAL_COLLABORATION_TEMPLATES.map((template) => template.id),
    ).toEqual([
      "brandPromotion",
      "albumLicensing",
      "platformPromotion",
      "customCollaboration",
    ]);
    expect(
      COMMERCIAL_COLLABORATION_TEMPLATES.every(
        (template) => template.acceptanceActionPointCost === 0,
      ),
    ).toBe(true);
  });

  it("所有职业配置 ID 唯一且文本不包含 em dash", () => {
    const ids = [
      ...CAREER_VENUE_LEVELS.map((entry) => entry.id),
      ...EQUIPMENT_CATALOG.map((entry) => entry.id),
      ...RECORD_CONTRACTS.map((entry) => entry.id),
      ...COMMERCIAL_COLLABORATION_TEMPLATES.map((entry) => entry.id),
    ];
    const allConfiguration = [
      ...CAREER_VENUE_LEVELS,
      ...EQUIPMENT_CATALOG,
      ...RECORD_CONTRACTS,
      ...COMMERCIAL_COLLABORATION_TEMPLATES,
    ];

    expect(new Set(ids).size).toBe(ids.length);
    expect(JSON.stringify(allConfiguration)).not.toContain("\u2014");
  });
});
