
//游戏主体文件
//要注册交互事件前，一定要把显示对象的interactive和buttonMode属性设为true。
(function(win, doc){
    var pixiResources = PIXI.loader.resources;
    var pixiLoader = PIXI.loader;
    var pixiTextureCache = PIXI.utils.TextureCache;
    var pixiTexture = PIXI.Texture;
    var pixiContainer = PIXI.Container;
    var pixiSprite = PIXI.Sprite;
    var pixiRectangle = PIXI.Rectangle;
    var width = Math.min(win.innerWidth, 700);
    var height = Math.min(win.innerHeight, 1200);
    var maxScore = 520;//最高得分
    var tempSprites = [];//临时的精灵，很快就会消失的    
    var cdnDomain = '';

    //声音
    var sucSound,failSound,bgSound;
    /*let type = "WebGL"
    if(!PIXI.utils.isWebGLSupported()){
        type = "canvas"
    }

    PIXI.utils.sayHello(type)*/
    var game = {
        score: 0,  //总得分
        mapScore: 0,//移动得分
        bScore: 0,//道具得分
        state: 'init', //游戏状态，init=等待开始，play=进行中,pause=暂停, end=已结束
        init: function(canvas, callback){
            this.state = 'init';
            width = Math.min(win.innerWidth, 700);
            height = Math.min(win.innerHeight, 1200);
            this.score = this.mapScore = this.bScore = 0;
            if(!this.app) {
                var opt = {
                    width: width,
                    height: height,
                    antialias: true,    // default: false
                    transparent: false, // default: false
                    resolution: 1       // default: 1
                };
                if(typeof canvas == 'string') {
                    opt.view = document.getElementById(canvas);
                }
                else if(canvas) {
                    opt.view = canvas;
                }
                //Create a Pixi Application
                this.app = new PIXI.Application(opt);
                this.app.renderer.backgroundColor = 0xffffff;
                this.app.renderer.autoResize = true;
                //Add the canvas that Pixi automatically created for you to the HTML document
                if(!opt.view) doc.body.appendChild(this.app.view);
                this.load(function(){
                    init();
                    game.app.ticker.add(function(delta) {
                        game.update(delta);
                    });
                    loadSounds();//加载声音
                    callback && callback();
                });
                this.bindEvent();
            }
            else {
                init();
                callback && callback();
            }
        },
        //资源加载
        load: function (callback) {
            var bg1=loadSource('map_background1', cdnDomain+'img/bg_1-min.jpg'),
            qq=loadSource('qq', cdnDomain + "img/qq.json?201902132001"),
            love=loadSource('love', cdnDomain + "img/love.json?201902132001"),
            bling=loadSource('bling', cdnDomain + "img/bling.json?201902132001");
            if(!bg1.isComplete || !qq.isComplete||!love.isComplete||!bling.isComplete) {
                pixiLoader.load(function(){
                    callback && setTimeout(callback, 0);
                });
            }
            else {
                callback && callback();
            }

            //异步调用音乐加载
            loadSounds();
        },
        show: function() {
            heart.show();//显示
        },
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
                    heart.move(offx);
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
        update: function(delta) {

            this.score = Math.floor(this.mapScore + this.bScore);
            if(this.score > maxScore) this.score = maxScore;

            map.update(delta);
            heart.update(delta);
        },
        //开始玩
        play: function(){
            if(this.state == 'pause' || this.state == 'init') {
                //暂停开始，倒计时且无敌段时间，
                if(this.state == 'pause') {
                    heart.reset();//气球复原
                    heart.counter(3, function(){
                        heart.setGold();//变为无敌
                        game.state = 'play';
                    });//继续
                }
                else {
                    this.state = 'play';
                }

                this.onPlay && this.onPlay(this);
            }
            game.soundState!=2 && bgSound && bgSound.restart();
        },
        //游戏中止，碰到障碍物
        break: function(){
            this.onBreak && this.onBreak();
        },
        pause: function() {
            if(this.state == 'play') this.state = 'pause';
            bgSound && bgSound.pause();
        },
        //重新开始
        replay: function() {
            this.init();
            //this.onPlay && this.onPlay(this, 'replay');
        },
        end: function() {
            this.state = 'end';
            map.end();
            heart.end(function(){
                game.onEnd && game.onEnd();
            });
        }
    };


    //加载资源，如果没有加载过的话
    var resources = {};
    function loadSource(name, url) {
        if(!resources[name] && !pixiLoader.loading) {
            pixiLoader
            .add(name, url);
            resources[name] = pixiLoader.resources[name];
        }
        return resources[name];
    }

    //初始化游戏，游戏界页，开始按钮等初始
    function init() {
        map.init(); //初始化地图
        heart.init(); //初始化心气球
        game.map = map;
        game.heart = heart;
    }

    //心形对象
    var heart = (function(){
        return {
            vy: 0.5,
            init: function(){
                this.vy = 1.1;
                var hpos = game.app.screen.height*0.85;
                if(!this.container) {

                    this.mask = new PIXI.Graphics();
                    this.mask.beginFill(0);
                    this.mask.alpha = 0.5;
                    this.mask.drawRect(0, 0, game.app.screen.width, game.app.screen.height);
                    this.mask.endFill();
                    game.app.stage.addChild(this.mask);

                    var textures = pixiResources['qq'].textures;

                    this.head = new pixiSprite(textures['qq_head.png']);
                    this.container = new pixiContainer();
                    this.container.interactive = true;

                    //得分QQ动画
                    var scoreTextures = [];
                    for(var i=2;i<=13;i++) {
                        scoreTextures.push(textures['qq_score' + i + '.png']);
                    }
                    this.scoreAni = new PIXI.extras.AnimatedSprite(scoreTextures);
                    this.scoreAni.loop = false;
                    this.scoreAni.visible = false;
                    //this.scoreAni.interactive = true;
                    this.scoreAni.animationSpeed = 0.2;
                    this.scoreAni.anchor.set(0.5);
                    this.scoreAni.onComplete = function(e) {
                        this.visible = false;
                    }
                    this.container.addChild(this.scoreAni);

                    this.head.anchor.set(0.5);
                    //this.head.interactive = true;
                    this.container.addChild(this.head);

                    //碰到不该碰的东西，炸裂动画
                    var breakTextures = [];
                    for(var i=1;i<=6;i++) {
                        breakTextures.push(textures['break' + i + '.png']);
                    }
                    this.breakHead = new PIXI.extras.AnimatedSprite(breakTextures);
                    this.breakHead.loop = false;
                    this.breakHead.anchor.set(0.5);
                    this.breakHead.animationSpeed = 0.4;
                    //this.breakHead.interactive = true;
                    this.breakHead.visible = false;
                    this.container.addChild(this.breakHead);
                    var self = this;
                    this.breakHead.onComplete = function(e) {
                        if(self.breakHandler) self.breakHandler();
                        self.container.visible = false;
                    }

                    //底部线条
                    var lineTextures = [];
                    lineTextures.push(textures['normal.png']);
                    for(var i=1;i<=4;i++) {
                        lineTextures.push(textures['left' + i + '.png']);
                    }
                    for(var i=1;i<=4;i++) {
                        lineTextures.push(textures['right' + i + '.png']);
                    }
                    this.line = new PIXI.extras.AnimatedSprite(lineTextures);
                    //this.line.interactive = true;
                    this.line.anchor.set(0.5);
                    this.line.gotoAndStop(0);
                    //鍞发生改变
                    this.line.onFrameChange = function(e){
                        //如果正在往右移，则停到第8侦就不需要再动了
                        if(heart.m_state == 'right') {
                            if(this.currentFrame == 4) {
                                this.stop();
                            }
                        }
                        //正在往左移就停在第4侦
                        else if(heart.m_state == 'left') {
                            if(this.currentFrame == 8) {
                                this.stop();
                            }
                        }
                    }
                    this.container.addChild(this.line);

                    //炸裂动画，得分动画中心都得跟QQ中心对齐
                    //高度最高的是得分动画，所以用它计算中心
                    this.headCenter = {
                        x: this.container.width / 2,
                        y: this.container.height / 2
                    };

                    this.scoreAni.position.set(this.headCenter .x, this.headCenter .y);
                    this.head.position.set(this.headCenter .x, this.headCenter .y);
                    this.breakHead.position.set(this.headCenter .x, this.headCenter .y);
                    this.line.position.set(this.headCenter.x + 4, this.headCenter .y + this.head.height/2-5);

                    //由于气球大小，不是整个container大小，所以需要设置偏移边线
                    this.container.hitArea = new pixiRectangle((this.container.width - this.head.width + 80)/2, (this.container.height - this.head.height + 80)/2,
                        (this.head.width-80), (this.head.height-150));
                    this.__minLeft = this.container.hitArea.x * map.scale;  //最小左侧坐标
                    this.__maxLeft = (game.app.screen.width - this.container.width * map.scale) + this.__minLeft; //左侧最大位置
                    this.__minTop = this.container.hitArea.y * map.scale;

                    function start_event(e) {
                        heart.start();
                        e && e.data.originalEvent && e.data.originalEvent.preventDefault && e.data.originalEvent.preventDefault();
                    }
                    this.container.on('tap', start_event);

                    //跟地图同缩放
                    this.container.scale.x = map.scale;
                    this.container.scale.y = map.scale;
                    game.app.stage.addChild(this.container);

                    this.start_helper = new pixiContainer();
                    var taptxt = new PIXI.Text('躲避障碍 到达终点', {
                        fontFamily: "Arial",
                        fontSize: 36,
                        fontWeight: '500',
                        fill: "#fff",
                        stroke: '#fff',
                        textBaseline: '',
                        align : 'center'
                    });

                    this.start_helper.addChild(taptxt);
                    var tapsp = new pixiSprite(pixiResources['love'].textures['start_tap.png']);
                    this.start_helper.addChild(tapsp);
                    this.start_button = new pixiSprite(pixiResources['love'].textures['startbutton.png']);
                    this.start_button.visible = false;

                    this.start_helper.addChild(this.start_button);
                    tapsp.anchor.set(0.5);
                    taptxt.anchor.set(0.5);
                    this.start_button.anchor.set(0.5);

                    var cx = this.start_helper.width / 2;
                    var cy = this.start_helper.height / 2;
                    tapsp.position.set(cx, cy);
                    taptxt.position.set(cx, cy - taptxt.height * 5);
                    this.start_button.position.set(cx, cy + this.start_button.height + 20);

                    this.start_helper.scale.x = map.scale;
                    this.start_helper.scale.y = map.scale;
                    this.start_helper.position.set((map.width - this.start_helper.width)/2+4, hpos - tapsp.height*map.scale);
                    game.app.stage.addChild(this.start_helper);
                    this.start_helper.interactive = true;
                    this.start_helper.on('tap', start_event);

                    if(this.__showed) {
                        this.show();
                    }
                }

                //游戏玩时，气球位置, 开始位置跟这个不一样
                if(!this.play_pos) this.play_pos = {x: (map.width - this.container.width)/2, y: hpos - this.container.height};
                this.container.position.set(this.play_pos.x, this.play_pos.y);

                //点击开始，指引
                this.start_helper.visible = true;
                this.mask.visible = true;
                this.reset();
            },
            show: function() {
                this.__showed = true;
                //延时出现开始按钮
                this.start_button && setTimeout(function(){
                    heart.start_button.visible = true;
                }, 1000);
            },
            start: function() {
                if(game.state == 'init') {
                    this.start_helper.visible = false;
                    this.mask.visible = false;
                    game.play();//开始游戏
                }
            },
            //回到继续可玩状态
            reset: function() {
                this.head.visible = true;
                this.line.visible = true;
                this.breakHead.visible = false;
                this.container.visible = true;
                /*if(game.state == 'init') {
                    //计数3秒后开始
                    this.counter(3, function(){
                        heart.start();
                    });
                }*/
            },
            //气球移动
            move: function(offsetX, offsetY) {
                this.lastMoveTime = new Date().getTime();
                this.__moveTimeHandler && clearTimeout(this.__moveTimeHandler);
                var newx = this.container.x + offsetX;
                if(newx <= -this.__minLeft) newx = - this.__minLeft;
                else if(newx >= this.__maxLeft) {
                    newx = this.__maxLeft;
                }
                if(offsetY) {
                    var newy = this.container.y + offsetY;
                    if(newy <= 0) newy = 0;
                    else if(newy >= game.app.screen.height-this.container.height) {
                        newy = app.screen.height-this.container.height;
                    }
                    this.container.y = newy;
                }
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
            },
            break: function(callback) {
                game.pause();
                game.soundState!=2 && failSound && failSound.play();
                this.head.visible = false;
                this.line.visible = false;
                this.breakHead.visible = true;
                this.breakHead.gotoAndPlay(0);
                this.breakHandler = function(){
                    callback && callback();
                    game.break();
                };
            },
            //继续，计时加无敌一段时间
            counter: function(timeNum, callback) {
                if(typeof timeNum == 'function') {
                    callback = timeNum;
                    timeNum = 0;
                }
                var self = this;
                //倒计时
                if(!this.__numContainer) {
                    timeNum = timeNum||5;
                    this.__numContainer = new PIXI.Text(timeNum, {
                        fontFamily: "Arial",
                        fontSize: 130,
                        fontWeight: 'bold',
                        fill: "#fff",
                        stroke: '#fff',
                        textBaseline: '',
                        align : 'center'
                    });
                    this.__numContainer.position.set((game.app.screen.width-this.__numContainer.width)/2, (game.app.screen.height-this.__numContainer.height)/2);
                    game.app.stage.addChild(this.__numContainer);
                }
                if(timeNum) {
                    this.__numContainer.text = timeNum;
                }
                //每一秒处理一次，
                setTimeout(function(){
                    var num = Number(self.__numContainer.text);
                    num --;
                    if(num == 0) {
                        game.app.stage.removeChild(self.__numContainer);
                        self.__numContainer = null;
                        callback && callback();
                        return;
                    }
                    self.__numContainer.text = num;
                    self.counter(callback);
                }, 1000);
            },
            //设置无敌状态
            setGold: function(){
                this.state = 'gold';//无敌中
                var self = this;
                setTimeout(function(){
                    self.state = 'normal';//回复原状态
                }, 3000);
            },
            //增加分数
            addScore: function(score) {
                score  = score||0;
                if(score >= 10) {
                    var ani = new scoreSprite(score, this);
                    tempSprites.push(ani);
                }
                //动画在跑时不重复
                if(!this.scoreAni.visible) {
                    this.scoreAni.visible = true;
                    this.scoreAni.gotoAndPlay(0);
                }
                game.bScore += score;
            },
            //状态更新
            update: function(delta) {
                this.updateGoldAni(delta);

                this.vy += 0.0001;
            },
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
            //碰撞检测
            hitTest: function(role) {
                if(!this.container || !role || (this.state == 'gold' && role instanceof t_bob)) return false;
                if(role.sprite && !role.sprite.visible) return false;
                var ret = hitTestRectangle(this.container, role.sprite||role);
                return ret;
            },
            end: function(callback){
                //游戏结束，飞往二个情侣中间
                var targetX = (game.app.screen.width - this.container.width) / 2 - 18 * map.scale;
                var targetY = 10 * map.scale;//game.app.screen.height / 3 - this.container.height;
                var curX = this.container.x;
                var curY = this.container.y;
                var offx = targetX - curX;
                var offy = targetY - curY;
                var len = Math.sqrt(offx * offx + offy * offy);
                var p = len / 60;
                var px = offx / len * p;
                var py = offy / len * p;
                var self = this;
                var moveHandler = setInterval(function(){
                    self.container.x += px;
                    self.container.y += py;
                    if((offx >= 0 && self.container.x >= targetX) || (offx < 0 && self.container.x <= targetX)) {
                        self.container.x = targetX;
                    }
                    if((offy >= 0 && self.container.y >= targetY) || (offy < 0 && self.container.y <= targetY)) {
                        self.container.y = targetY;
                    }
                    //结束
                    if(self.container.y == targetY && self.container.x == targetX) {
                        clearInterval(moveHandler);
                        callback && callback();
                    }
                }, 20);
            }
        };
    })();

    //当前游戏地图
    //我们把整个地图画成一个大图
    //屏幕和角色相对于地图移动
    var map = (function(){
        return {
            bg_width: 0,
            bg_height: 0,
            maxScore: 500, //地图移动最大分数
            scale: 1, //默认比例
            //地图当前的偏移量，当画布在地图上移动时会修改此值
            offsetPosition: {
                x: 0,
                y: 0
            },
            sprites: [], //所有地图精灵
            init: function(){
                this.width = game.app.screen.width;
                this.offsetPosition.x = 0;
                this.offsetPosition.y = 0;
                //地图背景
                if(!this.background) {
                    this.background = new pixiContainer();
                    var bgspOffsetY = 0;
                    var bgHeights = [1646,1640,1652,1652,1637];
                    //默认只加载了第一张图，其它的全用第一张图占位先，加载完后再覆盖
                    for(var i=bgHeights.length-1; i>=0; i--) {
                        var bgsp = new pixiSprite(pixiResources['map_background1'].texture);
                        bgsp.position.set(0, bgspOffsetY);
                        this.background.addChild(bgsp);
                        bgspOffsetY += bgHeights[i];
                    }
                    this.loadBackground(bgHeights);//异步load其它背景图
                    this.bg_width = this.background.width;
                    this.bg_height = this.background.height;
                    //this.background = new pixiSprite(pixiResources['map_background'].texture);
                    //this.background = PIXI.Sprite.fromImage(cdnDomain + 'img/bg.jpg');
                    //地图层按比例缩小或放大
                    this.scale = (this.width / this.bg_width).toFixed(4) * 1;//地图宽缩放比例，为整个地图缩放比例
                    this.height =  this.bg_height * this.scale;
                    this.background.scale.x = this.scale;
                    this.background.scale.y = this.scale;
                    //this.background.width = this.width;
                    //this.background.height = this.height;
                    //结束线
                    this.endLine = this.height - game.app.screen.height;
                    this.scorePerFix = this.maxScore / this.endLine;//移动距离得分

                    game.app.stage.addChild(this.background);
                }

                //地图总对相对于最左上角0,0
                this.move(0, 0);

                this.initBob();//初始化障碍物

                //计分牌
                var spos = 20;
                if(!this.scoreContainer) {
                    this.scoreContainer = new pixiContainer();
                    this.scoreContainer.scale.x = this.scale;
                    this.scoreContainer.scale.y = this.scale;
                    var loveRes = pixiResources['love'].textures;
                    var scoreBg = new pixiSprite(loveRes['score_bg.png']);
                    this.scoreContainer.addChild(scoreBg);
                    this.scoreTxt = new PIXI.Text(game.score, {
                        fontFamily: "Arial",
                        fontSize: 30,
                        fontWeight: '300',
                        fill: "#000",
                        stroke: '#000',
                        textBaseline: '',
                        align : 'left'
                    });
                    //this.scoreTxt.width = scoreBg.width - 70;
                    this.scoreContainer.position.set(this.width - this.scoreContainer.width + 10, spos);
                    this.scoreContainer.addChild(this.scoreTxt);
                    this.scoreTxt.position.set(this.scoreContainer.width/this.scale-this.scoreTxt.width-10, (scoreBg.height-this.scoreTxt.height-4)/2);
                }
                else {
                    game.app.stage.removeChild(this.scoreContainer);
                }
                game.app.stage.addChild(this.scoreContainer);

                //初始化声音按钮
                if(!this.musicBtn) {
                    this.musicBtn = new pixiSprite(loveRes['m1.png']);
                    this.musicBtn.scale.x = this.scale;
                    this.musicBtn.scale.y = this.scale;
                    this.musicBtn.position.set(10, spos);
                    this.musicBtn.interactive = true;
                    this.musicBtn.on('tap', function(){
                        //如果是静音，则开始播放
                        if(game.soundState == 2) {
                            game.state=='play' && bgSound && bgSound.restart();
                            game.soundState = 1;
                            map.musicBtn.texture = loveRes['m1.png'];
                        }
                        else {
                            bgSound && bgSound.pause();
                            game.soundState = 2;
                            map.musicBtn.texture = loveRes['m2.png'];
                        }
                    });
                }
                else {
                    game.app.stage.removeChild(this.musicBtn);
                }
                game.app.stage.addChild(this.musicBtn);
            },
            //生成障碍物
            initBob: function() {
                //清除已存在的障碍物
                this.clearBob();
                //障碍物分三阶段
                /*
                （1）第一阶段：速度较慢，障碍数量较少
                （2）第二阶段：速度加快，障碍数量增加
                （3）第三阶段：速度最快
                */

                //障碍物所在区间，第一屏和最后一屏不需要
               var bobStartY = game.app.screen.height;
               var bobAreaHeight = this.height - game.app.screen.height * 2;

               //第一阶段
               var bobNum = 10;     //障碍物个数
               var bobHeight = bobAreaHeight / 3; //高度
               var lineNum = 18;//分成多少行
               var bobWidth = this.width - 50;
               var bobStart = bobStartY + bobHeight * 2;
               var bobMaxVy = 1.8;
               var lastEmptyIndex = 0;

               for(var i=0;i < lineNum;i+=1) {
                   if(i == 1) continue;//去掉第二行，以免跟上一行太近。
                   var lc = i % 2 == 0?1:2;
                    lastEmptyIndex = createLineBobs(1, i, lc, bobStart, bobHeight, lastEmptyIndex, bobMaxVy, lineNum);
               }

               //第二阶段
               var bobNum = 20;     //障碍物个数
               var bobStart = bobStartY + bobHeight;
               var bobMaxVy = 2.2;
               lineNum = 12;
               for(var i=1;i < lineNum;i+=1) {
                    var lc = i % 2 == 0?1:3;
                    lastEmptyIndex = createLineBobs(2, i, lc, bobStart, bobHeight, lastEmptyIndex, bobMaxVy, lineNum);
                }

               //第三阶段
               var bobNum = 30;     //障碍物个数
               var bobStart = bobStartY * 0.5;
               bobHeight += bobStartY * 0.5;
               var bobMaxVy = 3;
               lineNum = 15;
               for(var i=1;i < lineNum;i+=1) {
                    var lc = i % 2 == 0?2:3;
                    lastEmptyIndex = createLineBobs(3, i, lc, bobStart, bobHeight, lastEmptyIndex, bobMaxVy, lineNum);
                }
            },
            start: function() {
                //初始化位置
                this.offsetPosition = {
                    x: 0,
                    y: 0
                };
                for(var i=0;i<this.sprites.length;i++) {
                    this.sprites[i].sprite.visible = true;
                    this.sprites[i].update(0);
                }
            },
            //因为这里的精灵是相对于地图的，需要把坐标转换为canvas的
            update: function(delta){
                //临时界面元素
                for(var i=tempSprites.length-1;i>=0; i--) {
                    if(tempSprites[i].update) tempSprites[i].update(delta);
                }

                if(game.state == 'play') {
                    var vy = heart.vy;
                    //没有了精灵后，加速冲
                    if(!this.sprites.length) {
                        vy *= 5;
                    }
                    this.move(0 , vy);

                    for(var i=0;i<this.sprites.length;i++) {
                        this.sprites[i].update(delta);
                    }

                    if(this.offsetPosition.y >= this.endLine) {
                        game.end();//结束游戏
                        console.log(this.offsetPosition);
                    }
                }
                this.scoreTxt.text = game.score;
                //每次计算分数为右侧对齐
                this.scoreTxt.x = this.scoreContainer.width/this.scale-this.scoreTxt.width-40;
            },
            //转为画布坐标
            toLocalPosition: function(x, y) {
                if(typeof x == 'object') {
                    y = x.y;
                    x = x.x;
                }
                x = x||0;
                y = y||0;

                x = x + this.offsetPosition.x;
                y = y + game.app.screen.height + this.offsetPosition.y - this.height;

                return {
                    x: x,
                    y: y
                };
            },
            //开始移动
            move: function(x, y) {
                this.offsetPosition.x += x;
                this.offsetPosition.y += y;

                //地图需要滚动
                if(this.background) {
                    //地图总对相对于最左上角0,0
                    var p = this.toLocalPosition(0, 0);
                    this.background.x = p.x;
                    this.background.y = p.y;
                    if(this.background.y > 0) this.background.y = 0;

                    //每移动一段距离得分，但总得分不能超过500
                    var score = this.scorePerFix * y;
                    var mapScore = game.mapScore + score;
                    if(mapScore > this.maxScore) {
                        mapScore = this.maxScore;
                    }
                    game.mapScore = mapScore;
                }
            },
            end: function(){
                this.clearBob();
                //显示结束祝福语
                /*if(!this.ret_txt) {
                    this.ret_txt = new pixiSprite();
                    game.app.stage.addChild(this.ret_txt);
                }
                //随机显示一条
                var retindex = 'ret_txt' + (Math.floor(Math.random() * 4) + 1);
                var retimg = loadSource(retindex, 'img/' + retindex + '.png');
                if(!retimg.isComplete){
                    pixiLoader.load(function(){
                        map.ret_txt.texture = pixiResources[retindex].texture;
                        map.ret_txt.position.set((map.width-map.ret_txt.width)/2, game.app.screen.height*0.2);
                    });
                }
                else {
                    this.ret_txt.texture = pixiResources[retindex].texture;
                    this.ret_txt.position.set((thhis.width-this.ret.ret_txt.width)/2, game.app.screen.height*0.2);
                }
                this.ret_txt.visible = true;//显示
                */
            },
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
                        map.background.children[5-i].texture = pixiResources['map_background' + i].texture;
                    }
                }
            },
            removeBob: function(b) {
                game.app.stage.removeChild(b.sprite);
                for(var i=this.sprites.length-1;i>=0;i--){
                    if(this.sprites[i] == b) {
                        this.sprites.splice(i, 1);
                        break;
                    }
                };
            },
            clearBob: function() {
                //清除已存在的障碍物
                for(var i=this.sprites.length-1;i>=0;i--){
                    this.sprites[i].die();
                };
            }
        }

        //生成一排炸弹精灵
        function createLineBobs(page, line, bobnum, bobStart, bobHeight, lastEmptyIndex, bobMaxVy, lineNum) {
            var bobs = ['cz.png','d.png','x.png','bomb.png'];//'h.png',
            var numInCount = 4;//每排最多个数
            if(bobnum > numInCount - 1) bobnum = numInCount - 1;

            var curCols = {};
            var curEmptyIndex = Math.floor(Math.random() * numInCount);//每排的最少一个空位，不能堵死
            //从第二阶段开始，空档不在一竖线上
            //if(page > 1) {
                while(curEmptyIndex == lastEmptyIndex || (lastEmptyIndex == 0 && curEmptyIndex==3)||(lastEmptyIndex==3&&curEmptyIndex==0)) {
                    curEmptyIndex = Math.floor(Math.random() * numInCount);
                }
            //}
            var lineStep = bobHeight / lineNum;
            var posy = Math.abs(bobHeight-line * lineStep) + bobStart; //所在行的y
            for(var i=0; i<bobnum; i++) {
                var n = Math.floor(Math.random() * bobs.length);
                var p = new t_bob(bobs[n]);

                p.position.y = posy; //所在行的y
                var index = Math.floor(Math.random() * numInCount);//当前为第几个
                //如果命中空位或当前行已经有的，则继续随机下一个位置
                while(curCols[index] || curEmptyIndex==index) {
                    index = Math.floor(Math.random() * numInCount);
                }
                curCols[index] = p;

                p.position.x = index * p.sprite.width - 20;

                //如果在二行空档外边
                if((index < lastEmptyIndex && index < curEmptyIndex)||(index > lastEmptyIndex && index > curEmptyIndex)) {
                    p.position.y += lineStep * (Math.random() * 0.5);
                }

                //如果是上一行的空档，则不能有速度
                //if(index != lastEmptyIndex) {
                    p.vy = bobMaxVy;// * (Math.random() * 0.2 + 1);
                //}
                //else {
                //    p.vy = bobMaxVy * Math.random() * 0.8;
                //}
                map.sprites.push(p);
                p.add();
           }
           //在第二和第三阶段放入加分项
           if(line == 5 || line == 10) {
                //放置第二个加分粮
                var posx = curEmptyIndex * p.sprite.width - 20;
                var b = new bling(posx, posy, bobMaxVy);
                b.add();
                map.sprites.push(b);
            }
           return curEmptyIndex;
        }
    })();

    /**
     * name: cz.png,d.png,h.png,x.png,bomb.png
     */
    function t_bob(name, x, y, vy) {
        this.vy = vy||0;
        this.position = {
            x: x||0,
            y: y||0
        };
        var loveRes = pixiResources['love'].textures;
        this.sprite = new pixiSprite(loveRes[name]);
        var hitx = 60;
        var hity = 60;
        this.sprite.hitArea = new pixiRectangle(hitx, hity,
            this.sprite.width-hitx*2, this.sprite.height-hity*2);

        this.sprite.scale.x = map.scale;
        this.sprite.scale.y = map.scale;
        this.sprite.visible = false;

        this.add = function() {
            this.state = 'live';
            game.app.stage.addChild(this.sprite);
        }
        this.start = function(){
            this.state = 'live';
            this.sprite.visible = true;
        }

        this.die = function() {
            this.state = 'dead';
            this.sprite.visible = false;
            map.removeBob(this);
        }
        this.hitEnd = function() {
            //var self = this;
            //气球破裂
            heart.break(function(){
                //self.die();
            });
        }
        this.update = function(delta) {
            var p = map.toLocalPosition(this.position.x, this.position.y);
            //运行中，障碍物到屏幕时才需要显示
            if(game.state == 'play' && p.y >= -this.sprite.height) {
                this.start();
            }
            if(!this.sprite.visible) return;
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
            this.position.y += this.vy;
        }
        this.update(0);
    }

    var bling = (function() {
        var expTextures = [];//当前动画所有材质集合
        return function(x, y, vy) {
            var textures = pixiResources['bling'];
            if(!expTextures.length) {
                var keys = textures.data.animations['f'];
                keys.sort(function(k1,k2){
                    return k1.replace(/[^\d]/g,'') - k2.replace(/[^\d]/g,'');
                });
                for(var i=0;i<keys.length;i++) {
                    var txt = pixiTexture.fromFrame(keys[i]);
                    expTextures.push(txt);
                }
            }

            this.vy = vy||0;

            this.position = {
                x: x||0,
                y: y||0
            };


            this.sprite = new pixiContainer();
            this.sprite.visible = false;
            this.__bling = new pixiSprite(textures.textures['bling.png']);
            //this.__bling.width = this.width * 0.6;
            //this.__bling.height = this.height * 0.6;
            this.__bling.anchor.set(0.5);
            this.sprite.addChild(this.__bling);

            this.__side = new PIXI.extras.AnimatedSprite(expTextures);
            this.__side.animationSpeed = 0.15;
            //this.__side.width = this.width;
           // this.__side.height = this.height;
            this.__side.anchor.set(0.5);
            this.sprite.addChild(this.__side);

            var loveRes = pixiResources['love'].textures;
            this.__score = new pixiSprite(loveRes['score_10.png']);
            this.__score.anchor.set(0.5);
            this.__score.scale.x = 0.6;
            this.__score.scale.y = 0.6;
            this.sprite.addChild(this.__score);

            this.add = function(x,y){
                if(x) this.position.x = x;
                if(y) this.position.y = y;
                var center = {
                    x: this.sprite.width /2,
                    y: this.sprite.height/2
                };
                this.sprite.scale.x = map.scale;
                this.sprite.scale.y = map.scale;
                this.__bling.position.set(center.x, center.y);
                this.__side.position.set(center.x, center.y);
                this.__score.position.set(center.x, 10);

                //this.sprite.position.set(this.position.x, this.position.y);

                game.app.stage.addChild(this.sprite);
                this.__side.play();
                this.update(0);
            }

            this.update = function(delta) {
                var p = map.toLocalPosition(this.position.x, this.position.y);
                //运行中，障碍物到屏幕时才需要显示
                if(game.state == 'play' && p.y >= -this.sprite.height) {
                    this.sprite.visible = true;
                }
                if(!this.sprite.visible) return;
                this.sprite.x = p.x;
                this.sprite.y = p.y;
                //如果碰到当前精灵，则精灵死
                if(heart.hitTest(this)) {
                    this.hitEnd();
                }
                //出了屏外，则不需要再显示
                if(p.y > game.app.screen.height) {
                    this.die();
                    return;
                }
                this.__bling.rotation += 0.01;
                this.position.y += this.vy;
            }

            this.die = function() {
                this.state = 'dead';
                this.sprite.visible = false;
                map.removeBob(this);
            }

            this.hitEnd = function(){
                //加分
                heart.addScore(10);
                game.soundState!=2 && sucSound && sucSound.play();
                this.die();
            }
        };
    })();

    //加分动画，飞到右上角就消失
    function scoreSprite(score) {
        var loveRes = pixiResources['love'].textures;
        this.sprite = new pixiSprite(loveRes['score_10.png']);
        this.sprite.scale.x = map.scale;
        this.sprite.scale.y = map.scale;
        var halfWidht = this.sprite.width/2;
        this.y = heart.container.y;
        this.update = function(delta) {
            this.sprite.alpha -= 0.007;
            this.y -= 0.1;
            this.sprite.position.set(heart.container.x + heart.headCenter.x*map.scale + - halfWidht, this.y);
            if(this.sprite.alpha <= 0) this.die();
        }
        this.die = function() {
            game.app.stage.removeChild(this.sprite);
            for(var i=tempSprites.length-1;i>=0; i--) {
                if(tempSprites[i] && tempSprites[i] == this) {
                    tempSprites.splice(i, 1);
                    break;
                }
            }
        }

        this.update(0);
        game.app.stage.addChild(this.sprite);
    }

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

    //加载声音
    //这个不需要进来就加载，可以游戏初始化后再执行
    function loadSounds(callback) {
        var bgurl = "img/music/bg_2019130144035.mp3";
        var sucurl =  "img/music/s_201913014415.mp3";
        var failurl = "img/music/fail.mp3";

        if(sounds[sucurl] && sounds[failurl] && sounds[bgurl]) {
            callback && callback();
            return;
        }

        sounds.load([
            bgurl,
            sucurl,
            failurl
          ]);
          sounds.whenLoaded = function(e){
              sucSound = sounds[sucurl],
              failSound = sounds[failurl],
              bgSound = sounds[bgurl];
              bgSound.loop = true;
                //bgSound.volume = 0.9;
                if(game.state == 'play' && game.soundState!=2) bgSound.play();
            callback && callback();
          };
    }

    win.game = game;
    // 有 Sea.js 等 CMD 模块加载器存在
	if (typeof define === "function" && define.cmd) {
        define('/mb/action/love2019/js/game', function(require, exports, module) {
            module.exports = game;
        });
    }
})(window, document);
