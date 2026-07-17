export type VenueLevel = 1 | 2 | 3 | 4 | 5;

export interface VenueUnlockRequirements {
  minPopularity: number;
  minReleasedAlbums: number;
  requiredExcellentPerformanceLevel: 3 | 4 | null;
  description: string;
}

export type SelfHostedVenueRule =
  | {
      available: true;
      upfrontCost: number;
      stableRevenue: number;
    }
  | {
      available: false;
      upfrontCost: null;
      stableRevenue: null;
    };

export interface CareerVenueLevel {
  id: `venue-level-${VenueLevel}`;
  level: VenueLevel;
  name: string;
  difficulty: number;
  invitationFeeRange: readonly [number, number];
  basePopularityGain: number;
  actionPointCost: 2 | 3;
  selfHosted: SelfHostedVenueRule;
  unlock: VenueUnlockRequirements;
}

export const CAREER_VENUE_LEVELS = [
  {
    id: "venue-level-1",
    level: 1,
    name: "酒吧、校园与小型拼盘",
    difficulty: 30,
    invitationFeeRange: [1_000, 3_000],
    basePopularityGain: 1,
    actionPointCost: 2,
    selfHosted: {
      available: true,
      upfrontCost: 2_000,
      stableRevenue: 3_000,
    },
    unlock: {
      minPopularity: 0,
      minReleasedAlbums: 0,
      requiredExcellentPerformanceLevel: null,
      description: "开局开放，一级自主办演出始终可用",
    },
  },
  {
    id: "venue-level-2",
    level: 2,
    name: "Livehouse",
    difficulty: 45,
    invitationFeeRange: [4_000, 8_000],
    basePopularityGain: 2,
    actionPointCost: 2,
    selfHosted: {
      available: true,
      upfrontCost: 6_000,
      stableRevenue: 8_000,
    },
    unlock: {
      minPopularity: 10,
      minReleasedAlbums: 0,
      requiredExcellentPerformanceLevel: null,
      description: "综合人气达到 10",
    },
  },
  {
    id: "venue-level-3",
    level: 3,
    name: "中型专场与音乐节小舞台",
    difficulty: 60,
    invitationFeeRange: [10_000, 20_000],
    basePopularityGain: 4,
    actionPointCost: 2,
    selfHosted: {
      available: true,
      upfrontCost: 15_000,
      stableRevenue: 20_000,
    },
    unlock: {
      minPopularity: 30,
      minReleasedAlbums: 1,
      requiredExcellentPerformanceLevel: null,
      description: "综合人气达到 30，且至少发行 1 张专辑",
    },
  },
  {
    id: "venue-level-4",
    level: 4,
    name: "大型音乐节、剧场与体育馆",
    difficulty: 75,
    invitationFeeRange: [30_000, 60_000],
    basePopularityGain: 7,
    actionPointCost: 3,
    selfHosted: {
      available: false,
      upfrontCost: null,
      stableRevenue: null,
    },
    unlock: {
      minPopularity: 60,
      minReleasedAlbums: 2,
      requiredExcellentPerformanceLevel: 3,
      description:
        "综合人气达到 60，至少发行 2 张专辑，并完成 1 次优秀三级演出",
    },
  },
  {
    id: "venue-level-5",
    level: 5,
    name: "大型巡演与万人场馆",
    difficulty: 88,
    invitationFeeRange: [80_000, 150_000],
    basePopularityGain: 10,
    actionPointCost: 3,
    selfHosted: {
      available: false,
      upfrontCost: null,
      stableRevenue: null,
    },
    unlock: {
      minPopularity: 85,
      minReleasedAlbums: 4,
      requiredExcellentPerformanceLevel: 4,
      description:
        "综合人气达到 85，至少发行 4 张专辑，并完成 1 次优秀四级演出",
    },
  },
] as const satisfies readonly CareerVenueLevel[];

export type EquipmentSlot = "guitar" | "pedals" | "amplifier";

export type EquipmentTier =
  | "starter"
  | "advanced"
  | "professional"
  | "top";

export interface EquipmentHiddenModifiers {
  albumCheckBonus: number;
  performanceCheckBonus: number;
  trainingCheckBonus: number;
}

export interface EquipmentOption {
  id: `${EquipmentSlot}-${EquipmentTier}`;
  slot: EquipmentSlot;
  slotLabel: string;
  tier: EquipmentTier;
  tierLabel: string;
  displayName: string;
  price: number;
  hiddenModifiers: EquipmentHiddenModifiers;
}

const noEquipmentBonus = {
  albumCheckBonus: 0,
  performanceCheckBonus: 0,
  trainingCheckBonus: 0,
} as const;

const advancedEquipmentBonus = {
  albumCheckBonus: 1,
  performanceCheckBonus: 1,
  trainingCheckBonus: 1,
} as const;

const professionalEquipmentBonus = {
  albumCheckBonus: 2,
  performanceCheckBonus: 2,
  trainingCheckBonus: 2,
} as const;

const topEquipmentBonus = {
  albumCheckBonus: 3,
  performanceCheckBonus: 3,
  trainingCheckBonus: 3,
} as const;

export const EQUIPMENT_CATALOG = [
  {
    id: "guitar-starter",
    slot: "guitar",
    slotLabel: "电吉他",
    tier: "starter",
    tierLabel: "入门",
    displayName: "旧款练习电吉他",
    price: 0,
    hiddenModifiers: noEquipmentBonus,
  },
  {
    id: "guitar-advanced",
    slot: "guitar",
    slotLabel: "电吉他",
    tier: "advanced",
    tierLabel: "进阶",
    displayName: "可靠的舞台电吉他",
    price: 8_000,
    hiddenModifiers: advancedEquipmentBonus,
  },
  {
    id: "guitar-professional",
    slot: "guitar",
    slotLabel: "电吉他",
    tier: "professional",
    tierLabel: "专业",
    displayName: "专业录音电吉他",
    price: 25_000,
    hiddenModifiers: professionalEquipmentBonus,
  },
  {
    id: "guitar-top",
    slot: "guitar",
    slotLabel: "电吉他",
    tier: "top",
    tierLabel: "顶级",
    displayName: "定制级旗舰电吉他",
    price: 60_000,
    hiddenModifiers: topEquipmentBonus,
  },
  {
    id: "pedals-starter",
    slot: "pedals",
    slotLabel: "效果器",
    tier: "starter",
    tierLabel: "入门",
    displayName: "基础单块效果器",
    price: 0,
    hiddenModifiers: noEquipmentBonus,
  },
  {
    id: "pedals-advanced",
    slot: "pedals",
    slotLabel: "效果器",
    tier: "advanced",
    tierLabel: "进阶",
    displayName: "组合效果器板",
    price: 8_000,
    hiddenModifiers: advancedEquipmentBonus,
  },
  {
    id: "pedals-professional",
    slot: "pedals",
    slotLabel: "效果器",
    tier: "professional",
    tierLabel: "专业",
    displayName: "专业舞台效果器组",
    price: 25_000,
    hiddenModifiers: professionalEquipmentBonus,
  },
  {
    id: "pedals-top",
    slot: "pedals",
    slotLabel: "效果器",
    tier: "top",
    tierLabel: "顶级",
    displayName: "旗舰定制效果器系统",
    price: 60_000,
    hiddenModifiers: topEquipmentBonus,
  },
  {
    id: "amplifier-starter",
    slot: "amplifier",
    slotLabel: "音箱",
    tier: "starter",
    tierLabel: "入门",
    displayName: "小型练习音箱",
    price: 0,
    hiddenModifiers: noEquipmentBonus,
  },
  {
    id: "amplifier-advanced",
    slot: "amplifier",
    slotLabel: "音箱",
    tier: "advanced",
    tierLabel: "进阶",
    displayName: "可靠的舞台音箱",
    price: 8_000,
    hiddenModifiers: advancedEquipmentBonus,
  },
  {
    id: "amplifier-professional",
    slot: "amplifier",
    slotLabel: "音箱",
    tier: "professional",
    tierLabel: "专业",
    displayName: "专业真空管音箱",
    price: 25_000,
    hiddenModifiers: professionalEquipmentBonus,
  },
  {
    id: "amplifier-top",
    slot: "amplifier",
    slotLabel: "音箱",
    tier: "top",
    tierLabel: "顶级",
    displayName: "旗舰级巡演音箱",
    price: 60_000,
    hiddenModifiers: topEquipmentBonus,
  },
] as const satisfies readonly EquipmentOption[];

export type RecordContractId =
  | "independent"
  | "smallLabel"
  | "majorLabel";

export interface ContractReleaseRequirement {
  requiredAlbums: number;
  deadlineMonths: number | null;
  description: string;
}

export interface RecordContractConfig {
  id: RecordContractId;
  displayName: string;
  signingBonus: number;
  productionCostMultiplier: number;
  releaseRevenueShare: number;
  promotionPopularityBonus: number;
  durationMonths: number | null;
  releaseRequirement: ContractReleaseRequirement;
  increasesHighTierOpportunityRate: boolean;
  increasesCommercialInterventionWeight: boolean;
  breach: {
    repaySigningBonus: boolean;
    basePopularityPenalty: number;
  };
}

export const RECORD_CONTRACTS = [
  {
    id: "independent",
    displayName: "独立发行",
    signingBonus: 0,
    productionCostMultiplier: 1,
    releaseRevenueShare: 1,
    promotionPopularityBonus: 0,
    durationMonths: null,
    releaseRequirement: {
      requiredAlbums: 0,
      deadlineMonths: null,
      description: "无发行期限与数量要求",
    },
    increasesHighTierOpportunityRate: false,
    increasesCommercialInterventionWeight: false,
    breach: {
      repaySigningBonus: false,
      basePopularityPenalty: 0,
    },
  },
  {
    id: "smallLabel",
    displayName: "小型厂牌",
    signingBonus: 20_000,
    productionCostMultiplier: 0.7,
    releaseRevenueShare: 0.7,
    promotionPopularityBonus: 0,
    durationMonths: 18,
    releaseRequirement: {
      requiredAlbums: 1,
      deadlineMonths: 18,
      description: "18 个月内发行 1 张专辑",
    },
    increasesHighTierOpportunityRate: false,
    increasesCommercialInterventionWeight: false,
    breach: {
      repaySigningBonus: true,
      basePopularityPenalty: 3,
    },
  },
  {
    id: "majorLabel",
    displayName: "大型唱片公司",
    signingBonus: 50_000,
    productionCostMultiplier: 0.5,
    releaseRevenueShare: 0.5,
    promotionPopularityBonus: 1,
    durationMonths: 24,
    releaseRequirement: {
      requiredAlbums: 1,
      deadlineMonths: 24,
      description: "24 个月内发行 1 张专辑",
    },
    increasesHighTierOpportunityRate: true,
    increasesCommercialInterventionWeight: true,
    breach: {
      repaySigningBonus: true,
      basePopularityPenalty: 3,
    },
  },
] as const satisfies readonly RecordContractConfig[];

export type CommercialCollaborationId =
  | "brandPromotion"
  | "albumLicensing"
  | "platformPromotion"
  | "customCollaboration";

export interface CommercialCollaborationTemplate {
  id: CommercialCollaborationId;
  displayName: string;
  description: string;
  acceptanceActionPointCost: 0;
  requiresReleasedAlbum: boolean;
  requirementDescription: string;
}

export const COMMERCIAL_COLLABORATION_TEMPLATES = [
  {
    id: "brandPromotion",
    displayName: "品牌宣传",
    description: "为品牌拍摄宣传物料或发布联名内容。",
    acceptanceActionPointCost: 0,
    requiresReleasedAlbum: false,
    requirementDescription: "按合作机会的品牌调性与人气门槛判断",
  },
  {
    id: "albumLicensing",
    displayName: "专辑授权",
    description: "授权已发行作品用于影视、广告、游戏或线下空间。",
    acceptanceActionPointCost: 0,
    requiresReleasedAlbum: true,
    requirementDescription: "至少拥有 1 张已发行专辑",
  },
  {
    id: "platformPromotion",
    displayName: "平台推广",
    description: "与音乐或内容平台开展专题推荐和联合活动。",
    acceptanceActionPointCost: 0,
    requiresReleasedAlbum: false,
    requirementDescription: "按合作机会的平台受众与人气门槛判断",
  },
  {
    id: "customCollaboration",
    displayName: "定制合作",
    description: "按合作方要求创作并交付一首定制作品。",
    acceptanceActionPointCost: 0,
    requiresReleasedAlbum: false,
    requirementDescription: "按合作机会的创作力与交付期限判断",
  },
] as const satisfies readonly CommercialCollaborationTemplate[];
