/**
 * 论坛管理页
 * - 列表/置顶/删除/跳转详情
 */
import { useMemo, useState } from 'react'
import { Button, Input, Space, Table, Tag, Tabs, message, Modal } from 'antd'
import { formatDateTime } from '@/utils/date'
import type { ColumnsType } from 'antd/es/table'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getForumList, deletePostService, setPostTopStatus } from '@/api/Forum/forumManagementApi'
import { useNavigate } from 'react-router-dom'

type Post = {
  id: number
  title: string
  category: 'all' | 'team' | 'notice' | 'help' | 'exp' | string
  author?: string
  isTop?: boolean
  createTime?: string
}

export default function Forum() {
  const [modal, modalContextHolder] = Modal.useModal()
  const [params, setParams] = useState<{ page: number; size: number; keyword?: string; category?: string }>({ page: 1, size: 10, category: 'all' })
  const [keyword, setKeyword] = useState('')
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const { data, isFetching } = useQuery<{ list: Post[]; total: number }>({
    queryKey: ['forum.list', params],
    queryFn: async () => {
      const res = await getForumList(params)
      const data = (res as unknown as { data?: { list?: Post[]; total?: number } })?.data ?? (res as { list?: Post[]; total?: number })
      const list = (data?.list ?? data) as Post[]
      const total = data?.total ?? list.length
      return { list, total }
    },
    staleTime: 10_000,
  })

  const toggleTopMutation = useMutation({
    mutationFn: async ({ id, isTop }: { id: number; isTop: boolean }) => setPostTopStatus(id, { isTop }),
    onSuccess: () => {
      message.success('操作成功')
      queryClient.invalidateQueries({ queryKey: ['forum.list'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => deletePostService(id),
    onSuccess: () => {
      message.success('删除成功')
      queryClient.invalidateQueries({ queryKey: ['forum.list'] })
    },
  })

  const columns = useMemo<ColumnsType<Post>>(
    () => [
      {
        title: '标题',
        dataIndex: 'title',
        render: (t: string, r) => (
          <a onClick={() => navigate(`/admin/forum/post/${r.id}`)}>
            {r.isTop && <Tag color="gold">置顶</Tag>}
            {t}
          </a>
        ),
      },
      { title: '类别', dataIndex: 'category', width: 120 },
      { title: '作者', dataIndex: 'author', width: 160 },
      { title: '创建时间', dataIndex: 'createTime', width: 200, render: (t?: string) => formatDateTime(t) },
      {
        title: '操作',
        width: 200,
        render: (_, r) => (
          <Space>
            <Button type="link" onClick={() => toggleTopMutation.mutate({ id: r.id, isTop: !r.isTop })}>
              {r.isTop ? '取消置顶' : '置顶'}
            </Button>
            <Button type="link" danger onClick={() => {
              modal.confirm({
                title: '确定删除该帖子？',
                okText: '确认',
                cancelText: '取消',
                okType: 'primary',
                onOk: () => deleteMutation.mutateAsync(r.id),
              })
            }}>删除</Button>
          </Space>
        ),
      },
    ],
    []
  )

  const list = data?.list ?? []
  const total = data?.total ?? 0

  return (
    <div className="p-6">
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 mb-4">
        <Space wrap>
          <Input
            allowClear
            placeholder="搜索帖子内容"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            style={{ width: 260 }}
          />
          <Button type="primary" onClick={() => setParams((p) => ({ ...p, page: 1, keyword }))}>搜索</Button>
          <Button onClick={() => { setKeyword(''); setParams((p) => ({ ...p, page: 1, keyword: undefined })) }}>重置</Button>
        </Space>
        <div className="mt-4" />
        <Tabs
          defaultActiveKey={params.category}
          onChange={(key) => setParams((p) => ({ ...p, page: 1, category: key }))}
          items={[
            { key: 'all', label: '全部' },
            { key: 'team', label: '球队' },
            { key: 'notice', label: '公告' },
            { key: 'help', label: '求助' },
            { key: 'exp', label: '经验' },
          ]}
        />
      </div>

      <Table<Post>
        rowKey="id"
        loading={isFetching}
        columns={columns}
        dataSource={list}
        pagination={{
          current: params.page,
          pageSize: params.size,
          total,
          showSizeChanger: true,
          onChange: (page, size) => setParams((p) => ({ ...p, page, size })),
        }}
      />
      {modalContextHolder}
    </div>
  )
}
