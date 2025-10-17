const photobox = {
    // canvas对象容器
    canvas: {},
    // canvas 2d上下文
    content: {},
    // 图片的总数
    img_total: 28,
    // 图片排列的总列数
    row_max: 7,
    // 图片排列的总行数
    line_max: 4,
    // 源图片的实际宽高，这里因为图片太大，会占据画布太多位置，故除以一个数让其缩小
    img_width: Math.floor(700 / 2),
    img_height: Math.floor(1000 / 2),
    // 图片间的上下左右间距
    img_margin: 200,
    // 所有图片纵横排列之后的总宽高，用作图片超出范围的界限判定
    total_width: 0,
    total_height: 0,
    // 图片数据，用以储存每张图片的源以及xy坐标位置
    img_data: [], // 初始化为空数组更严谨
    // 当前画布是否可以移动
    if_movable: false,

    // ---用于实现惯性滑动 ---
    velocityX: 0, // X轴速度
    velocityY: 0, // Y轴速度
    friction: 0.95, // 摩擦力，值越接近1，滑动距离越长
    isAnimating: false, // 是否正在播放惯性动画
    animationFrameId: null, // requestAnimationFrame的ID

    //--用于实现canvas响应式大小--
    canvas_standard_size: 1440,
    scale_num: 1,


    // 初始化
    init() {
        this.canvas = document.querySelector(".photobox");
        this.content = this.canvas.getContext("2d");
        this.total_width = this.row_max * (this.img_width + this.img_margin) - this.img_margin;
        this.total_height = this.line_max * (this.img_height + this.img_margin) - this.img_margin;
        this.resize();
        this.create_events();
        this.create_img_data();
    },
    resize() {
        this.canvas.width = this.canvas.clientWidth;
        this.canvas.height = this.canvas.clientHeight;
        if (this.img_data.length > 0) this.move_imgs(0, 0);


        let body_width = document.body.offsetWidth

        let line_width = document.querySelector(".photo_drag_line_right").offsetWidth

        this.scale_num = 1 - ((2 * line_width) / body_width)

    },
    // 创建图片数据即img_data
    create_img_data() {
        this.img_data = [];
        let loaded_count = 0;
        for (let i = 0; i < this.img_total; i++) {
            let img = new Image();
            const base_url = `https://mio-gallery.oss-cn-hangzhou.aliyuncs.com/mio-gallery-picture/${i}`;
            const oss_params = `?x-oss-process=image/resize,m_fill,w_350,h_500`;
            img.onload = () => {
                let col_index = i % this.row_max;
                let line_index = Math.floor(i / this.row_max);
                let x = col_index * (this.img_width + this.img_margin);
                let y = line_index * (this.img_height + this.img_margin);
                this.img_data[i] = {
                    img,
                    x,
                    y
                }; // 直接赋值，避免顺序错乱
                loaded_count++;
                // 确保所有图片加载完再统一绘制一次
                if (loaded_count === this.img_total) {
                    this.move_imgs(0, 0);
                }
            };
            img.onerror = () => {
                // 检查当前失败的链接是否是 .jpg 的
                if (img.src.includes('.jpg')) {
                    // 如果是 .jpg 失败了，则尝试加载 .png
                    img.src = `${base_url}.png${oss_params}`;
                } else {
                    // 如果 .png 也失败了 (或者一开始就是 .png 失败了)
                    console.error(`图片 ${i}.jpg/.png 均无法加载。`);

                    // 虽然图片未加载成功，但仍需计数，以确保 move_imgs 最终被调用
                    loaded_count++;
                    if (loaded_count === this.img_total) {
                        this.move_imgs(0, 0);
                    }
                }
            };

            img.src = `${base_url}.jpg${oss_params}`
        };
    },
    // 绑定所有监听事件
    create_events() {
        window.addEventListener("resize", () => {
            this.resize();
        });

        this.canvas.addEventListener("mousedown", (e) => {
            this.if_movable = true;
            this.canvas.style.cursor = 'grabbing'; // 改变拖动时的鼠标样式
            // 如果正在执行惯性动画，则停止它
            if (this.isAnimating) {
                this.isAnimating = false;
                cancelAnimationFrame(this.animationFrameId);
            }
            // 重置速度
            this.velocityX = 0;
            this.velocityY = 0;

            //删除photo_drag_line_hidden类
            let drag_line = document.querySelector(".photo_drag_line")
            drag_line.classList.remove("photo_drag_line_hidden")
            //缩小canvas大小
            this.canvas.style.transform = `scale(${this.scale_num})`

        });

        this.canvas.addEventListener("mouseup", (e) => {
            if (!this.if_movable) return;
            this.if_movable = false;
            this.canvas.style.cursor = 'grab';
            // 开始惯性动画
            this.start_inertia();
            // this.check_img(e.x, e.y); // 你可以根据需要决定是否保留点击检查

            //添加photo_drag_line_hidden类

            let drag_line = document.querySelector(".photo_drag_line")
            drag_line.classList.add("photo_drag_line_hidden")

            //解开canvas大小
            this.canvas.style.transform = `scale(1)`

        });

        this.canvas.addEventListener("mouseleave", () => {
            if (!this.if_movable) return;
            this.if_movable = false;
            this.canvas.style.cursor = 'grab';
            // 开始惯性动画
            this.start_inertia();
        });

        this.canvas.addEventListener("mousemove", (e) => {
            if (!this.if_movable) return;
            this.move_imgs(e.movementX, e.movementY);
            // 实时记录最后的速度
            this.velocityX = e.movementX;
            this.velocityY = e.movementY;
        });
    },
    // 获取当前鼠标点击位置下的对应图片数据
    check_img(x, y) {
        let img = this.img_data.find(img =>
            x >= img.x && x < img.x + this.img_width &&
            y >= img.y && y < img.y + this.img_height
        );
        if (img) {
            console.log("Clicked image:", img.img.src); // 点击时在控制台输出图片信息
            return img.img;
        }
    },
    // --- 开始惯性动画 ---
    start_inertia() {
        // 只有在速度不为0时才开始动画
        if (Math.abs(this.velocityX) > 0.1 || Math.abs(this.velocityY) > 0.1) {
            this.isAnimating = true;
            this.animate_inertia();
        }
    },
    // --- 惯性动画循环 ---
    animate_inertia() {
        if (!this.isAnimating) return;

        // 移动图片
        this.move_imgs(this.velocityX, this.velocityY);

        // 速度乘以摩擦力，实现减速
        this.velocityX *= this.friction;
        this.velocityY *= this.friction;

        // 如果速度足够小，则停止动画
        if (Math.abs(this.velocityX) < 0.1 && Math.abs(this.velocityY) < 0.1) {
            this.isAnimating = false;
            return;
        }

        // 继续下一帧动画
        this.animationFrameId = requestAnimationFrame(this.animate_inertia.bind(this));
    },
    // 移动所有图片
    move_imgs(x, y) {
        this.content.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.img_data.forEach((img) => {
            img.x += x;
            img.y += y;

            // 水平方向的无限循环逻辑
            if (img.x > this.total_width - this.img_width) {
                img.x -= this.total_width + this.img_margin;
            }
            if (img.x < -this.img_width) {
                img.x += this.total_width + this.img_margin;
            }

            // 垂直方向的无限循环逻辑
            if (img.y > this.total_height - this.img_height) {
                img.y -= this.total_height + this.img_margin;
            }
            if (img.y < -this.img_height) {
                img.y += this.total_height + this.img_margin;
            }

            // 绘制图片
            this.content.drawImage(img.img, img.x, img.y, this.img_width, this.img_height);
        });
    },
};
// 初始化
photobox.init();