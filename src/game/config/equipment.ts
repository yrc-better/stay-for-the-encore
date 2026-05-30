import type { EquipmentLoadout } from "../types";

export const DEFAULT_EQUIPMENT: EquipmentLoadout = {
  guitar: {
    id: "guitar.used-jazzmaster",
    name: "二手 Jazzmaster",
    tags: ["noise", "alternative", "offset"],
    modifiers: { riffQuality: 2 }
  },
  pedals: [
    { id: "pedal.overdrive", name: "Overdrive", tags: ["drive"], modifiers: { performanceStability: 1 } },
    { id: "pedal.chorus", name: "Chorus", tags: ["chorus"], modifiers: { styleDiscovery: 1 } },
    { id: "pedal.delay", name: "Delay", tags: ["delay"], modifiers: { recordingQuality: 1 } }
  ],
  amp: {
    id: "amp.practice-combo",
    name: "练习室共用 Combo",
    tags: ["practice"],
    modifiers: { recordingQuality: -2, performanceStability: 0 }
  }
};
