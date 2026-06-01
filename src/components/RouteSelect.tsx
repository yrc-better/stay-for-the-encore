import { useState } from "react";
import { DEFAULT_BAND_NAME } from "../game/config/defaults";
import type { RouteId } from "../game/types";

const routes: Array<{ id: RouteId; label: string; description: string }> = [
  { id: "technician", label: "技术宅", description: "技术高，舞台弱。" },
  { id: "writer", label: "创作型", description: "创作高，容易触发创作冲突。" },
  { id: "performer", label: "舞台型", description: "舞台高，名声增长快。" },
  { id: "rebel", label: "叛逆型", description: "冲突多，风险高。" }
];

export function RouteSelect({ onStart }: { onStart: (route: RouteId, bandName: string) => void }) {
  const [bandName, setBandName] = useState(DEFAULT_BAND_NAME);

  return (
    <main className="route-select">
      <section className="route-panel" aria-labelledby="route-title">
        <h1 id="route-title">乐队模拟器</h1>
        <label className="band-name-field">
          <span>乐队名</span>
          <input value={bandName} onChange={(event) => setBandName(event.target.value)} />
        </label>
        <div className="route-grid">
          {routes.map((route) => (
            <button key={route.id} className="route-card" onClick={() => onStart(route.id, bandName)}>
              <strong>{route.label}</strong>
              <span>{route.description}</span>
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}
