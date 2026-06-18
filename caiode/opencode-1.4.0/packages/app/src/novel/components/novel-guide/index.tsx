import type { Component } from 'solid-js';
import { Show } from 'solid-js';
import { useNovelGuide } from '../../hooks/use-novel-guide';
import { useNovelNavigation } from '../../hooks/use-novel-navigation';
import { GuideEntry } from './guide-entry';
import { GuideQAStep } from './guide-qa-step';

export const NovelGuidePage: Component = () => {
  const nav = useNovelNavigation();
  const guide = useNovelGuide();
  const totalQuestions = guide.allQuestions.length;

  return (
    <Show
      when={guide.current()}
      fallback={
        <GuideEntry onCreate={() => nav.openModal('guide-create')} />
      }
    >
      <GuideQAStep
        step={guide.step()}
        total={totalQuestions}
        question={guide.question()}
        current={guide.current()}
        onAnswer={guide.answerQuestion}
        onPrev={guide.goToPrev}
        onSkip={() => nav.openView('workspace')}
        onClose={() => nav.openView('workspace')}
      />
    </Show>
  );
};
