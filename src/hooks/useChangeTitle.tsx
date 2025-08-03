import { useMatches } from "react-router-dom";
import { useEffect } from "react";

// 定义路由元数据类型
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
        if (title) {
            document.title = title
        }
    }, [title])
}
