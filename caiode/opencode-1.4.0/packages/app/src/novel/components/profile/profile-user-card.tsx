import type { Component } from 'solid-js';
import { NovelAvatar } from '../ui/novel-avatar';
import { NovelBadge } from '../ui/novel-badge';

interface Props {
  name: string;
  isVip: boolean;
  vipExpiresAt: string;
  registeredAt: string;
}

export const ProfileUserCard: Component<Props> = (props) => {
  return (
    <div class="bg-white rounded-xl border border-[#cbc3d7] p-6 flex items-center gap-6">
      <NovelAvatar name={props.name} size="xl" />
      <div class="flex flex-col gap-1">
        <h2 class="text-xl font-bold text-[#0d1c2f]">{props.name}</h2>
        <div class="flex items-center gap-2">
          {props.isVip && <NovelBadge status="vip">VIP会员</NovelBadge>}
          <span class="text-xs text-[#494454]">到期: {props.vipExpiresAt}</span>
        </div>
        <span class="text-xs text-[#7b7486]">注册于 {props.registeredAt}</span>
      </div>
    </div>
  );
};
