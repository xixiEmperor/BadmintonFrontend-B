export interface Notice {
  total: number, // 总条数
  list: NoticeItem[], // 列表
  pageNum: number, // 当前页码
  pageSize: number, // 每页条数
  size: number, // 当前页条数
  startRow: number, // 当前页起始行
  endRow: number, // 当前页结束行
  pages: number,
  nextPage: number,
  isFirstPage: boolean,
  isLastPage: boolean,
  hasNextPage: boolean,
  hasPreviousPage: boolean,
  navigatePages: number,
  navigatepageNums: number[],
  navigateFirstPage: number,
  navigateLastPage: number,
}

export interface NoticeItem {
  id: number // 通知ID
  title: string // 通知标题
  content: string // 通知内容
  type: 1 | 2 // 1: 重要通知 2: 普通通知
  typeDesc: '重要通知' | '普通通知'
  status: 0 | 1 // 0: 草稿 1: 发布
  statusDesc: '草稿' | '已发布'
  createTime: string
  updateTime: string
  publishTime: string
}
