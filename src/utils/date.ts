/**
 * 日期时间工具
 * - 格式化/参数化/范围转换
 */
import dayjs, { Dayjs } from 'dayjs'

/**
 * 统一的日期时间格式化工具
 * 
 * 处理流程：
 * 1. 检查输入值的有效性（null、undefined、空字符串）
 * 2. 使用dayjs构造函数解析各种格式的日期输入
 * 3. 验证解析后的日期对象是否有效
 * 4. 根据指定模式格式化输出字符串
 * 
 * 兼容性说明：
 * - ISO 字符串：如 "2024-01-15T10:30:00Z"
 * - 毫秒时间戳：如 1705320600000
 * - JavaScript Date 对象
 * - Dayjs 对象
 * 
 * @param {string|number|Date|Dayjs|null} value - 要格式化的日期值
 * @param {string} pattern - 格式化模式，默认 'YYYY-MM-DD HH:mm'
 * @returns {string} 格式化后的日期字符串，无效输入返回 '-'
 */
export function formatDateTime(
  value?: string | number | Date | Dayjs | null,
  pattern = 'YYYY-MM-DD HH:mm',
): string {
  // 1. 空值检查：处理 null、undefined 和空字符串
  if (value == null || value === '') return '-'
  
  // 2. 使用dayjs解析输入值
  // dayjs能自动识别多种日期格式，包括ISO字符串、时间戳等
  const d = dayjs(value as string | number | Date | Dayjs)
  
  // 3. 验证解析结果的有效性
  // 如果输入无法被解析为有效日期，dayjs会返回Invalid Date
  if (!d.isValid()) return '-'
  
  // 4. 按指定格式输出字符串
  // 使用dayjs的format方法进行格式化
  return d.format(pattern)
}

/**
 * 格式化为仅日期（不包含时间部分）
 * 
 * 使用场景：
 * - 表格中的日期列显示
 * - 日期选择器的回显
 * - 报表中的日期标签
 * 
 * @param {string|number|Date|Dayjs|null} value - 要格式化的日期值
 * @param {string} pattern - 日期格式模式，默认 'YYYY-MM-DD'
 * @returns {string} 格式化后的日期字符串
 */
export function formatDate(value?: string | number | Date | Dayjs | null, pattern = 'YYYY-MM-DD'): string {
  // 复用formatDateTime函数，仅改变默认的格式模式
  // 这样确保了日期格式化逻辑的一致性
  return formatDateTime(value, pattern)
}

/**
 * 将日期值转换为API接口参数格式
 * 
 * 转换逻辑：
 * 1. 检查输入值是否为空或无效
 * 2. 使用dayjs解析日期值
 * 3. 验证解析结果的有效性
 * 4. 返回格式化后的字符串或undefined
 * 
 * 与formatDateTime的区别：
 * - 无效输入返回undefined而不是'-'
 * - 专门用于API请求参数，避免发送无效字符串
 * 
 * @param {string|number|Date|Dayjs|null} value - 要转换的日期值
 * @param {string} pattern - 输出格式模式，默认 'YYYY-MM-DD'
 * @returns {string|undefined} 格式化后的日期字符串，无效输入返回undefined
 */
export function toDateParam(value?: string | number | Date | Dayjs | null, pattern = 'YYYY-MM-DD'): string | undefined {
  // 1. 空值检查
  if (value == null || value === '') return undefined
  
  // 2. 解析日期值
  const d = dayjs(value as string | number | Date | Dayjs)
  
  // 3. 返回格式化结果或undefined
  // 这样可以避免向API发送无效的日期字符串
  return d.isValid() ? d.format(pattern) : undefined
}

/**
 * 将日期范围转换为API接口参数对象
 * 
 * 转换流程：
 * 1. 检查范围数组是否为空
 * 2. 分别格式化开始日期和结束日期
 * 3. 返回包含startDate和endDate的参数对象
 * 
 * 使用场景：
 * - 日期范围选择器的值转换
 * - 报表查询的时间范围参数
 * - 数据筛选的日期区间设置
 * 
 * @param {[Dayjs, Dayjs]|null} range - 日期范围数组，包含开始和结束日期
 * @param {string} pattern - 日期格式模式，默认 'YYYY-MM-DD'
 * @returns {Object} 包含startDate和endDate的参数对象
 */
export function toRangeParams(
  range: [Dayjs, Dayjs] | null,
  pattern = 'YYYY-MM-DD',
): { startDate?: string; endDate?: string } {
  // 1. 检查范围是否为空
  if (!range) return {}
  
  // 2. 分别格式化范围的起始和结束日期
  return {
    startDate: formatDate(range[0], pattern),  // 开始日期
    endDate: formatDate(range[1], pattern),    // 结束日期
  }
}


