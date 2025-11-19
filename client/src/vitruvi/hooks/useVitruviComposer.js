import { useMutation } from "@tanstack/react-query";

import { analyzePrompt, analyzeAndGenerate } from "../api";

export function useVitruviComposer() {
  const analyzeMutation = useMutation({
    mutationKey: ["vitruvi", "analyze"],
    mutationFn: ({ prompt, selected }) => analyzePrompt(prompt, selected),
  });

  const composeMutation = useMutation({
    mutationKey: ["vitruvi", "compose"],
    mutationFn: ({ prompt, selected }) => analyzeAndGenerate(prompt, selected),
  });

  return { analyzeMutation, composeMutation };
}

export default useVitruviComposer;
