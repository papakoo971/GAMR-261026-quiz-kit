/**
 * 퀴즈 게임용 구글 시트 API
 *
 * 사용법
 * 1. 구글 시트에서 [확장 프로그램] → [Apps Script]를 엽니다.
 * 2. 이 파일 내용을 전부 붙여 넣고 저장합니다.
 * 3. [배포] → [새 배포] → 유형: 웹 앱
 *    - 다음 사용자 인증 정보로 실행: 나
 *    - 액세스 권한이 있는 사용자: 모든 사용자
 * 4. 나온 "웹 앱 URL"(/exec 로 끝남)을 게임의 src/config.js 에 넣습니다.
 *
 * 시트 구조
 * - Questions 탭: code | category | question | option1 | option2 | option3 | option4 | answer | (imageUrl 선택)
 * - Results 탭:   timestamp | code | nickname | score | gametype
 */

const QUESTIONS_SHEET = 'Questions';
const RESULTS_SHEET = 'Results';

// GET ?code=TECH01  →  해당 코드의 문제 목록
function doGet(e) {
  const code = String((e && e.parameter && e.parameter.code) || '').trim();
  if (!code) return json_({ status: 'error', message: '참여 코드가 없습니다.' });

  const sheet = SpreadsheetApp.getActive().getSheetByName(QUESTIONS_SHEET);
  if (!sheet) return json_({ status: 'error', message: 'Questions 탭을 찾을 수 없습니다.' });

  const rows = sheet.getDataRange().getValues();
  const header = rows.shift().map(h => String(h).trim());
  const col = name => header.indexOf(name);

  const data = rows
    .filter(r => String(r[col('code')]).trim() === code)
    .map((r, i) => ({
      id: code + '-' + (i + 1),
      category: text_(r[col('category')]),
      q: text_(r[col('question')]),
      options: ['option1', 'option2', 'option3', 'option4'].map(n => text_(r[col(n)])),
      correctAnswer: text_(r[col('answer')]),
      imageUrl: col('imageUrl') >= 0 ? text_(r[col('imageUrl')]) : '',
    }))
    .filter(q => q.q && q.options.includes(q.correctAnswer));

  if (data.length === 0) return json_({ status: 'error', message: '해당 코드의 퀴즈를 찾을 수 없습니다.' });
  return json_({ status: 'success', data: data });
}

// POST {code, nickname, score, gametype}  →  Results 탭에 한 줄 추가
function doPost(e) {
  try {
    const d = JSON.parse(e.postData.contents);
    const sheet = SpreadsheetApp.getActive().getSheetByName(RESULTS_SHEET)
      || SpreadsheetApp.getActive().insertSheet(RESULTS_SHEET);
    if (sheet.getLastRow() === 0) sheet.appendRow(['timestamp', 'code', 'nickname', 'score', 'gametype']);
    sheet.appendRow([new Date(), text_(d.code), text_(d.nickname).slice(0, 20), Number(d.score) || 0, text_(d.gametype)]);
    return json_({ status: 'success' });
  } catch (err) {
    return json_({ status: 'error', message: String(err) });
  }
}

function text_(v) {
  return v === null || v === undefined ? '' : String(v).trim();
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
