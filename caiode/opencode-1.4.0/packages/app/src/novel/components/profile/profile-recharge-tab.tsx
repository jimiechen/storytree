import type { Component } from 'solid-js';
import { NovelButton } from '../ui/novel-button';
import type { RechargePackage } from '../../types/profile';

interface Props {
  packages: RechargePackage[];
}

export const ProfileRechargeTab: Component<Props> = (props) => {
  return (
    <div>
      <div class="grid grid-cols-2 gap-4">
        {props.packages.map((pkg) => (
          <div
            class={`bg-white rounded-xl border p-5 text-center cursor-pointer hover:border-[#6b38d4] transition-all ${
              pkg.isPopular ? 'border-2 border-[#6b38d4] relative' : 'border-[#cbc3d7]'
            }`}
          >
            {pkg.isPopular && (
              <span class="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#6b38d4] text-white text-xs font-bold px-3 py-1 rounded-full">
                推荐
              </span>
            )}
            <div class="text-3xl font-bold text-[#6b38d4]">
              {pkg.credits}<span class="text-sm ml-1">积分</span>
            </div>
            <div class="text-lg text-[#0d1c2f] mt-1">¥{pkg.price}</div>
            {pkg.bonus && <div class="text-xs text-[#6b38d4] mt-2">{pkg.bonus}</div>}
          </div>
        ))}
      </div>
      <NovelButton variant="outlined" icon="account_balance_wallet" class="w-full mt-6">
        支付宝支付
      </NovelButton>
      <p class="text-xs text-[#7b7486] text-center mt-3">充值任意金额即获30天VIP</p>
    </div>
  );
};
