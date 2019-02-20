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
* `PIXI.extras.AnimatedSprite` 动画精灵，可以设置多个图片，按序播放。
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

### 资源加载
加载资源使用`PIXI.loader`，支持单个图片，或雪碧图的配置json文件。
```
PIXI.loader
.add(name1, 'img/bg_1-min.jpg')
.add(name2, 'img/love.json').load(function(){
    //加载完
});
```
雪碧图和其json配置文件可以用工具`TexturePackerGUI`来生成，
格式如下:
```json
{"frames": {

"bomb.png":
{
	"frame": {"x":0,"y":240,"w":192,"h":192},
	"rotated": false,
	"trimmed": false,
	"spriteSourceSize": {"x":0,"y":0,"w":192,"h":192},
	"sourceSize": {"w":192,"h":192}
},
...//省略多个
"x.png":
{
	"frame": {"x":576,"y":240,"w":192,"h":192},
	"rotated": false,
	"trimmed": false,
	"spriteSourceSize": {"x":0,"y":0,"w":192,"h":192},
	"sourceSize": {"w":192,"h":192}
}},
"animations": {
	"m": ["m1.png","m2.png"]
},
"meta": {
	"app": "https://www.codeandweb.com/texturepacker",
	"version": "1.0",
	"image": "love.png?201902132001",
	"format": "RGBA8888",
	"size": {"w":768,"h":432},
	"scale": "1",
	"smartupdate": "$TexturePacker:SmartUpdate:5bb8625ec2f5c0ee2a84ed4f5a6ad212:f3955dc7846d47f763b8c969f5e7bed3:7f84f9b657b57037d77ff46252171049$"
}
}
```

> <img src="https://raw.githubusercontent.com/jiamao/pixigame/master/img/love.png" height="200px" alt="background"/>

### 精灵
加载完资源后，我们就可以用`PIXI.loader.resources`读取资源，制作一个普通精灵。
```javascript
var textures = PIXI.loader.resources['qq'].textures;
var sprite = new PIXI.Sprite(textures['qq_head.png']);
```
#### 动画

跟上面普通精灵类似，只是使用多个图片做为侦。然后用`PIXI.extras.AnimatedSprite`来播放。
例如下面我们取雪碧图中`f`开头的图片组成一个动画。
资源图: <img src="https://raw.githubusercontent.com/jiamao/pixigame/master/img/bling.png" height="200px" alt="bling"/>

```javascript
var textures = PIXI.loader.resources['bling'];
var expTextures = [];//当前动画所有材质集合
var keys = textures.data.animations['f'];
//按索引排个序，以免侦次序乱了
keys.sort(function(k1,k2){
    return k1.replace(/[^\d]/g,'') - k2.replace(/[^\d]/g,'');
});
for(var i=0;i<keys.length;i++) {
    var t = textures[keys[i]];
    expTextures.push(t);
}
var side = new PIXI.extras.AnimatedSprite(expTextures);
side.animationSpeed = 0.15;//指定其播放速度
app.stage.addChild(side);
//其它接口可以查看官方文档
```
效果：![动画](http://qian-img.tenpay.com/resources/vtools/img/201902/61239174ed9e68f5a3a555863e21d0f3.gif)
### 地图
游戏的背景是一张超长的图： 
> <img src="https://raw.githubusercontent.com/jiamao/pixigame/master/img/bg.jpg" width="20px" alt="background"/>

```flow
st=>start: 开始
op=>operation: my operation
cond=>condition: Yes or No?
e=>end
st->op->cond
cond(yes)->e
cond(no)->op
```