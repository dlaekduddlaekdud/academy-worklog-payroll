// Notion API를 통해 판교관 근무 일정을 조회하는 서비스
// 환경변수 미설정 시 빈 배열 반환 (graceful degradation)

const NOTION_API_URL = "https://api.notion.com/v1"
const NOTION_VERSION = "2022-06-28"

// Notion DB 속성명 상수
const DATE_PROP = "날짜"
const ROLE_PROP = "역할"
const NAME_PROP = "이름"

export interface NotionScheduleEntry {
  date: string       // "YYYY-MM-DD"
  roleLabel: string  // "1관 초등조교" 등
  workerName: string
}

// Notion API 응답에서 날짜 속성 값 추출
interface NotionDateProperty {
  type: "date"
  date: { start: string; end: string | null } | null
}

// Notion API 응답에서 Select 속성 값 추출
interface NotionSelectProperty {
  type: "select"
  select: { name: string } | null
}

// Notion API 응답에서 Title/RichText 속성 값 추출
interface NotionRichTextItem {
  plain_text: string
}

interface NotionTitleProperty {
  type: "title"
  title: NotionRichTextItem[]
}

interface NotionRichTextProperty {
  type: "rich_text"
  rich_text: NotionRichTextItem[]
}

type NotionProperty =
  | NotionDateProperty
  | NotionSelectProperty
  | NotionTitleProperty
  | NotionRichTextProperty

interface NotionPageProperties {
  [key: string]: NotionProperty
}

interface NotionPage {
  properties: NotionPageProperties
}

interface NotionQueryResponse {
  results: NotionPage[]
  has_more: boolean
  next_cursor: string | null
}

// 속성에서 텍스트 추출 (title/rich_text 모두 처리)
function extractTextFromProperty(prop: NotionProperty): string {
  if (prop.type === "title") {
    return prop.title.map((t) => t.plain_text).join("")
  }
  if (prop.type === "rich_text") {
    return prop.rich_text.map((t) => t.plain_text).join("")
  }
  return ""
}

// Notion DB 쿼리 (페이지네이션 포함)
async function queryNotionDatabase(
  databaseId: string,
  token: string,
  filter: Record<string, unknown>,
  startCursor?: string
): Promise<NotionQueryResponse> {
  const body: Record<string, unknown> = { filter }
  if (startCursor) {
    body.start_cursor = startCursor
  }

  const res = await fetch(`${NOTION_API_URL}/databases/${databaseId}/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Notion-Version": NOTION_VERSION,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    // SSG 캐시 방지 — 항상 최신 일정 반환
    cache: "no-store",
  })

  if (!res.ok) {
    throw new Error(`Notion API 오류: ${res.status} ${res.statusText}`)
  }

  return res.json() as Promise<NotionQueryResponse>
}

// Notion 페이지에서 일정 항목 파싱
function parseScheduleEntry(page: NotionPage): NotionScheduleEntry | null {
  const props = page.properties

  const dateProp = props[DATE_PROP]
  const roleProp = props[ROLE_PROP]
  const nameProp = props[NAME_PROP]

  if (!dateProp || dateProp.type !== "date" || !dateProp.date) return null
  if (!roleProp || roleProp.type !== "select" || !roleProp.select) return null
  if (!nameProp) return null

  const workerName = extractTextFromProperty(nameProp)
  if (!workerName) return null

  return {
    date: dateProp.date.start.slice(0, 10), // "YYYY-MM-DD"로 정규화
    roleLabel: roleProp.select.name,
    workerName,
  }
}

// 월별 전체 일정 조회
export async function getMonthlySchedule(
  year: number,
  month: number
): Promise<NotionScheduleEntry[]> {
  const token = process.env.NOTION_TOKEN
  const databaseId = process.env.NOTION_SCHEDULE_DB_ID

  // 토큰/DB ID 미설정 시 빈 배열 반환
  if (!token || !databaseId) return []

  const startDate = `${year}-${String(month).padStart(2, "0")}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const endDate = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`

  const filter = {
    and: [
      {
        property: DATE_PROP,
        date: { on_or_after: startDate },
      },
      {
        property: DATE_PROP,
        date: { on_or_before: endDate },
      },
    ],
  }

  try {
    const entries: NotionScheduleEntry[] = []
    let cursor: string | undefined = undefined

    // 페이지네이션으로 전체 결과 수집
    do {
      const response = await queryNotionDatabase(databaseId, token, filter, cursor)
      for (const page of response.results) {
        const entry = parseScheduleEntry(page)
        if (entry) entries.push(entry)
      }
      cursor = response.has_more && response.next_cursor ? response.next_cursor : undefined
    } while (cursor)

    return entries
  } catch (err) {
    console.error("Notion 일정 조회 실패:", err)
    return []
  }
}

// 특정 근무자의 월별 일정만 필터링
export async function getMySchedule(
  year: number,
  month: number,
  workerName: string
): Promise<NotionScheduleEntry[]> {
  const all = await getMonthlySchedule(year, month)
  return all.filter((entry) => entry.workerName === workerName)
}
