/**
 * 用户管理页
 * - 列表/筛选/详情/重置密码
 */
import { useState } from 'react'
import { Button, Descriptions, Input, Modal, Space, Table, Tag, message, Select } from 'antd'
import { formatDateTime } from '@/utils/date'
import type { ColumnsType } from 'antd/es/table'
import { useQuery, useMutation } from '@tanstack/react-query'
import { getUserList, getUserDetail, resetUserPassword } from '@/api/User/userManagementApi'
import type { GetUserListParams } from '@/types/apiTypes/userManagement'

type User = { id: number; username: string; nickname?: string; email?: string; phone?: string; role?: string; gender?: string; region?: string; registerTime?: string; lastLoginTime?: string }

export default function UserManagement() {
  const [modal, modalContextHolder] = Modal.useModal()
  const [params, setParams] = useState<GetUserListParams>({ page: 1, size: 10 })
  const [keyword, setKeyword] = useState('')
  const [role, setRole] = useState<string | undefined>(undefined)
  const [detail, setDetail] = useState<User | undefined>()
  const [detailOpen, setDetailOpen] = useState(false)

  const { data, isFetching } = useQuery<{ list: User[]; total: number }>({
    queryKey: ['user.list', params],
    queryFn: async () => {
      type ApiResp<T> = { data?: T } | T
      function unwrap<T>(resp: ApiResp<T>): T {
        if (resp && typeof resp === 'object' && 'data' in (resp as Record<string, unknown>)) {
          return (resp as { data?: T }).data as T
        }
        return resp as T
      }
      const res = await getUserList(params)
      const d = unwrap<{ list?: User[]; total?: number }>(res as ApiResp<{ list?: User[]; total?: number }>)
      const list = (d?.list ?? d) as User[]
      const total = d?.total ?? list.length
      return { list, total }
    },
  })

  const resetMutation = useMutation({
    mutationFn: async (id: number) => resetUserPassword(id),
    onSuccess: () => message.success('已重置密码为默认值'),
  })

  const columns: ColumnsType<User> = [
    { title: 'ID', dataIndex: 'id', width: 80 },
    { title: '用户名', dataIndex: 'username', width: 160 },
    { title: '昵称', dataIndex: 'nickname', width: 160 },
    { title: '邮箱', dataIndex: 'email', width: 200 },
    { title: '手机号', dataIndex: 'phone', width: 140 },
    { title: '角色', dataIndex: 'role', width: 140, render: (r) => <Tag>{r || '-'}</Tag> },
    { title: '性别', dataIndex: 'gender', width: 100 },
    { title: '地区', dataIndex: 'region', width: 160 },
    { title: '注册时间', dataIndex: 'registerTime', width: 200, render: (t?: string) => formatDateTime(t) },
    { title: '最后登录', dataIndex: 'lastLoginTime', width: 200, render: (t?: string) => formatDateTime(t) },
    {
      title: '操作', width: 200, fixed: 'right', render: (_, r) => (
        <Space>
          <Button type="link" onClick={async () => {
            type ApiResp<T> = { data?: T } | T
            function unwrap<T>(resp: ApiResp<T>): T {
              if (resp && typeof resp === 'object' && 'data' in (resp as Record<string, unknown>)) {
                return (resp as { data?: T }).data as T
              }
              return resp as T
            }
            const res = await getUserDetail(r.id)
            const d = unwrap<User>(res as ApiResp<User>)
            setDetail(d)
            setDetailOpen(true)
          }}>详情</Button>
          <Button type="link" danger onClick={() => {
            modal.confirm({
              title: '确认重置该用户密码？',
              okText: '确认',
              cancelText: '取消',
              okType: 'primary',
              onOk: () => resetMutation.mutateAsync(r.id),
            })
          }}>重置密码</Button>
        </Space>
      )
    }
  ]

  const list = data?.list ?? []
  const total = data?.total ?? 0

  return (
    <div className="p-6">
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 mb-4">
        <Space wrap>
          <Input placeholder="搜索用户名" allowClear style={{ width: 240 }} value={keyword} onChange={(e) => setKeyword(e.target.value)} />
          <Select
            allowClear
            placeholder="选择角色"
            style={{ width: 200 }}
            value={role}
            onChange={(v) => setRole(v)}
            options={[{ label: '普通用户', value: 'ROLE_USER' }, { label: '管理员', value: 'ROLE_ADMIN' }]} />
          <Button type="primary" onClick={() => setParams((p) => ({ ...p, page: 1, keyword: keyword || undefined, role }))}>搜索</Button>
          <Button onClick={() => { setKeyword(''); setRole(undefined); setParams({ page: 1, size: params.size }) }}>重置</Button>
        </Space>
      </div>

      <Table<User>
        rowKey="id"
        loading={isFetching}
        columns={columns}
        dataSource={list}
        scroll={{ x: 1200 }}
        pagination={{
          current: params.page,
          pageSize: params.size,
          total,
          showSizeChanger: true,
          onChange: (page, size) => setParams({ ...params, page, size }),
        }}
      />

      <Modal open={detailOpen} onCancel={() => setDetailOpen(false)} onOk={() => setDetailOpen(false)} okText="确认" cancelText="取消" title="用户详情" width={680}>
        {detail && (
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="ID">{detail.id}</Descriptions.Item>
            <Descriptions.Item label="用户名">{detail.username}</Descriptions.Item>
            <Descriptions.Item label="昵称">{detail.nickname || '未设置'}</Descriptions.Item>
            <Descriptions.Item label="角色">{detail.role || '未设置'}</Descriptions.Item>
            <Descriptions.Item label="邮箱">{detail.email || '未设置'}</Descriptions.Item>
            <Descriptions.Item label="手机号">{detail.phone || '未设置'}</Descriptions.Item>
            <Descriptions.Item label="性别">{detail.gender || '未设置'}</Descriptions.Item>
            <Descriptions.Item label="地区">{detail.region || '未设置'}</Descriptions.Item>
            <Descriptions.Item label="注册时间">{formatDateTime(detail.registerTime)}</Descriptions.Item>
            <Descriptions.Item label="最后登录">{formatDateTime(detail.lastLoginTime) || '从未登录'}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
      {modalContextHolder}
    </div>
  )
}
