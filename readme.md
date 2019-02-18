# 使用PixiJS做一个小游戏
## PixiJS
`PixiJS`使用WebGL，是一个超快的HTML5 2D渲染引擎。作为一个Javascript的2D渲染器，Pixi.js的目标是提供一个快速的、轻量级而且是兼任所有设备的2D库。

官方网址: [http://www.pixijs.com/](http://www.pixijs.com/)

### 知识点
做一个小游戏，我们使用到`PixiJS`的功能不多，只需要了解以下几个点即可快速上手。

* `PIXI.Application` 创建一个游戏时第一个要初始化的对象。
* `stage` 舞台，我们可以看做是所有对象的根节点，类似于document。
* `PIXI.loader` 资源加载和管理器。
* `PIXI.Texture` 材质，通常是指我们加载的图片。
* `PIXI.Sprite` 精灵，就是游戏中的一个对象，结合`PIXI.Texture` 材质使用。
* `PIXI.Container` 精灵容器，我们可以把多个精灵结合在一起组成一个更复杂的对象。

了解以上内容我们就可以直接做小游戏了，其它知识可以去官网查看。

## 游戏制作
此为一个躲避下落物体的小游戏，体验地址 (`移动端`)：[http://qian-img.tenpay.com/mb/action/love2019/game.shtml](http://qian-img.tenpay.com/mb/action/love2019/game.shtml)

### 初始化PixiJS
```javascript
var opt = {
    width: window.innerWidth,
    height: window.innerHeight,
    antialias: true,    // default: false
    transparent: false, // default: false
    resolution: 1       // default: 1
};
//生成app对象，指定宽高，这里直接全屏
var app = new PIXI.Application(opt);
app.renderer.backgroundColor = 0xffffff;
app.renderer.autoResize = true;
//这里使用app生成的app.view(canvas)
document.body.appendChild(app.view);
//这里是APP的ticker，会不断调用此回调
//我们在这里去调用游戏的状态更新函数
app.ticker.add(function(delta) {
    //理论上要用delta去做时间状态处理，我们这里比较简单就不去处理时间问题了
    //每次执行都当做一个有效的更新
    game.update(delta);
});
```