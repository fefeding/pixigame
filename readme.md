# 使用PixiJS做一个小游戏
## PixiJS
`Pixi.js`使用WebGL，是一个超快的HTML5 2D渲染引擎。作为一个Javascript的2D渲染器，Pixi.js的目标是提供一个快速的、轻量级而且是兼任所有设备的2D库。

官方网址: [http://www.pixijs.com/](http://www.pixijs.com/)

### 知识点
做一个小游戏，我们使用到`pixi.js`的功能不多，只需要了解以下几个点即可快速上手。

* `PIXI.Application` 创建一个游戏时第一个要初始化的对象。
* `stage` 舞台，我们可以看做是所有对象的根节点，类似于document。
* `PIXI.loader` 资源加载和管理器。
* `PIXI.Texture` 材质，通常是指我们加载的图片。
* `PIXI.Sprite` 精灵，就是游戏中的一个对象，结合`PIXI.Texture` 材质使用。
* `PIXI.Container` 精灵容器，我们可以把多个精灵结合在一起组成一个更复杂的对象。

了解以上内容我们就可以直接做小游戏了，其它知识可以去官网查看。

## 游戏制作
