// winners.json 자동 갱신 — jooy34/lotto-history-data(GitHub) 미러에서 받음
// dhlottery 직접 호출 안 함 → 봇/IP 차단 없음. GitHub Action에서 그대로 작동.
const fs = require('fs');
const FILE = 'winners.json';
const SRC = 'https://raw.githubusercontent.com/jooy34/lotto-history-data/main/lotto_draws.json';

(async () => {
  const arr = JSON.parse(fs.readFileSync(FILE, 'utf-8'));
  const last = arr.length ? arr[arr.length - 1][0] : 0;
  console.log(`현재 winners.json 마지막 회차: ${last}`);

  let src;
  try {
    const res = await fetch(SRC, { headers: { 'User-Agent': 'lotto-updater' } });
    src = await res.json();
  } catch (e) {
    console.log(`❌ 소스 받기 실패: ${e.message}`);
    return;
  }

  // drawNo → [회차, n1..n6, 보너스] 매핑
  const map = new Map();
  for (const d of src) {
    if (d && d.drawNo && Array.isArray(d.numbers) && d.numbers.length === 6) {
      map.set(d.drawNo, [d.drawNo, ...d.numbers, d.bonusNumber]);
    }
  }
  const srcMax = Math.max(...map.keys());
  console.log(`소스(jooy34) 최신 회차: ${srcMax}`);

  // last+1부터 연속으로 추가 (빠진 회차 만나면 중단 → winners.json 연속성 유지)
  let added = 0;
  for (let no = last + 1; ; no++) {
    if (!map.has(no)) break;
    const row = map.get(no);
    arr.push(row);
    added++;
    console.log(`   → 추가: ${no}회 ${JSON.stringify(row)}`);
  }

  if (added) {
    fs.writeFileSync(FILE, JSON.stringify(arr));
    console.log(`✅ ${added}회 추가. 최신 ${arr[arr.length - 1][0]}회`);
  } else {
    console.log('변경 없음 (추가할 새 회차 없음)');
  }
})();
