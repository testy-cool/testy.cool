import type { LanguageRegistration } from "shiki";

/**
 * Highlighting for mdtask spec files and terminal transcripts, used by the
 * Tried note on mdtask. Scopes are chosen for what the github-light and
 * github-dark themes colour: tags green, priorities red, properties orange,
 * ids purple, done checkboxes green, the command on a prompt line blue.
 */
export const mdtaskGrammar: LanguageRegistration = {
  name: "mdtask",
  scopeName: "source.mdtask",
  patterns: [
    {
      match: "^(\\$ )(\\S+)(.*)$",
      captures: {
        "1": { name: "punctuation.definition.comment.mdtask" },
        "2": { name: "support.function.mdtask" },
        "3": { patterns: [{ include: "#tokens" }] },
      },
    },
    { match: "^#{1,6} .*$", name: "markup.heading.mdtask" },
    { match: "^[\\w./-]+\\.md:\\d+$", name: "string.mdtask" },
    { include: "#tokens" },
  ],
  repository: {
    tokens: {
      patterns: [
        { match: "\\[x\\]", name: "markup.inserted.mdtask" },
        { match: "\\[ \\]", name: "punctuation.definition.list.mdtask" },
        { match: "\\b[A-Z]{2,}-\\d+\\b", name: "entity.name.function.mdtask" },
        { match: "(?<=\\s|^)#[\\w-]+", name: "entity.name.tag.mdtask" },
        { match: "(?<=\\s|^)![\\w-]+", name: "keyword.mdtask" },
        { match: "(?<=\\s|^)@[\\w-]+:[\\w-]+", name: "variable.parameter.mdtask" },
        { match: "\\*\\*[^*]+\\*\\*", name: "markup.bold.mdtask" },
      ],
    },
  },
};
