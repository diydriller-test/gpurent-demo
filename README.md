This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## 환경 변수 (로컬 실행)

실제 키는 Git에 올리지 마세요. 저장소에는 `.env.example`만 포함됩니다.

```bash
cp .env.example .env.local
```

`.env.local`을 열어 아래 값을 채웁니다.

| 변수 | 용도 |
|------|------|
| `OPENAI_API_KEY` | `/api/chat` (LLM) |
| `QWEN_API_KEY` | `/api/rerank` (Reranker, `access_token`) |
| `RERANK_API_KEY` | (선택) `QWEN_API_KEY` 없을 때 Rerank용 폴백 |
| `EMBEDDING_API_KEY` | `/api/embedding` (Embedding, `access_token`) |
| `INTERNAL_API_URL` | (선택) Next 서버 → 내부 백엔드 베이스 URL; 비우면 기본 53001 |

배포 시에는 Vercel 등 호스팅의 **Environment Variables**에 동일한 이름으로 등록하면 됩니다.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.



Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
