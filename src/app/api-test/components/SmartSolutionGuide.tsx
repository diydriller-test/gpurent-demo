"use client";

type ApiId = "llm" | "embedding" | "reranker" | "tts" | "stt";

type Props = {
  selectedApi: ApiId;
  onNavigateApi: (api: ApiId) => void;
};

function GuideApiLink({
  label,
  api,
  onNavigateApi,
}: {
  label: string;
  api: ApiId;
  onNavigateApi: (api: ApiId) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onNavigateApi(api)}
      className="font-semibold text-[#10b981] underline decoration-[#10b981]/60 underline-offset-2 transition-colors hover:text-[#34d399]"
    >
      [{label}]
    </button>
  );
}

export function SmartSolutionGuide({ selectedApi, onNavigateApi }: Props) {
  if (
    selectedApi !== "llm" &&
    selectedApi !== "reranker" &&
    selectedApi !== "embedding"
  ) {
    return null;
  }

  if (selectedApi === "reranker") {
    return (
      <p className="text-sm leading-relaxed text-foreground/90">
        <span className="mr-2">🎯</span>
        <span className="font-semibold text-foreground">더 나은 검색을 원하시나요?</span>{" "}
        <GuideApiLink
          label="Embedding"
          api="embedding"
          onNavigateApi={onNavigateApi}
        />
        으로 검색 성능을 높이고,{" "}
        <GuideApiLink label="Text" api="llm" onNavigateApi={onNavigateApi} /> API를
        연결해 답변까지 자동화해보세요.
      </p>
    );
  }

  if (selectedApi === "embedding") {
    return (
      <p className="text-sm leading-relaxed text-foreground/90">
        <span className="mr-2">🔍</span>
        <span className="font-semibold text-foreground">지능형 검색의 시작!</span>{" "}
        변환된 벡터를{" "}
        <GuideApiLink
          label="Reranker"
          api="reranker"
          onNavigateApi={onNavigateApi}
        />
        와 조합하면 검색 품질이 비약적으로 향상됩니다.
      </p>
    );
  }

  return (
    <p className="text-sm leading-relaxed text-foreground/90">
      <span className="mr-2">🚀</span>
      <span className="font-semibold text-foreground">
        복잡한 비즈니스 로직도 척척!
      </span>{" "}
      생성된 답변을{" "}
      <GuideApiLink
        label="Reranker"
        api="reranker"
        onNavigateApi={onNavigateApi}
      />
      로 최적화하거나{" "}
      <GuideApiLink label="TTS" api="tts" onNavigateApi={onNavigateApi} />를 연결해
      음성 서비스를 만들어보세요.
    </p>
  );
}
