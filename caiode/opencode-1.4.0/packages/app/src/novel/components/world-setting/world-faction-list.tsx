import type { Component } from 'solid-js';
import { WorldEntryCard } from './world-entry-card';
import type { WorldFaction } from '../../types/world';

const INFLUENCE_LABEL: Record<string, string> = {
  high: '高影响力',
  medium: '中等影响力',
  low: '低影响力',
};

interface Props {
  factions: WorldFaction[];
}

export const WorldFactionList: Component<Props> = (props) => {
  return (
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      {props.factions.map((fac) => (
        <WorldEntryCard
          name={fac.name}
          tags={[fac.type]}
          description={fac.description}
          extra={INFLUENCE_LABEL[fac.influence]}
        />
      ))}
    </div>
  );
};
