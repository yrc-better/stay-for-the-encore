import type { ActionId } from "./actions";
import type { Feedback } from "../types";

type ExtraFeedbackId =
  | "restDiminished"
  | "bandRestDiminished"
  | "noRecordableWork"
  | "insufficientFunds"
  | "noReleasableRecording";

export const FEEDBACK: Record<ActionId | ExtraFeedbackId, Feedback> = {
  practice: {
    title: "练到指尖发烫",
    body: "你把同一段过门弹到深夜。它终于不再像借来的句子，而像你自己的声音。"
  },
  write_riff: {
    title: "一段新的 Riff",
    body: "你在失真的尾音里抓到一个动机。它还不像歌，但已经有了方向。"
  },
  study_style: {
    title: "唱片和现场录像",
    body: "你把陌生曲风拆成和弦、音色和节奏。下一次写歌时，它会悄悄冒出来。"
  },
  part_time_job: {
    title: "换来一笔现金",
    body: "你用半天体力换来能继续排练的钱。回去的路上，手腕比早上更沉。"
  },
  rest: {
    title: "把琴放回架上",
    body: "你睡了一个完整的下午。醒来时，排练室的噪音还在脑子里，但身体终于不再发沉。"
  },
  restDiminished: {
    title: "休息也变得焦躁",
    body: "你试着休息，但脑子仍在排练毕业演出的每一处失误。"
  },
  socialize: {
    title: "人脉从闲聊开始",
    body: "你在吧台旁认识了几个常去 Livehouse 的人。没人承诺什么，但他们记住了乐队名。"
  },
  visit_guitar_shop: {
    title: "二手琴墙前",
    body: "你试了几把负担不起的琴。回到练习室时，你更清楚自己想要什么声音。"
  },
  breakthrough: {
    title: "把自己逼过界",
    body: "你连续练到天亮。某个瞬间手指跟上了脑子，代价是整个人像被掏空。"
  },
  rehearse: {
    title: "排练室里的统一",
    body: "你们终于在同一个重拍上落下。短暂的一秒里，这支乐队像是真的。"
  },
  band_write: {
    title: "团体创作",
    body: "你的 Riff 被鼓点推着向前，贝斯补上了空白。它开始从个人片段变成乐队作品。"
  },
  record: {
    title: "录下此刻",
    body: "录音不会原谅犹豫。每一次没弹稳的地方，都被清楚地留了下来。"
  },
  release: {
    title: "作品上线",
    body: "你们按下发布确认。那一刻之后，这首歌不再只是排练室里的秘密，它会被陌生人听见、跳过、收藏，或者记住。"
  },
  perform: {
    title: "灯亮之前",
    body: "你听见台下说话声逐渐低下去。第一下扫弦之后，排练室以外的世界终于回应了你。"
  },
  member_talk: {
    title: "把话说开",
    body: "你们没有解决所有问题，但至少这一次没有让沉默替你们做决定。"
  },
  promote: {
    title: "把歌推向人群",
    body: "海报、短视频和朋友转发把乐队推到更多人面前。随之而来的还有更多期待。"
  },
  negotiate: {
    title: "合作的门缝",
    body: "对方没有立刻答应，但留下了联系方式。你知道这可能是机会，也可能是另一种束缚。"
  },
  band_rest: {
    title: "乐队休整",
    body: "你们没有排练，也没有争论。只是一起吃了顿饭，像四个普通朋友。"
  },
  bandRestDiminished: {
    title: "休整也需要间隔",
    body: "你们试着再把这当成休息，但每个人都知道真正需要处理的问题还在原地。"
  },
  noRecordableWork: {
    title: "还录不了",
    body: "现在还没有排练度足够的完整歌曲。录音灯亮起之前，你们还需要把歌弹稳。"
  },
  insufficientFunds: {
    title: "钱还不够",
    body: "棚费、工程师和来回交通都要现金。歌已经准备好了，但账面还撑不起这次录音。"
  },
  noReleasableRecording: {
    title: "还没有可发行的录音",
    body: "现在没有未发布的录音。先把歌录下来，再决定它要以 Demo、单曲还是更完整的形式离开排练室。"
  }
};
