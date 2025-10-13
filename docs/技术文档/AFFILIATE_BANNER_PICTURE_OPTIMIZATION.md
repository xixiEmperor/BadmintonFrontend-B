### Affiliate 顶部 Banner 首屏图片自适配优化说明

- **背景**
  - 移动端初次进入页面时，依赖 JS（如 `useMediaQuery`）在挂载/监听后才切换图片，会出现先加载桌面图再切换为移动图的闪烁与多余请求问题。

- **目标**
  - 在首屏渲染阶段即选择并只下载合适分辨率的图片（移动端/桌面端），避免闪烁与带宽浪费，且不依赖运行时监听。

- **方案概述**
  - 使用浏览器原生的 `<picture>` + `<source media>` 进行响应式图片选择：
    - 浏览器在预解析与资源选择阶段就会根据 `media` 条件决定只下载哪张图片。
    - 无需等待 JS 执行即可生效，解决移动端初次加载场景。

- **变更文件**
  - `src/components/Header/Tip/AffiliateBanner.vue`
    - 移除：`useMediaQuery` 导入与依赖（运行时监听不再需要）。
    - 新增：
      - `desktopBannerImg` 与 `mobileBannerImg` 两个 `computed`，分别返回当前语言下的桌面/移动端图片。
    - 模板替换：使用 `<picture>` 选择资源。

- **关键代码片段**

  脚本（仅示意核心结构）：

  ```ts
  const desktopBannerImg = computed(() => {
    switch (lang) {
      case "jp": return JPBannerImg;
      case "es": return ESBannerImg;
      // ... 省略若干语言分支
      default: return EnBannerImg;
    }
  });

  const mobileBannerImg = computed(() => {
    switch (lang) {
      case "jp": return MobileJPBannerImg;
      case "es": return MobileESBannerImg;
      // ... 省略若干语言分支
      default: return MobileEnBannerImg;
    }
  });
  ```

  模板：

  ```vue
  <picture class="w-full h-[46px] lg:h-[52px]">
    <source :srcset="mobileBannerImg" media="(max-width: 1023.98px)" />
    <img :src="desktopBannerImg" alt="" class="w-full h-[46px] object-cover lg:w-full lg:h-[52px] lg:object-cover lg:object-top" />
  </picture>
  ```

- **实现原理**
  - `<picture>` 容器内可声明多个 `<source>`，每个 `source` 通过 `media` 指定生效条件。
  - 浏览器会在渲染前评估媒体查询，选择并仅下载命中的资源；若均不命中，则回退使用 `<img>` 的 `src`。
  - 因为发生在首屏资源选择阶段，移动端初次进入即可直接加载移动端图片，无需等待 JS。

- **验证方式**
  - 桌面：宽度 > 1024，网络面板仅看到桌面图被请求。
  - 移动：宽度 ≤ 1024 或移动设备，网络面板仅看到移动图被请求。
  - 窗口尺寸变化：浏览器可按需重新评估并请求另一张图（取决于实现与缓存）。
  - 语言切换：根据语言 `lang` 选择对应的图片资源。

- **兼容性**
  - `<picture>` 与 `media` 在现代浏览器中有良好支持；未命中时自动回退至 `<img>`。
  - 该实现与 SSR 兼容，不依赖运行时 UA 判断，避免水合期闪烁。

- **性能影响**
  - 避免首屏加载不必要图片（例如移动端不再下载桌面图）。
  - 移除运行时监听，减少不必要的 JS 计算与重绘切换。

- **风险与回滚**
  - 风险：若某语言图片路径配置缺失，会回退到默认图；需确保各语言资源存在。
  - 回滚：如需回滚，可恢复 `bannerImg` 的单一 `computed` 逻辑与 `useMediaQuery` 导入/判断。

- **后续可选优化**
  - 针对不同 DPR 提供 `1x/2x` 的 `srcset` 与 `sizes`，进一步提升清晰度与带宽利用率。
  - 可考虑为首屏关键图配置 `fetchpriority="high"` 或资源预加载（根据实际渲染关键度决定）。

