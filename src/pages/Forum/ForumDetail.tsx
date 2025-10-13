/**
 * 论坛帖子详情页
 * - 展示帖子详情
 * - 展示回复列表，支持删除回复
 */
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button, Card, List, Space, Tag, message } from 'antd'
import { getForumDetail, getForumCommentsService, deleteCommentService } from '@/api/Forum/forumDetailApi'
import { setPostTopStatus } from '@/api/Forum/forumManagementApi'

type Reply = { id: number; author?: string; content: string; createTime?: string }
type PostDetail = { id: number; title: string; category: string; author?: string; isTop?: boolean; contentHtml?: string; likeCount?: number; replyCount?: number; createTime?: string }

export default function ForumDetail() {
  const params = useParams()
  const postId = Number((params as any).id)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  type ApiResp<T> = { data?: T } | T
  function unwrap<T>(resp: ApiResp<T>): T {
    if (resp && typeof resp === 'object' && 'data' in (resp as Record<string, unknown>)) {
      return (resp as { data?: T }).data as T
    }
    return resp as T
  }

  const { data: detail } = useQuery<PostDetail>({
    queryKey: ['forum.detail', postId],
    queryFn: async () => {
      const resp = await getForumDetail(postId)
      return unwrap<PostDetail>(resp as ApiResp<PostDetail>)
    },
    enabled: !!postId,
  })

  const { data: replies } = useQuery<Reply[]>({
    queryKey: ['forum.comments', postId],
    queryFn: async () => {
      const resp = await getForumCommentsService(postId, { orderBy: 'time' })
      return unwrap<Reply[]>(resp as ApiResp<Reply[]>)
    },
    enabled: !!postId,
  })

  const toggleTopMutation = useMutation({
    mutationFn: async (isTop: boolean) => setPostTopStatus(postId, { isTop }),
    onSuccess: () => {
      message.success('操作成功')
      queryClient.invalidateQueries({ queryKey: ['forum.detail', postId] })
      queryClient.invalidateQueries({ queryKey: ['forum.list'] })
    },
  })

  const deleteReplyMutation = useMutation({
    mutationFn: async (replyId: number) => deleteCommentService(postId, replyId),
    onSuccess: () => {
      message.success('已删除回复')
      queryClient.invalidateQueries({ queryKey: ['forum.comments', postId] })
    },
  })

  return (
    <div className="p-6">
      <Space style={{ marginBottom: 12 }}>
        <Button onClick={() => navigate(-1)}>返回</Button>
        <Button type="primary" onClick={() => toggleTopMutation.mutate(!detail?.isTop)}>
          {detail?.isTop ? '取消置顶' : '置顶'}
        </Button>
      </Space>

      <Card title={<span>{detail?.isTop && <Tag color="gold">置顶</Tag>}{detail?.title}</span>}>
        <div className="text-gray-500 text-sm mb-2">
          作者：{detail?.author || '-'} | 类别：{detail?.category || '-'} | 发布时间：{detail?.createTime || '-'}
        </div>
        <div dangerouslySetInnerHTML={{ __html: detail?.contentHtml || '' }} />
        <div className="mt-2 text-gray-500 text-sm">点赞：{detail?.likeCount ?? 0} | 回复：{detail?.replyCount ?? 0}</div>
      </Card>

      <Card title="回复" className="mt-4">
        {(!replies || replies.length === 0) ? (
          <div className="text-gray-400">暂无回复</div>
        ) : (
          <List
            dataSource={replies}
            renderItem={(r) => (
              <List.Item
                actions={[<Button danger type="link" onClick={() => deleteReplyMutation.mutate(r.id)}>删除</Button>]}
              >
                <List.Item.Meta
                  title={<span>{r.author || '匿名'} <span className="text-gray-400 text-xs">{r.createTime || '-'}</span></span>}
                  description={<div dangerouslySetInnerHTML={{ __html: r.content }} />}
                />
              </List.Item>
            )}
          />
        )}
      </Card>
    </div>
  )
}
