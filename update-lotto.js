// 동행복권 결과 자동 수집 → winners.json 갱신 (진단 로그 포함)
// 형식: [회차, n1, n2, n3, n4, n5, n6, 보너스]
const fs = require('fs');
const FILE = 'winners.json';

async function getDraw(no) {
  const url = `https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo=${no}`;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      console.log(`❌ ${no}회: JSON 아님 → API 차단 의심. 응답 앞부분: ${text.slice(0, 80)}`);
      return null;
    }
    if (data.returnValue !== 'success') {
      console.log(`⏳ ${no}회: returnValue=${data.returnValue} → 아직 추첨 전 (API는 정상 작동)`);
      return null;
    }
    console.log(`✅ ${no}회: 데이터 수신 (${data.drwNoDate})`);
    return [
      data.drwNo,
      data.drwtNo1, data.drwtNo2, data.drwtNo3,
      data.drwtNo4, data.drwtNo5, data.drwtNo6,
      data.bnusNo
    ];
  } catch (e) {
    console.log(`❌ ${no}회: 네트워크 오류 → ${e.message}`);
    return null;
  }
}

(async () => {
  const arr = JSON.parse(fs.readFileSync(FILE, 'utf-8'));
  let last = arr.length ? arr[arr.length - 1][0] : 0;
  console.log(`현재 winners.json 마지막 회차: ${last}`);
  let added = 0;

  for (let no = last + 1; no <= last + 5; no++) {
    const row = await getDraw(no);
    if (!row) break;
    arr.push(row);
    added++;
    console.log(`   → 추가: ${no}회 ${JSON.stringify(row)}`);
  }

  if (added) {
    fs.writeFileSync(FILE, JSON.stringify(arr));
    console.log(`✅ 총 ${added}회 추가. 최신 ${arr[arr.length - 1][0]}회`);
  } else {
    console.log('변경 없음 (추가할 새 회차 없음)');
  }
})();
