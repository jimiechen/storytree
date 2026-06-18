import type { Component } from 'solid-js';
import { NovelButton } from '../ui/novel-button';
import { NovelIcon } from '../layout/novel-icon';
import type { CreditRecord } from '../../types/profile';

interface Props {
  credits: number;
  records: CreditRecord[];
}

export const ProfileCreditsTab: Component<Props> = (props) => {
  return (
    <div>
      <div class="bg-gradient-to-br from-[#e9ddff] to-[#e0d4ff] rounded-xl p-6 text-center">
        <div class="text-5xl font-bold text-[#6b38d4]">{props.credits}</div>
        <div class="text-sm text-[#494454] mt-1">当前积分</div>
        <NovelButton variant="tonal" class="mt-4">获取更多积分</NovelButton>
      </div>
      <div class="mt-6 space-y-0 divide-y divide-[#cbc3d7]">
        {props.records.map((record) => (
          <div class="flex items-center justify-between py-4">
            <div class="flex items-center gap-3">
              <span class={record.delta >= 0 ? 'text-green-600' : 'text-[#ba1a1a]'}>
                <NovelIcon name={record.delta >= 0 ? 'add_circle' : 'remove_circle'} size={18} />
              </span>
              <div>
                <div class="text-sm text-[#0d1c2f]">{record.reason}</div>
                <div class="text-xs text-[#7b7486]">{record.date}</div>
              </div>
            </div>
            <span class={`text-sm font-bold ${record.delta >= 0 ? 'text-green-600' : 'text-[#ba1a1a]'}`}>
              {record.delta >= 0 ? '+' : ''}{record.delta}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
