import { useState } from "react"
import { createNotice, publishNotice } from "@/api/Venue/noticeApi"
import { generateId } from '@wfynbzlx666/sdk-core'

export default function NoticeCreater() {
    const [title, setTitle] = useState<string>('')
    const [content, setContent] = useState<string>('')
    const [type, setType] = useState<string>('1')

    return (
        <div className="p-8px bg-white">
            <header className='text-24px font-bold leading-24px'>新建/发布通知</header>
            <hr />
            <div className="mt-4px">
                <div className="flex flex-col">
                    <label htmlFor="title">
                        <span className="text-red-500">*</span>
                        标题
                    </label>
                    <input type="text" id="title" name="title" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full h-40px p-4px border border-gray-300 rounded-md" />
                </div>
                <div className="flex flex-col mt-4px">
                    <label htmlFor="content">
                        <span className="text-red-500">*</span>
                        内容
                    </label>
                    <textarea id="content" name="content" value={content} onChange={(e) => setContent(e.target.value)} className="w-full h-40px p-4px border border-gray-300 rounded-md"></textarea>
                </div>
                <div className="mt-4px flex">
                    <label htmlFor="type">
                        <span className="text-red-500">*</span>
                        类型
                    </label>
                    <div className="flex gap-8px">
                        <input type="radio" id="type" name="type" value="1" onChange={(e) => setType(e.target.value)} /> 普通通知
                        <input type="radio" id="type" name="type" value="2" onChange={(e) => setType(e.target.value)} /> 活动通知
                    </div>
                </div>
                <div>
                    <button onClick={() => createNotice({ title, content, type: Number(type) })}>创建</button>
                    <button onClick={() => publishNotice(+generateId())}>发布</button>
                    <button onClick={() => {
                        setTitle('')
                        setContent('')
                        setType('1')
                    }}>重置</button>
                </div>
            </div>
        </div>
    )
}