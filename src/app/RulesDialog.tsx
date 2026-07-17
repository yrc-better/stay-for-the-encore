import { Dialog, StatusBadge } from "../components";

interface RulesDialogProps {
  open: boolean;
  onClose: () => void;
}

const attributeRules = [
  ["创作力", "主要由全队创作最高的两名成员决定。"],
  ["演奏力", "全员专业平均值占七成，最低专业占三成。"],
  ["舞台力", "主角表现、全员表现与团魂共同决定。"],
  ["人气", "乐队积累占七成半，成员热度占两成半。"],
  ["团魂", "来自全员归属感，并受剧情标签影响。"],
  ["资金", "所有收入与支出都使用乐队公共账户。"],
];

export function RulesDialog({ open, onClose }: RulesDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="工作站规则"
      description="这些说明随时可以查看，不会打断月份推进。"
      size="lg"
    >
      <div className="rules-grid">
        <section>
          <h3>每个月</h3>
          <p>你拥有三个共享行动点。个人行动和乐队行动使用同一组行动点。</p>
          <ul>
            <li>同一种行动每月只能执行一次。</li>
            <li>行动的固定收益一定生效，之后再结算随机追加结果。</li>
            <li>提前结束月份时，未使用行动点会让主角恢复状态。</li>
            <li>四名队友每个月结束后自动恢复一级状态。</li>
            <li>月末固定扣除 ¥1,000 运营费。</li>
          </ul>
        </section>
        <section>
          <h3>乐队属性</h3>
          <div className="rules-attributes">
            {attributeRules.map(([label, text]) => (
              <div key={label}>
                <StatusBadge tone="accent" showIcon={false}>
                  {label}
                </StatusBadge>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </section>
        <section>
          <h3>长期规则</h3>
          <ul>
            <li>风格与五人阵容一局内永久固定。</li>
            <li>专辑按创作、编曲和录音三个阶段推进。</li>
            <li>成员归属感降至 0 后会进入六个月决裂危机。</li>
            <li>长期负债会进入六个月财务危机。</li>
            <li>每十二个月静默自动保存一次，也可随时手动保存。</li>
            <li>乐队最多活动二十年，也可能提前结束。</li>
          </ul>
        </section>
      </div>
    </Dialog>
  );
}

