export interface PromptTemplateVariables {
  [key: string]: string | number | boolean | undefined;
}

export interface RenderedPrompt {
  systemPrompt: string;
  userPrompt: string;
  variablesUsed: string[];
}

const VARIABLE_REGEX = /\{\{(\w+)\}\}/g;
const IF_OPEN_REGEX = /\{\{#if\s+(\w+)\}\}/g;
const IF_CLOSE_REGEX = /\{\{\/if\}\}/g;

function renderTemplate(
  template: string,
  variables: PromptTemplateVariables,
): { rendered: string; usedVars: string[] } {
  const usedVars: Set<string> = new Set();

  let result = template;

  result = result.replace(IF_CLOSE_REGEX, "");

  const ifStack: Array<{ condition: string; matched: boolean; contentStart: number }> = [];
  let pos = 0;

  while (pos < result.length) {
    const openMatch = IF_OPEN_REGEX.exec(result);
    if (!openMatch || openMatch.index === undefined || openMatch.index >= result.length) break;

    const varName = openMatch[1];
    const value = variables[varName];
    const isTruthy = value !== undefined && value !== false && value !== "" && value !== 0;

    ifStack.push({ condition: varName, matched: isTruthy, contentStart: openMatch.index + openMatch[0].length });

    const closeIdx = result.indexOf("{{/if}}", openMatch.index);
    if (closeIdx === -1) break;

    const innerContent = result.slice(openMatch.index + openMatch[0].length, closeIdx);

    if (isTruthy) {
      usedVars.add(varName);
      result =
        result.slice(0, openMatch.index) +
        innerContent +
        result.slice(closeIdx + "{{/if}}".length);
      IF_OPEN_REGEX.lastIndex = openMatch.index + innerContent.length;
    } else {
      result = result.slice(0, openMatch.index) + result.slice(closeIdx + "{{/if}}".length);
      IF_OPEN_REGEX.lastIndex = openMatch.index;
    }
  }

  result = result.replace(VARIABLE_REGEX, (_match, varName) => {
    usedVars.add(varName);
    const value = variables[varName];
    return value !== undefined ? String(value) : `{{${varName}}}`;
  });

  return { rendered: result.trim(), usedVars: Array.from(usedVars) };
}

export interface PromptDefinition {
  id: string;
  name: string;
  description: string;
  systemTemplate?: string;
  userTemplate: string;
  category: string;
}

const BUILTIN_TEMPLATES: PromptDefinition[] = [
  {
    id: "chapter_continue",
    name: "Chapter Continuation",
    description: "Continue writing the current chapter based on existing context",
    systemTemplate:
      "You are an expert fiction writer assisting in novel creation. Write in a consistent style matching the existing text.",
    userTemplate: `Please continue writing the following chapter.

## Project Information
- **Project Name**: {{project_name}}
- **Genre**: {{genre}}

## Current Chapter
**Title**: {{chapter_title}}
**Summary so far**: {{chapter_summary}}

## Existing Content
\`\`\`
{{existing_content}}
\`\`\`

## Instructions
{{#if has_outline}}
Follow the outline below for plot direction:
\`\`\`
{{outline_content}}
\`\`\`
{{/if}}

{{#if word_count_target}}
Target approximately {{word_count_target}} words.
{{/if}}

Continue the story naturally from where it left off.`,
    category: "writing",
  },
  {
    id: "character_dialogue",
    name: "Character Dialogue Generation",
    description: "Generate natural dialogue between characters",
    systemTemplate:
      "You are a dialogue specialist. Create authentic, character-driven conversations that reveal personality and advance the plot.",
    userTemplate: `Generate dialogue for the following scene.

## Characters Involved
{{character_list}}

## Scene Context
- **Location**: {{location}}
- **Time of day**: {{time_of_day}}
- **Mood**: {{mood}}

## Conversation Topic
{{topic}}

## Previous Context (optional)
{{previous_context}}

{{#if character_traits}}
Keep these traits in mind:
{{character_traits}}
{{/if}}

Write natural, engaging dialogue that reveals character voice.`,
    category: "writing",
  },
  {
    id: "outline_expand",
    name: "Outline Expansion",
    description: "Expand a high-level outline into detailed chapter-by-chapter breakdown",
    systemTemplate:
      "You are a story architect skilled at structural planning and pacing.",
    userTemplate: `Expand the following outline into detailed chapter-level structure.

## Project
- **Project Name**: {{project_name}}
- **Genre**: {{genre}}
- **Estimated total chapters**: {{total_chapters}}

## High-Level Outline
\`\`\`
{{outline_summary}}
\`\`\`

{{#if themes_to_explore}}
Themes to explore:
{{themes_to_explore}}
{{/if}}

For each chapter provide:
1. Chapter title
2. Key events / beats
3. Character arcs involved
4. Word count estimate`,
    category: "planning",
  },
  {
    id: "text_polish",
    name: "Text Polish & Enhancement",
    description: "Improve prose quality while preserving meaning and voice",
    systemTemplate:
      "You are an editor specializing in literary fiction. Enhance clarity, flow, and emotional impact without changing the author's voice or intent.",
    userTemplate: `Polish the following text to improve quality.

## Original Text
\`\`\`
{{original_text}}
\`\`\`

{{#if focus_areas}}
Focus on these areas:
{{focus_areas}}
{{/if}}

{{#if tone_instructions}}
Tone instructions: {{tone_instructions}}
{{/if}}

Return only the polished version with minimal changes.`,
    category: "editing",
  },
  {
    id: "style_transfer",
    name: "Style Transfer",
    description: "Rewrite text in a different literary style or author's voice",
    systemTemplate:
      "You are a versatile writer capable of mimicking different literary styles and voices.",
    userTemplate: `Rewrite the following text in a different style.

## Source Text
\`\`\`
{{source_text}}
\`\`\`

## Target Style
**Style/Tone**: {{target_style}}
{{#if reference_author}}
**Reference Author Voice**: {{reference_author}}
{{/if}}
{{#if specific_instructions}}
Additional Instructions: {{specific_instructions}}
{{/if}}

Maintain all factual content, plot points, and character actions. Only change the stylistic presentation.`,
    category: "editing",
  },
];

class PromptTemplateEngineImpl {
  private templates: Map<string, PromptDefinition> = new Map();

  constructor() {
    for (const tpl of BUILTIN_TEMPLATES) {
      this.templates.set(tpl.id, tpl);
    }
  }

  register(template: PromptDefinition): void {
    this.templates.set(template.id, template);
  }

  get(templateId: string): PromptDefinition | undefined {
    return this.templates.get(templateId);
  }

  list(): PromptDefinition[] {
    return Array.from(this.templates.values());
  }

  listByCategory(category: string): PromptDefinition[] {
    return Array.from(this.templates.values()).filter((t) => t.category === category);
  }

  render(
    templateId: string,
    variables: PromptTemplateVariables,
  ): RenderedPrompt | null {
    const tpl = this.templates.get(templateId);
    if (!tpl) return null;

    let systemRendered = "";
    const systemVars: string[] = [];
    if (tpl.systemTemplate) {
      const sysResult = renderTemplate(tpl.systemTemplate, variables);
      systemRendered = sysResult.rendered;
      systemVars.push(...sysResult.usedVars);
    }

    const userResult = renderTemplate(tpl.userTemplate, variables);
    const allVars = [...new Set([...systemVars, ...userResult.usedVars])];

    return {
      systemPrompt: systemRendered,
      userPrompt: userResult.rendered,
      variablesUsed: allVars,
    };
  }

  hasTemplate(templateId: string): boolean {
    return this.templates.has(templateId);
  }

  remove(templateId: string): boolean {
    return this.templates.delete(templateId);
  }
}

export const PromptTemplateEngine = new PromptTemplateEngineImpl();
