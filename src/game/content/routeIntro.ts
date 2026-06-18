import type { Feedback, RouteId } from "../types";

const ROUTE_LABELS: Record<RouteId, string> = {
  technician: "技术宅",
  writer: "创作型",
  performer: "舞台型",
  rebel: "叛逆型"
};

const ROUTE_INTRO_LINES: Record<RouteId, string> = {
  technician: "你习惯先听设备里的噪声，再判断一首歌有没有站住。",
  writer: "你总是先听见旋律里的缺口，再决定要不要让别人靠近。",
  performer: "你知道灯光亮起来以后，第一下扫弦必须比心跳更稳。",
  rebel: "你不太相信规则，只相信排练室里真正刺耳的那一下。"
};

const BANDMATE_INTRO_LINES = [
  "主唱林夏把歌词写在皱掉的打印纸背面，她能把一句普通旋律唱得像当众坦白，也最怕台下没有人回应。",
  "贝斯手周航话不多，争执快失控时总是先把低频压回地面；他像这支乐队的秤，谁偏离了都会先被他看见。",
  "鼓手唐野来得常常最晚，却最先听出大家有没有真的合上拍；他不擅长劝人，只会把鼓点敲得更响。"
];

export function createRouteIntroFeedback(route: RouteId, bandName: string): Feedback {
  const routeLabel = ROUTE_LABELS[route];
  const bandmateIntro = BANDMATE_INTRO_LINES.join("");

  return {
    title: "校园序章",
    body: `${bandName} 在毕业演出前一个月定下了名字。你是这支乐队的吉他手，带着${routeLabel}的出身路线站在排练室里。${ROUTE_INTRO_LINES[route]}${bandmateIntro}今晚的排练不会只是热身，它会决定你们四个人毕业后还能不能继续走下去。`
  };
}
