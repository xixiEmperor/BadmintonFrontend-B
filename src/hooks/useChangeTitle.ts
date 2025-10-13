import { useMatches } from "react-router-dom";
import { useEffect } from "react";

// 定义路由元数据类型：与 router/index.tsx 的 handle.meta 对齐
interface RouteHandle {
    meta?: {
        title?: string;
    };
}

export const useChangeTitle = () => {
    const matches = useMatches()
    const currentMatch = matches[matches.length - 1]
    const title = (currentMatch?.handle as RouteHandle)?.meta?.title
    useEffect(() => {
        // 仅当路由携带了 meta.title 时覆盖标题
        if (title) document.title = title
    }, [title])
}
