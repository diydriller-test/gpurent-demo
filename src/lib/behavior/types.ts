export type BehaviorEventType = "page_view" | "click" | "custom";

export type BehaviorEvent = {
  type: BehaviorEventType;
  /** page_view: 보통 path, click: data-behavior 또는 ui.click, custom: 임의 이름 */
  name: string;
  occurred_at: string;
  properties?: Record<string, unknown>;
};

export type BehaviorIngestBody = {
  events: BehaviorEvent[];
  /** 로그인 시 localStorage의 유저 id (비로그인이면 null 생략 가능) */
  user_id?: number | null;
};
