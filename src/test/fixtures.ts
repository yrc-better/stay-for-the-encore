import { CANDIDATES_BY_ROLE } from "../data";
import {
  createInitialGameState,
  type GameState,
  type MemberSeed,
} from "../domain";

function candidateSeed(
  candidate: (typeof CANDIDATES_BY_ROLE)["leadGuitar"][number] |
    (typeof CANDIDATES_BY_ROLE)["bass"][number] |
    (typeof CANDIDATES_BY_ROLE)["drums"][number] |
    (typeof CANDIDATES_BY_ROLE)["keyboard"][number],
): MemberSeed {
  return {
    id: candidate.id,
    name: candidate.name,
    age: candidate.age,
    role: candidate.role,
    avatarId: candidate.id,
    biography: candidate.biography,
    quote: candidate.quote,
    traits: candidate.tags.map((tag) => tag.label),
    stats: {
      professional: candidate.stats.professional,
      creativity: candidate.stats.creation,
      performance: candidate.stats.performance,
      popularity: candidate.stats.heat,
      belonging: candidate.stats.belonging,
    },
  };
}

export function createTestGame(): GameState {
  return createInitialGameState({
    bandName: "潮汐背面",
    genre: "indie",
    protagonist: {
      name: "林遥",
      avatarId: "player-midnight",
    },
    selectedMembers: [
      candidateSeed(CANDIDATES_BY_ROLE.leadGuitar[0]),
      candidateSeed(CANDIDATES_BY_ROLE.bass[0]),
      candidateSeed(CANDIDATES_BY_ROLE.drums[0]),
      candidateSeed(CANDIDATES_BY_ROLE.keyboard[0]),
    ],
    seed: 42,
    gameId: "ui-test",
    createdAt: "2026-07-16T00:00:00.000Z",
  });
}

