import React, { useState, useEffect } from 'react';

// 1. API 아이템의 데이터 구조를 위한 타입 정의
interface ApiItem {
  baseYm?: string;
  areaCd?: string;
  signguCd?: string;
  [key: string]: any; // 다른 필드들도 유연하게 받기 위함
}

const LocalCurrencyList = () => {
  // 2. useState에 <ApiItem[]> 타입을 명시하여 never[] 오해 방지
  const [items, setItems] = useState<ApiItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

useEffect(() => {
    const fetchData = async () => {
      try {
        const baseUrl = "https://apis.data.go.kr/B551011/AreaTarDivService/areaTouDivList";
        
        // 충청남도의 주요 시군구 코드 리스트 (예시)
        const chungnamSignguList = [
          { code: "44131", name: "천안시 동남구" },
          { code: "44133", name: "천안시 서북구" },
          { code: "44180", name: "공주시" },
          { code: "44200", name: "보령시" },
          { code: "44230", name: "아산시" },
          { code: "44250", name: "서산시" },
          { code: "44270", name: "논산시" },
          { code: "44360", name: "당진시" },
          { code: "44800", name: "홍성군" },
          { code: "44825", name: "예산군" }
        ];

        // 각 시군구별로 API를 병렬 요청
        const promises = chungnamSignguList.map(async (sig) => {
          const params = {
            serviceKey: "80b1ef0e84fc6a5e398013574f6f9f31f8ca13b35bb8caa24f73cce25b85587c",
            MobileApp: "AppTest",
            MobileOS: "ETC",
            pageNo: "1",
            numOfRows: "10",
            baseYm: "202509",
            areaCd: "44",
            signguCd: sig.code,
            expDivlxdCd: "32",
            _type: "json"
          };

          const queryString = new URLSearchParams(params).toString();
          const res = await fetch(`${baseUrl}?${queryString}`);
          const data = await res.json();
          
          const item = data.response?.body?.items?.item;
          if (!item) return null;
          
          // 단일 객체든 배열이든 안전하게 처리하여 반환
          return Array.isArray(item) ? item : [item];
        });

        const results = await Promise.all(promises);
        // 모든 결과를 하나의 1차원 배열로 합침
        const allItems = results.flat().filter(Boolean);

        setItems(allItems);
      } catch (err: any) {
        setError(err.message || '에러가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div>데이터를 불러오는 중입니다...</div>;
  if (error) return <div>에러 발생: {error}</div>;

  return (
    <div style={{ padding: '20px' }}>
      <h2>모먼트립 추천 및 미션 지역 정보</h2>
      {items.length === 0 ? (
        <p>조회된 데이터가 없습니다. (areaCd나 signguCd를 변경해 보세요)</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {items.map((item, index) => (
            <li key={index} style={{ border: '1px solid #ddd', padding: '15px', marginBottom: '10px', borderRadius: '8px' }}>
              <p><strong>기준 연월:</strong> {item.baseYm}</p>
              <p><strong>지역 코드:</strong> {item.areaCd} / {item.signguCd}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default LocalCurrencyList;