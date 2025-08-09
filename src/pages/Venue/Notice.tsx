/**
 * 场地通知管理页
 * - 创建草稿/发布/更新/删除
 */
import { useMemo, useState } from 'react'
import { Button, Card, Form, Input, Radio, Space, Table, Tag, message, Modal } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { formatDateTime } from '@/utils/date'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAdminNoticeList, createNotice, updateNotice, publishNotice, deleteNotice } from '@/api/Venue/noticeApi'

type NoticeItem = { id: number; title: string; content: string; type: 1 | 2; status: 0 | 1; createTime?: string; publishTime?: string }

export default function Notice() {
  const [modal, modalContextHolder] = Modal.useModal()
  const [params, setParams] = useState({ pageNum: 1, pageSize: 10 })
  const [form] = Form.useForm<{ title: string; content: string; type: 1 | 2 }>()
  const queryClient = useQueryClient()

  type ApiResp<T> = { data?: T } | T
  function unwrap<T>(resp: ApiResp<T>): T {
    if (resp && typeof resp === 'object' && 'data' in (resp as Record<string, unknown>)) {
      return (resp as { data?: T }).data as T
    }
    return resp as T
  }

  const { data, isFetching } = useQuery<{ list: NoticeItem[]; total: number }>({
    queryKey: ['notice.list', params],
    queryFn: async () => {
      const res = await getAdminNoticeList(params) as ApiResp<{ list?: NoticeItem[]; total?: number }>
      const d = unwrap<{ list?: NoticeItem[]; total?: number }>(res)
      const list = (d?.list ?? []) as NoticeItem[]
      const total = d?.total ?? list.length
      return { list, total }
    },
  })

  const createMutation = useMutation({
    mutationFn: async (payload: { title: string; content: string; type: 1 | 2 }) => createNotice(payload),
    onSuccess: () => {
      message.success('草稿已保存')
      form.resetFields()
      queryClient.invalidateQueries({ queryKey: ['notice.list'] })
    },
  })

  const publishMutation = useMutation({
    mutationFn: async (id: number) => publishNotice(id),
    onSuccess: () => {
      message.success('发布成功')
      queryClient.invalidateQueries({ queryKey: ['notice.list'] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: { title: string; content: string; type: 1 | 2 } }) => updateNotice(id, data),
    onSuccess: () => {
      message.success('更新成功')
      queryClient.invalidateQueries({ queryKey: ['notice.list'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => deleteNotice(id),
    onSuccess: () => {
      message.success('删除成功')
      queryClient.invalidateQueries({ queryKey: ['notice.list'] })
    },
  })

  const list = data?.list ?? []
  const total = data?.total ?? 0

  const columns = useMemo<ColumnsType<NoticeItem>>(() => [
    { title: 'ID', dataIndex: 'id', width: 80 },
    { title: '标题', dataIndex: 'title' },
    { title: '类型', dataIndex: 'type', width: 100, render: (t: 1 | 2) => t === 2 ? <Tag>普通</Tag> : <Tag color="red">重要</Tag> },
    { title: '状态', dataIndex: 'status', width: 100, render: (s: 0 | 1) => s === 1 ? <Tag color="green">已发布</Tag> : <Tag>草稿</Tag> },
    { title: '时间', dataIndex: 'publishTime', width: 200, render: (_: unknown, r: NoticeItem) => formatDateTime(r.publishTime || r.createTime) },
    {
      title: '操作', width: 220, render: (_: unknown, r: NoticeItem) => (
        <Space>
          <Button type="link" onClick={() => {
            form.setFieldsValue({ title: r.title, content: r.content, type: r.type })
            // 保存为更新：再次点击“保存草稿”将走创建；这里提供一个“更新”操作示例
            modal.confirm({
              title: '更新通知',
              content: '确认以表单内容更新该通知？',
              onOk: async () => {
                const v = await form.validateFields()
                await updateMutation.mutateAsync({ id: r.id, data: v })
              }
            })
          }}>编辑</Button>
          {r.status === 0 && (
            <Button type="link" onClick={() => publishMutation.mutate(r.id)}>发布</Button>
          )}
          <Button type="link" danger onClick={() => {
            modal.confirm({
              title: '确定删除？',
              okText: '确认',
              cancelText: '取消',
              okType: 'primary',
              onOk: () => deleteMutation.mutateAsync(r.id),
            })
          }}>删除</Button>
        </Space>
      )
    }
  ], [publishMutation, deleteMutation, form, modal, updateMutation])

  return (
    <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card title="新建/发布通知">
        <Form form={form} layout="vertical" initialValues={{ type: 2 }}>
          <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}>
            <Input maxLength={80} />
          </Form.Item>
          <Form.Item name="content" label="内容" rules={[{ required: true, message: '请输入内容' }]}>
            <Input.TextArea rows={6} maxLength={2000} />
          </Form.Item>
          <Form.Item name="type" label="类型">
            <Radio.Group>
              <Radio value={2}>普通</Radio>
              <Radio value={1}>重要</Radio>
            </Radio.Group>
          </Form.Item>
          <Space>
            <Button type="primary" onClick={() => form.validateFields().then((v) => createMutation.mutate(v))}>保存草稿</Button>
            <Button onClick={() => form.resetFields()}>重置</Button>
          </Space>
        </Form>
      </Card>

      <Card title="通知列表">
          <Table
          rowKey="id"
          loading={isFetching}
            columns={columns}
          dataSource={list}
          pagination={{
            current: params.pageNum,
            pageSize: params.pageSize,
            total,
            showSizeChanger: true,
            onChange: (page, pageSize) => setParams({ pageNum: page, pageSize }),
          }}
        />
        {modalContextHolder}
      </Card>
    </div>
  )
}
