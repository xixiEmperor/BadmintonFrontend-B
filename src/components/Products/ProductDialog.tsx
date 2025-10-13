import { useEffect, useMemo, useRef, useState } from 'react'
import { Modal, Form, Input, InputNumber, Select, Upload, Switch, message, Radio, Alert } from 'antd'
import type { UploadFile, UploadProps } from 'antd/es/upload'
import { PlusOutlined } from '@ant-design/icons'
import {
  addProduct,
  updateProduct,
  uploadProductImages,
  getCategories,
} from '@/api/Shop/productsApi'
import type { AddProductData, ProductData, UpdateProductData, Category } from '@/types/apiTypes/products'

type ProductFormValues = Omit<AddProductData, 'status'> & { status: boolean }

interface ProductDialogProps {
  open: boolean
  product?: ProductData
  onOk: () => void
  onCancel: () => void
}

/**
 * 商品新增/编辑弹窗
 * - 支持多规格模式：先保存商品，再进入规格管理
 * - 图片统一上传后回填 URL
 */
export default function ProductDialog({ open, product, onOk, onCancel }: ProductDialogProps) {
  const [form] = Form.useForm<ProductFormValues>()
  const [confirmLoading, setConfirmLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [mainImage, setMainImage] = useState<UploadFile<any>[]>([])
  const [subImages, setSubImages] = useState<UploadFile<any>[]>([])
  const uploadAbortRef = useRef<AbortController | null>(null)
  // 规格模式：0 单规格，1 多规格（仅提示在规格页设置）
  const [specMode, setSpecMode] = useState<0 | 1>(product?.hasSpecification === 1 ? 1 : 0)

  const isEdit = !!product?.id

  useEffect(() => {
    getCategories()
      .then((res: any) => {
        const list = (res as any)?.data ?? res
        setCategories(list as Category[])
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!open) return
    if (product) {
      form.setFieldsValue({
        name: product.name,
        subtitle: product.subtitle,
        description: product.description,
        price: product.price,
        categoryId: product.categoryId,
        detail: product.detail,
        // Switch 需要 boolean
        status: product.status === 1,
        stock: product.stock,
      })
      if (product.mainImage) {
        setMainImage([
          { uid: 'main', name: 'main', url: product.mainImage, status: 'done' },
        ])
      }
      if (Array.isArray(product.subImages)) {
        setSubImages(
          product.subImages.map((url: string, idx: number) => ({ uid: String(idx), name: `img-${idx}`, url, status: 'done' }))
        )
      }
    } else {
      form.resetFields()
      setMainImage([])
      setSubImages([])
    }
  }, [open, product, form])

  const uploadProps: UploadProps = useMemo(
    () => ({
      listType: 'picture-card',
      multiple: true,
      beforeUpload: () => false,
      accept: 'image/*',
    }),
    []
  )

  const handleOk = async () => {
    try {
      const values = (await form.validateFields()) as ProductFormValues
      setConfirmLoading(true)

      // 统一上传图片
      const formData = new FormData()
      if (mainImage[0]?.originFileObj) {
        formData.append('mainImage', mainImage[0].originFileObj)
      }
      subImages.forEach((f) => {
        if (f.originFileObj) formData.append('subImages', f.originFileObj)
      })

      let mainImageUrl: string | undefined
      let subImagesUrls: string[] | undefined

      if (formData.has('mainImage') || formData.has('subImages')) {
        const controller = new AbortController()
        uploadAbortRef.current = controller
        const res = await uploadProductImages(formData)
        const raw = (res as any)?.data ?? res
        const data = typeof raw === 'string' ? JSON.parse(raw) : raw
        // 约定返回 { mainImage, subImages: string[] }
        mainImageUrl = data?.mainImage || mainImage[0]?.url
        subImagesUrls = Array.isArray(data?.subImages)
          ? data.subImages
          : subImages.filter((s) => !!s.url).map((s) => s.url!)
      } else {
        mainImageUrl = mainImage[0]?.url
        subImagesUrls = subImages.filter((s) => !!s.url).map((s) => s.url!)
      }

      // Switch boolean -> number
      const numericStatus = values.status ? 1 : 0

      const payload: AddProductData | UpdateProductData = {
        ...values,
        status: numericStatus,
        mainImage: mainImageUrl,
        subImages: subImagesUrls,
      }

      if (specMode === 1) {
        // 多规格：主表价格/库存作为基准值与汇总展示，不强制后端使用；由规格管理维护真实库存
        // 可在需要时传递 hasSpecification 标记给后端（若后端支持）
        ;(payload as any).hasSpecification = 1
      } else {
        ;(payload as any).hasSpecification = 0
      }

      if (isEdit && product?.id) {
        await updateProduct(product.id, payload as UpdateProductData)
        message.success('更新成功')
      } else {
        await addProduct(payload as AddProductData)
        message.success('新增成功')
      }

      onOk()
      } catch (e) {
      const err = e as { name?: string; message?: string }
      if (err?.name === 'CanceledError') return
      message.error(err?.message || '提交失败')
    } finally {
      setConfirmLoading(false)
    }
  }

  return (
    <Modal
      title={isEdit ? '编辑商品' : '新增商品'}
      open={open}
      onOk={handleOk}
      okText="确认"
      cancelText="取消"
      confirmLoading={confirmLoading}
      onCancel={onCancel}
      width={720}
      destroyOnClose
      maskClosable={false}
    >
      <Form
        form={form}
        labelCol={{ span: 5 }}
        wrapperCol={{ span: 18 }}
        initialValues={{ status: true, stock: 0 }}
      >
        <Form.Item label="规格模式" required>
          <Radio.Group value={specMode} onChange={(e) => setSpecMode(e.target.value)}>
            <Radio value={0}>单规格</Radio>
            <Radio value={1}>多规格</Radio>
          </Radio.Group>
        </Form.Item>
        {specMode === 1 && (
          <Form.Item colon={false} label=" " style={{ marginTop: -16 }}>
            <Alert type="info" showIcon message="多规格模式：请先保存商品，再在列表中点击“规格”进行规格组合与库存设置。" />
          </Form.Item>
        )}
        <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入名称' }]}> 
          <Input maxLength={60} placeholder="请输入商品名称" />
        </Form.Item>
        <Form.Item name="subtitle" label="副标题">
          <Input maxLength={120} placeholder="可选" />
        </Form.Item>
        <Form.Item name="description" label="简介">
          <Input.TextArea rows={3} maxLength={500} placeholder="可选" />
        </Form.Item>
        <Form.Item
          name="price"
          label="价格"
          rules={[{ required: true, message: '请输入价格' }]}
        >
          <InputNumber min={0} precision={2} prefix="¥" style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item
          name="stock"
          label="库存"
          rules={specMode === 0 ? [{ required: true, message: '请输入库存' }] : []}
          extra={specMode === 1 ? '作为总库存展示，实际库存以规格管理为准' : undefined}
        >
          <InputNumber min={0} precision={0} style={{ width: '100%' }} disabled={specMode === 1} />
        </Form.Item>
        <Form.Item name="categoryId" label="分类" rules={[{ required: true, message: '请选择分类' }]}>
          <Select
            showSearch
            optionFilterProp="label"
            options={categories.map((c) => ({ label: c.name, value: c.id }))}
            placeholder="请选择"
          />
        </Form.Item>
        <Form.Item name="status" label="状态" valuePropName="checked">
          <Switch checkedChildren="上架" unCheckedChildren="下架" />
        </Form.Item>
        <Form.Item label="主图" required>
          <Upload
            {...uploadProps}
            maxCount={1}
            fileList={mainImage}
            onChange={({ fileList }) => setMainImage(fileList)}
          >
            {mainImage.length >= 1 ? null : (
              <div>
                <PlusOutlined />
                <div style={{ marginTop: 8 }}>上传</div>
              </div>
            )}
          </Upload>
        </Form.Item>
        <Form.Item label="子图">
          <Upload
            {...uploadProps}
            multiple
            fileList={subImages}
            onChange={({ fileList }) => setSubImages(fileList)}
          >
            <div>
              <PlusOutlined />
              <div style={{ marginTop: 8 }}>上传</div>
            </div>
          </Upload>
        </Form.Item>
        <Form.Item name="detail" label="详情">
          <Input.TextArea rows={6} placeholder="可输入图文详情（HTML）" />
        </Form.Item>
      </Form>
    </Modal>
  )
}


