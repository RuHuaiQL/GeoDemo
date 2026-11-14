# GeoDemo

## 交互动效

鼠标靠近按钮时，背景、边框和文字一起向指针偏移，切换模块时标题重新显现。[日地月空间星空](src/views/Stars.tsx)使用独立的密度、大小、亮度、闪烁和漂移参数，远近星点会随鼠标产生不同幅度的视差。

在 [motion.js](public/motion-demo/motion.js) 顶部的 `config` 中调整参数。`title` 控制单字时长、错峰间隔（毫秒）、模糊半径、位移和缓动曲线。`magnet` 控制感应距离、最大偏移（像素）、弹簧刚度和阻尼。`particles` 控制颜色、数量上限、粒径、漂移速度（像素/秒）、持续时间和视差幅度。

移植到原生页面时，加载动效脚本，调用 `GeoMotion.magnets(nav)`、`GeoMotion.reveal(heading)` 和 `GeoMotion.particles(canvas)`。三个方法均返回清理函数。React 接入示例见 [ExperimentMotion.tsx](src/views/ExperimentMotion.tsx) 和 [App.tsx](src/App.tsx)。组件挂载后用 ref 绑定，在 effect 清理时释放。标题保留完整的无障碍名称，逐字动画只用于视觉呈现。

纯前端教学应用：三维日地月空间、农历日期滑块、可点选的八相示意图、月出中天月落对照和朔望月播放；另含太阳周日视运动模块，可按日期、城市或经纬度观察太阳轨迹与地景光照。无需后端或账户，不采集或保存学生成绩。

## 本地运行
使用 Node.js 24（本项目验证版本）与 npm：
```powershell
npm ci
npm run dev
```
打开终端显示的本地地址。现有安装可直接运行 npm run dev。

## 验证与生产预览
```powershell
npm test
npm run build
npx playwright install chromium
npm run test:e2e
npm run preview
```
构建输出 dist，可部署到静态网站服务器；本次未发布到互联网。不要直接双击 dist/index.html，需通过 HTTP 服务访问。

## 文档
- [教师指南](docs/TEACHER_GUIDE.md)：15分钟教学流程、键盘与故障排查。
- [科学模型](docs/SCIENCE_MODEL.md)：公式、理想化假设和局限。
- [太阳视运动模型](docs/SOLAR_MODEL.md)：日期、纬度经度、日出日落与光照场景。
- [坐标契约](docs/COORDINATES.md)：统一坐标与渲染映射。
- [验收记录](docs/FINAL_REPORT.md)：最终验证与剩余限制。

月面、月相图和升落时刻共用 src/science/model.ts 的几何模型。赤道、零赤纬、共面圆轨道模型不提供真实地区天象预报。三维模块懒加载并按需渲染；WebGL 不可用时显示提示，二维视图仍可使用。

## 主舞台与月食更新
点击顶部“月食模拟”进入2025-09-07事件回放；七接触节点可以跳转，播放倍率×600。月相与升落信息浮层默认折叠，点击标题条开合；恢复默认布局可收起。详见 docs/REDESIGN_REPORT.md 与 docs/ECLIPSE_MODEL.md。

## 太阳周日视运动
顶部“太阳视运动”进入独立模块：选择日期、典型城市或手动经纬度，用北京时间滑块观察太阳在地平线以上的轨迹。点击轨迹上的“上中天”标记可显示太阳高度角；面板同时标注日出、上中天、日落和昼长，并处理极昼极夜。三维场景含草地、建筑、树木、实时阴影与昼夜天色。地景中另有五个可点击知识站点：最小楼间距、太阳能热水器倾角、垂直物体影长、室内采光和遮阳板；点击场景小圆点或控制面板按钮会拉近视角、打开对应的剖面示意图，并显示随日期、纬度和时间更新的数据，支持一键切换冬至/夏至正午。所有钟表时刻按北京时间（UTC+8）显示，模型忽略大气折射，详见 docs/SOLAR_MODEL.md。
