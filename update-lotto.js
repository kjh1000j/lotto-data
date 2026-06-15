// 동행복권 결과 자동 수집 → winners.json (직접 + 프록시 2단 우회)
// 형식: [회차, n1..n6, 보너스]
const fs = require('fs');
const FILE = 'winners.json';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Referer': 'https://www.dhlottery.co.kr/gameResult.do?method=byWin',
  'Accept': 'application/json, text/javascript, */*; q=0.01',
  'Accept-Language': 'ko-KR,ko;q=0.9',
  'X-Requested-With': 'XMLHttpRequest'
};

async function tryJson(url, opts) {
  try {
    const res = await fetch(url, opts);
    const text = await res.text();
    try { return JSON.parse(text); }
    catch { return { _html: text.slice(0, 60).replace(/\s+/g, ' ') }; }
  } catch (e) {
    return { _err: e.message };
  }
}

async function getDraw(no) {
  const api = `https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo=${no}`;

  // 1차: 직접 호출 (브라우저 헤더)
  let data = await tryJson(api, { headers: HEADERS });

  // 2차: 막혔으면 프록시 경유
  if (data._html || data._err) {
    console.log(`   ${no}회 직접 실패(${data._html || data._err}) → 프록시 재시도`);
    const proxy = `https://api.allorigins.win/raw?url=${encodeURIComponent(api)}`;
    data = await tryJson(proxy, { headers: { 'User-Agent': HEADERS['User-Agent'] } });
  }

  if (data._html) { console.log(`❌ ${no}회: HTML 응답(차단) → ${data._html}`); return null; }
  if (data._err)  { console.log(`❌ ${no}회: 네트워크 오류 → ${data._err}`); return null; }
  if (data.returnValue !== 'success') {
    console.log(`⏳ ${no}회: returnValue=${data.returnValue} → 아직 추첨 전 (연결 정상)`);
    return null;
  }
  console.log(`✅ ${no}회: 데이터 수신 (${data.drwNoDate})`);
  return [data.drwNo, data.drwtNo1, data.drwtNo2, data.drwtNo3,
          data.drwtNo4, data.drwtNo5, data.drwtNo6, data.bnusNo];
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
    console.log(`✅ ${added}회 추가. 최신 ${arr[arr.length - 1][0]}회`);
  } else {
    console.log('변경 없음');
  }
})();
