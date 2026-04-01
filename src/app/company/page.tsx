import { InfoPageLayout } from "@/components/InfoPageLayout";

const sections = [
  {
    title: "회사소개 정보",
    rows: [
      { label: "상호명", value: "주식회사 코그로보" },
      { label: "서비스명", value: "AI API 오마카세" },
      { label: "대표이사", value: "정항덕" },
      { label: "주소", value: "08547 서울특별시 금천구 남부순환로 1384 영남빌딩 4층 402호" },
      { label: "사업자등록번호", value: "3998801800" },
      { label: "통신판매업신고", value: "2023-서울금천-1423" },
      { label: "개인정보 관리책임", value: "정항덕" },
      { label: "호스팅제공", value: "카페24(주)" },
    ],
  },
];

export default function CompanyPage() {
  return (
    <InfoPageLayout
      title="회사소개"
      currentLabel="회사소개"
      sections={sections}
    />
  );
}
