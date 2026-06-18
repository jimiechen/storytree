import { createSignal, createMemo } from 'solid-js'
import type { GuideProject, NovelGenre, NovelTargetLength } from '../types/novel-guide'
import { guideQuestions } from '../mock-data/guide-questions'

export function useNovelGuide() {
  const [projects, setProjects] = createSignal<GuideProject[]>([])
  const [current, setCurrent] = createSignal<GuideProject | null>(null)
  const step = createMemo(() => current()?.currentStep ?? 0)
  const question = createMemo(() => guideQuestions.find(q => q.id === step()) ?? null)

  function createProject(title: string, genre: NovelGenre, targetLength: NovelTargetLength) {
    const p: GuideProject = {
      id: `guide-${Date.now()}`,
      title,
      genre,
      targetLength,
      answers: {},
      currentStep: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setProjects(prev => [...prev, p])
    setCurrent(p)
    return p
  }

  function answerQuestion(qId: number, answer: string | string[]) {
    setCurrent(prev =>
      prev
        ? {
            ...prev,
            answers: { ...prev.answers, [qId]: answer },
            currentStep: Math.min(qId + 1, guideQuestions.length + 1),
            updatedAt: new Date().toISOString(),
          }
        : null
    )
  }

  function goToPrev() {
    setCurrent(prev =>
      prev ? { ...prev, currentStep: Math.max(prev.currentStep - 1, 1) } : null
    )
  }

  return {
    projects,
    current,
    step,
    question,
    allQuestions: guideQuestions,
    createProject,
    answerQuestion,
    goToPrev,
  }
}
