import type { Dispatch, SetStateAction } from "react";

import { PlaygroundDeveloperCodeSection } from "./PlaygroundDeveloperCodeSection";

type Props = {
  devCodeOpen: boolean;
  setDevCodeOpen: Dispatch<SetStateAction<boolean>>;
  devCodeCopied: boolean;
  setDevCodeCopied: Dispatch<SetStateAction<boolean>>;
  embeddingDevCodePython: string;
};

export function EmbeddingDeveloperCodeSection({
  devCodeOpen,
  setDevCodeOpen,
  devCodeCopied,
  setDevCodeCopied,
  embeddingDevCodePython,
}: Props) {
  return (
    <PlaygroundDeveloperCodeSection
      devCodeOpen={devCodeOpen}
      setDevCodeOpen={setDevCodeOpen}
      devCodeCopied={devCodeCopied}
      setDevCodeCopied={setDevCodeCopied}
      codePython={embeddingDevCodePython}
      footer={
        <>
          51089 포트의 OpenAI 호환 Embeddings로 4,096차원 의미 벡터를 받아올 수
          있습니다. 데모 앱은{" "}
          <span className="text-foreground/80">/api/embedding</span> 프록시를
          통해 호출합니다.
        </>
      }
    />
  );
}
