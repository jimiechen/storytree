import type { Component } from 'solid-js';
import { WorldEntryCard } from './world-entry-card';
import type { WorldItem } from '../../types/world';

interface Props {
  items: WorldItem[];
}

export const WorldItemList: Component<Props> = (props) => {
  return (
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      {props.items.map((item) => (
        <WorldEntryCard
          name={item.name}
          tags={[item.type, ...item.tags]}
          description={item.description}
        />
      ))}
    </div>
  );
};
