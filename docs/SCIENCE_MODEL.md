# 教学理想模型 v1

日地月轨道为匀速圆轨道，黄赤交角与月轨倾角均为零，太阳光平行，观测者固定赤道，忽略大气折射、视差、地形、角直径。关闭遮挡与食模拟：月相来自朝向观测者的受光面积变化，不是地球阴影。

恒星月 M=27.32166 日，恒星年 Y=365.25636 日。统一推导朔望月 S=1/(1/M-1/Y)，约 29.53059 日，避免将不同参考系混用。t 为假想同向起点后的连续日数，不是日历日期。太阳恒星经度 λs=2πt/Y；月球恒星经度 λm=2πt/M；有向距角 D=wrap(λm-λs)。进度 p=wrap(t/S)/S。

月球处的日月地相角 α=acos(-cos D)，可见照明比例 k=(1+cos α)/2=(1-cos D)/2。D=0、π/2、π、3π/2 分别新月、上弦、满月、下弦。八名称采用最近的 45° 中心分区，边界向下一个区间归类；这仅为教学命名，不是天文事件日期。

底层计算参数 L 表示地方太阳时，月相页面固定取正午。因此理想时刻为固定距角快照：上中天 T=wrap24(12+24p)，月出 wrap24(T-6)，月落 wrap24(T+6)。四主相对应 06/12/18、12/18/00、18/00/06、00/06/12（出/中/落）。不模拟月球一天内继续公转造成的时刻偏移。

时角 H=2π(L-12)/24-D。赤道零赤纬：高度 h=asin(cos H)；东方分量 E=-sin H，北方分量 N=0，天顶分量 U=cos H；方位角从北顺时针，E>0 为90°，E<0 为270°，天顶和天底方位未定义，返回 null。高度>0 仅表示在地平线上方，不保证肉眼可见。

局限：不适用真实中国纬度升落预报，不体现季节、椭圆轨道、章动、天平动、月面倾斜和实际亮度；不得宣传为真实天象预报。

参考：[NASA 轨道周期](https://eclipse.gsfc.nasa.gov/SEhelp/moonorbit.html)、[NASA 恒星月与朔望月](https://starchild.gsfc.nasa.gov/docs/StarChild/questions/question32.html)。


农历显示取模拟月龄的整数部分加一，以初一为朔。每个图例对应朔望月的八分之一间隔，实际农历月中事件所在的日期会变化。1 倍速用 30 秒演示一轮朔望月。八相图内圈用北极俯视的日照方向，外圈画地面所见月面。

升落解释与八相对照参考 [NASA 月相](https://science.nasa.gov/moon/moon-phases/) 和 [斯威本科技大学 COSMOS](https://astronomy.swin.edu.au/cosmos/p/Phases)。每天的时刻取决于日月距角。赤道零赤纬模型中，月球在太阳以东 90° 时晚约六小时上中天，月出和月落分别在上中天前后六小时。

日地月场景本地使用 NASA 的[带云层地球](https://science.nasa.gov/resource/earth-with-clouds-3d-model/)与[太阳](https://science.nasa.gov/learn/heat/resource/sun-3d-model/)模型；保留原几何和材质，将内嵌纹理缩小并转为 JPEG。平行箭头表示日光传播方向，天体半径与轨道距离使用示意尺度。

本次主舞台/月食改版：普通月相公式保持原样。独立真实事件月食回放与非零轨道倾角对照见 ECLIPSE_MODEL.md；这里的零倾角假设不用于判定月食。

太阳周日视运动是独立模块，使用真实日期、纬度和经度及北京时间，不参与本文件的理想月相公式；公式、几何日出日落和极昼极夜处理见 SOLAR_MODEL.md。

日地月空间的地球夜灯使用 [Solar System Scope](https://www.solarsystemscope.com/textures/) 的地球夜面贴图（[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)），取自 [Three.js 地球示例](https://threejs.org/examples/webgpu_tsl_earth.html) 的缩放版本。渲染时提取暖色灯光，并按朝向太阳的角度在晨昏线附近平滑衰减。
