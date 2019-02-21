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
此为一个躲避下落物体的小游戏，体验地址 (`移动端`)：[https://jiamao.github.io/pixigame/game.html](https://jiamao.github.io/pixigame/game.html)

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

> <img src="https://jiamao.github.io/pixigame/img/love.png" height="200px" alt="background"/>

### 精灵
加载完资源后，我们就可以用`PIXI.loader.resources`读取资源，制作一个普通精灵。
```javascript
var textures = PIXI.loader.resources['qq'].textures;
var sprite = new PIXI.Sprite(textures['qq_head.png']);
```
#### 动画

跟上面普通精灵类似，只是使用多个图片做为侦。然后用`PIXI.extras.AnimatedSprite`来播放。
例如下面我们取雪碧图中`f`开头的图片组成一个动画。
资源图: <img src="https://jiamao.github.io/pixigame/img/bling.png" height="200px" alt="bling"/>

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
//其它接口请查看官方文档
```
效果：![动画](https://jiamao.github.io/pixigame/img/doc/bling.gif)

#### 状态更新
每个对象都有一个`update`函数，都在这里自已更新自已的位置和状态(`update`由`app.ticker`定时调用)。所有对外开放的状态设置都提供接口，比如`die`、`move`等。
如下：
```javascript
this.die = function() {
    this.state = 'dead';
    this.sprite.visible = false;
    map.removeBob(this);
}
//发生碰撞，炸弹会导致气球破裂
this.hitEnd = function() {
    //气球破裂
    heart.break(function(){
        console.log('我跟气球撞了');
    });
}
//更新炸弹状态
this.update = function(delta) {
    //计算当前在屏幕中的坐标
    var p = map.toLocalPosition(this.position.x, this.position.y);
    //运行中，障碍物到屏幕时才需要显示
    if(game.state == 'play' && p.y >= -this.sprite.height) {
        this.start();
    }
    if(!this.sprite.visible) return;
    //移动精灵
    this.sprite.x = p.x;
    this.sprite.y = p.y;
    //出了屏外，则不需要再显示
    if(p.y > game.app.screen.height) {
        this.die();
        return;
    }
    //如果碰到当前精灵，则精灵死
    if(heart.hitTest(this)) {
        this.hitEnd();
    }
    this.position.y += this.vy; //保持自身的速度
}
```
### 游戏设计
#### 地图
##### 背景
游戏的背景是一张超长的图： 
> <img src="https://jiamao.github.io/pixigame/img/bg.jpg" width="20px" alt="background"/>
+ 第一要考虑的就是分辨率问题，因为高度相对于屏来说是够长的，这里我们以宽度跟屏宽的比来做为缩放比例，而且所有游戏元素都是相对于背景设计的，因此所有元素都采用此缩放比即可。
此处代码都是在游戏map对象中的。
```javascript
this.background = new pixiContainer(); //地图元素的container
this.scale = (this.width / this.bg_width).toFixed(4) * 1;//地图宽缩放比例，为整个地图缩放比例
this.height =  this.bg_height * this.scale;
this.background.scale.x = this.scale;
this.background.scale.y = this.scale;
```
计算对象在屏幕中的坐标
```javascript
 //转为画布坐标
toLocalPosition: function(x, y) {
    if(typeof x == 'object') {
        y = x.y;
        x = x.x;
    }
    x = x||0;
    y = y||0;
    //x坐标为地图偏移量在对象在地图的坐标
    x = x + this.offsetPosition.x;
    //y为屏高+当前地图相对屏的偏移量，加上对象在地图的Y坐标再减去屏幕高度。
    y = y + game.app.screen.height + this.offsetPosition.y - this.height;

    return {
        x: x,
        y: y
    };
},
```
+ 图片加载问题，如果直接加载长图效率太低。我们把图切成等高的五份。首次加载最底下的图，其它位置只用一个空精灵占位，再异步加载其它四张后替换其材质即可。
```javascript
//初始化背景图
var bgspOffsetY = 0;
var bgHeights = [1646,1640,1652,1652,1637];
//默认只加载了第一张图，其它的全用第一张图占位先，加载完后再覆盖
for(var i=bgHeights.length-1; i>=0; i--) {
    var bgsp = new pixiSprite(pixiResources['map_background1'].texture);
    bgsp.position.set(0, bgspOffsetY);
    this.background.addChild(bgsp);
    bgspOffsetY += bgHeights[i];
}
```

```javascript
//load其它背景图
loadBackground: function(hs) {
    var bg2=loadSource('map_background2', cdnDomain+'img/bg_2-min.jpg');
    var bg3=loadSource('map_background3', cdnDomain+'img/bg_3-min.jpg');
    var bg4=loadSource('map_background4', cdnDomain+'img/bg_4-min.jpg');
    var bg5=loadSource('map_background5', cdnDomain+'img/bg_5-min.jpg');
    if(!bg2.isComplete||!bg3.isComplete||!bg4.isComplete||!bg5.isComplete){
        pixiLoader.load(function(){
            //children中，第一张是第五张，依次
            for(var i=5;i>1;i--) {
                map.background.children[5-i].texture = pixiResources['map_background' + i].texture;
            }
        });
    }
    else {
        for(var i=5;i>1;i--) {
            this.background.children[5-i].texture = pixiResources['map_background' + i].texture;
        }
    }
}
```
+ 背景、障碍物和气球滑动问题。解决这个问题，我们把所有地图上的物体都初始化在背景上，它们的位置都是相对于背景的。当执行update时，实时根据地图相对于屏幕的位置来更新对象在屏幕上的坐标。
><img src="https://jiamao.github.io/pixigame/img/doc/bgdemo.png" width="20px" alt="bgdemo"/>
#### 气球
气球跟所有物体一样，有多个状态，当吃糖时还会有相应的动画。
比如，气球在复活时有一定时间的无敌状态，这时我们就要一闪一闪来表示。
```javascript
updateGoldAni: function() {
    //无敌显示状态 ,只隐显几下即可
    if(this.state == 'gold') {
        if(this.container.alpha >= 1) {
            this.__appha_dir = 0;
        }
        else if(this.container.alpha <= 0.4) {
            this.__appha_dir = 1;
        }
        if(this.__appha_dir) {
            this.container.alpha += 0.02;
        }
        else {
            this.container.alpha -= 0.02;
        }
    }
    else if(this.container.alpha != 1) {
        this.container.alpha = 1;
    }
},
```
#### 滑动事件
由于无论滑到屏幕任何位置都需要有效，则把事件绑到stage上。`PixiJS`对象如果要响应事件，则必须把`interactive`设置为`true`。
```javascript
//绑定滑动事件
bindEvent: function() {
    var isTouching = false; //是否在移动中
    var lastPosition = {x:0, y:0};//最近一次移到的地方
    this.app.stage.interactive = true;
    this.app.stage.on('touchstart', function(e){
        if(game.state == 'play') {
            isTouching = true;
            lastPosition.x = e.data.global.x;
            lastPosition.y = e.data.global.y;
            e.data.originalEvent && e.data.originalEvent.preventDefault && e.data.originalEvent.preventDefault();
            //console.log(e.data.global)
        }
    }).on('touchmove', function(e){
        if(isTouching && game.state == 'play') {
            //console.log(e.data.global, lastPosition);
            var offx = e.data.global.x - lastPosition.x;
            heart.move(offx); //移动气球，只让横向移动
            lastPosition.x = e.data.global.x;
            lastPosition.y = e.data.global.y;
        }
        e.data.originalEvent && e.data.originalEvent.preventDefault && e.data.originalEvent.preventDefault();
    }).on('touchend', touchEnd).on('touchcancel', touchEnd).on('touchendoutside', touchEnd);
    function touchEnd(e) {
        heart.m_state = 'normal';
        console.log('normal')
        isTouching = false;
        heart.line.gotoAndStop(0);
        e.data.originalEvent && e.data.originalEvent.preventDefault && e.data.originalEvent.preventDefault();
    }
},
```
在移动时，需要播放气球线条的左右移动画。line是一个animation精灵。
```javascript
var newx = this.container.x + offsetX;
var directX = newx - this.container.x;
//往右移动
if(directX > 0) {
    if(this.m_state != 'right') {
        //开始右移动画
        this.line.gotoAndPlay(1);
    }
    this.m_state = 'right'; //往右移动
}
//往左移动
else if(directX < 0) {
    if(this.m_state != 'left') {
        //开始右移动画
        this.line.gotoAndPlay(5);
    }
    this.m_state = 'left'; //往左移动
}
//超过一定时间没移动，则回到正常位置
this.__moveTimeHandler = setTimeout(function(){
    heart.m_state = 'normal';
    heart.line.gotoAndStop(0);
}, 500);
this.container.x = newx;
```
#### 障碍物
障碍物和糖果只需要相对于地图移动即可，为了保证路不被卡死，我们一排最多放置3个障碍物。
且难易分为三个阶段
1. 一阶段比较简单，每排放置1和2个，并且行距比较大，掉落速度最慢。
2. 二阶段每排放1和3个，增加一定速度。
3. 三阶段每排2和3个，速度最快，且行距最小。

>>为了简化游戏，上一行的的空档和当前行空档之前的物体上下浮动增加一些错乱感。

#### 碰撞检测
这块比较简单，都是规则的矩形。
```javascript
//二个矩形是否有碰撞
function hitTestRectangle(r1, r2) {
    var hitFlag, combinedHalfWidths, combinedHalfHeights, vx, vy, x1, y1, x2, y2, width1, height1, width2, height2;
    hitFlag = false;

    x1 = r1.x;
    x2 = r2.x;
    y1 = r1.y;
    y2 = r2.y;
    width1 = r1.width;
    width2 = r2.width;
    height1 = r1.height;
    height2 = r2.height;
    //如果对象有指定碰撞区域，则我们采用指定的坐标计算
    if(r1.hitArea) {
        x1 += r1.hitArea.x * map.scale;
        y1 += r1.hitArea.y * map.scale;
        width1 = r1.hitArea.width * map.scale;
        height1 = r1.hitArea.height * map.scale;
    }
    if(r2.hitArea) {
        x2 += r2.hitArea.x * map.scale;
        y2 += r2.hitArea.y * map.scale;
        width2 = r2.hitArea.width * map.scale;
        height2 = r2.hitArea.height * map.scale;
    }

    //中心坐标点
    r1.centerX = x1 + width1 / 2;
    r1.centerY = y1 + height1 / 2;
    r2.centerX = x2 + width2 / 2;
    r2.centerY = y2 + height2 / 2;

    //半宽高
    r1.halfWidth = width1 / 2;
    r1.halfHeight = height1 / 2;
    r2.halfWidth = width2 / 2;
    r2.halfHeight = height2 / 2;

    //中心点的X和Y偏移值
    vx = r1.centerX - r2.centerX;
    vy = r1.centerY - r2.centerY;

    //计算宽高一半的和
    combinedHalfWidths = r1.halfWidth + r2.halfWidth;
    combinedHalfHeights = r1.halfHeight + r2.halfHeight;

    //如果中心X距离小于二者的一半宽和
    if (Math.abs(vx) < combinedHalfWidths) {
        //如果中心V偏移量也小于半高的和，则二者碰撞
        if (Math.abs(vy) < combinedHalfHeights) {
            hitFlag = true;
        } else {
            hitFlag = false;
        }
    } else {
        hitFlag = false;
    }
    return hitFlag;
};
```

此小游戏主要内容就这么多，具体的可以细看代码：
>[https://github.com/jiamao/pixigame](https://github.com/jiamao/pixigame)
