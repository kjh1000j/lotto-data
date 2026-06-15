// 동행복권 자동 수집 → winners.json (직접 + 다중 프록시 폴백)
const fs = require('fs');
const FILE = 'winners.json';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

// 시도 순서: 직접 → 프록시들
function endpoints(api) {
  return [
    { name: '직접',       url: api, headers: { 'User-Agent': UA, 'Referer': 'https://www.dhlottery.co.kr/gameResult.do?method=byWin', 'Accept': 'application/json, */*', 'X-Requested-With': 'XMLHttpRequest' } },
    { name: 'codetabs',   url: `https://api.codetabs.com/v1/proxy/?quest=${encodeURIComponent(api)}`, headers: { 'User-Agent': UA } },
    { name: 'allorigins', url: `https://api.allorigins.win/raw?url=${encodeURIComponent(api)}`,        headers: { 'User-Agent': UA } },
    { name: 'corsproxy',  url: `https://corsproxy.io/?url=${encodeURIComponent(api)}`,                 headers: { 'User-Agent': UA } },
  ];
}

async function getDraw(no) {
  const api = `https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo=${no}`;
  for (const ep of endpoints(api)) {
    try {
      const res = await fetch(ep.url, { headers: ep.headers, signal: AbortSignal.timeout(15000) });
      const text = await res.text();
      let data;
      try { data = JSON.parse(text); }
      catch { console.log(`   ${no}회 [${ep.name}] 실패: ${text.slice(0,40).replace(/\s+/g,' ')}`); continue; }
      if (data.returnValue === 'success') {
        console.log(`✅ ${no}회 [${ep.name}] 수신 (${data.drwNoDate})`);
        return [data.drwNo, data.drwtNo1, data.drwtNo2, data.drwtNo3, data.drwtNo4, data.drwtNo5, data.drwtNo6, data.bnusNo];
      }
      if (data.returnValue === 'fail') {
        console.log(`⏳ ${no}회 [${ep.name}] returnValue=fail → 아직 추첨 전 (연결 정상!)`);
        return null;   // 연결은 됐고 회차가 없을 뿐 → 더 시도 불필요
      }
    } catch (e) {
      console.log(`   ${no}회 [${ep.name}] 오류: ${e.message}`);
    }
  }
  console.log(`❌ ${no}회: 모든 경로 실패`);
  return null;
}

(async () => {
  const arr = JSON.parse(fs.readFileSync(FILE, 'utf-8'));
  let last = arr.length ? arr[arr.length - 1][0] : 0;
  console.log(`현재 마지막 회차: ${last}`);
  let added = 0;
  for (let no = last + 1; no <= last + 5; no++) {
    const row = await getDraw(no);
    if (!row) break;
    arr.push(row); added++;
    console.log(`   → 추가: ${no}회 ${JSON.stringify(row)}`);
  }
  if (added) {
    fs.writeFileSync(FILE, JSON.stringify(arr));
    console.log(`✅ ${added}회 추가. 최신 ${arr[arr.length-1][0]}회`);
  } else {
    console.log('변경 없음');
  }
})();
