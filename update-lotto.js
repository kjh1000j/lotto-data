// 동행복권 결과 자동 수집 → winners.json 갱신
// 형식: [회차, n1, n2, n3, n4, n5, n6, 보너스]
const fs = require('fs');
const FILE = 'winners.json';

async function getDraw(no) {
  const url = `https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo=${no}`;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const text = await res.text();
    const data = JSON.parse(text);          // 차단되면 HTML이 와서 파싱 실패 → catch
    if (data.returnValue !== 'success') return null;  // 아직 추첨 안 됨
    return [
      data.drwNo,
      data.drwtNo1, data.drwtNo2, data.drwtNo3,
      data.drwtNo4, data.drwtNo5, data.drwtNo6,
      data.bnusNo
    ];
  } catch (e) {
    console.log(`${no}회 조회 실패:`, e.message);
    return null;
  }
}

(async () => {
  const arr = JSON.parse(fs.readFileSync(FILE, 'utf-8'));
  let last = arr.length ? arr[arr.length - 1][0] : 0;
  let added = 0;

  // 마지막 회차 다음부터 최대 5회까지 시도 (밀린 경우 대비)
  for (let no = last + 1; no <= last + 5; no++) {
    const row = await getDraw(no);
    if (!row) break;                         // 더 이상 새 회차 없음
    arr.push(row);
    added++;
    console.log(`추가: ${no}회 →`, JSON.stringify(row));
  }

  if (added) {
    fs.writeFileSync(FILE, JSON.stringify(arr));  // 기존과 동일한 컴팩트 1줄 포맷
    console.log(`✅ ${added}회 추가 완료. 최신 ${arr[arr.length - 1][0]}회`);
  } else {
    console.log('새 회차 없음 (변경 없음)');
  }
})();
