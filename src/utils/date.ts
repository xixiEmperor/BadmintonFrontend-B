/**
 * 日期时间工具
 * - 格式化/参数化/范围转换
 */
import dayjs, { Dayjs } from 'dayjs'

/**
 * 统一的日期时间格式化工具
 * - 兼容后端返回的 ISO 字符串、毫秒时间戳、Date、Dayjs
 * - 默认格式：YYYY-MM-DD HH:mm
 */
export function formatDateTime(
  value?: string | number | Date | Dayjs | null,
  pattern = 'YYYY-MM-DD HH:mm',
): string {
  if (value == null || value === '') return '-'
  const d = dayjs(value as string | number | Date | Dayjs)
  if (!d.isValid()) return '-'
  return d.format(pattern)
}

/**
 * 格式化为仅日期
 */
export function formatDate(value?: string | number | Date | Dayjs | null, pattern = 'YYYY-MM-DD'): string {
  return formatDateTime(value, pattern)
}

/**
 * 将 Dayjs/Date/字符串转换为接口参数（如 YYYY-MM-DD）
 */
export function toDateParam(value?: string | number | Date | Dayjs | null, pattern = 'YYYY-MM-DD'): string | undefined {
  if (value == null || value === '') return undefined
  const d = dayjs(value as string | number | Date | Dayjs)
  return d.isValid() ? d.format(pattern) : undefined
}

/**
 * 范围日期转为接口参数
 */
export function toRangeParams(
  range: [Dayjs, Dayjs] | null,
  pattern = 'YYYY-MM-DD',
): { startDate?: string; endDate?: string } {
  if (!range) return {}
  return {
    startDate: formatDate(range[0], pattern),
    endDate: formatDate(range[1], pattern),
  }
}


