import type { Component } from 'solid-js';
import { WorldEntryCard } from './world-entry-card';
import type { WorldLocation } from '../../types/world';

interface Props {
  locations: WorldLocation[];
}

export const WorldLocationList: Component<Props> = (props) => {
  return (
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      {props.locations.map((loc) => (
        <WorldEntryCard
          name={loc.name}
          tags={loc.tags}
          description={loc.description}
        />
      ))}
    </div>
  );
};
