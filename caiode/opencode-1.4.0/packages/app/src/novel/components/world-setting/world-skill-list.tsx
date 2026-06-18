import type { Component } from 'solid-js';
import { WorldEntryCard } from './world-entry-card';
import type { WorldSkill } from '../../types/world';

interface Props {
  skills: WorldSkill[];
}

export const WorldSkillList: Component<Props> = (props) => {
  return (
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      {props.skills.map((skill) => (
        <WorldEntryCard
          name={skill.name}
          tags={[skill.type, ...(skill.level ? [skill.level] : [])]}
          description={skill.description}
        />
      ))}
    </div>
  );
};
