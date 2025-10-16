//获取body中的template的模版dom
const template = document.getElementById('arrow-template-rl')
const templateContent=template.content
//需要把这个模版dom放在photo-drag-line-top/right/left/bottom四个方位

const photo_drag_line_top=document.querySelector(".photo_drag_line_top");
const photo_drag_line_right=document.querySelector(".photo_drag_line_right");
const photo_drag_line_left=document.querySelector(".photo_drag_line_left");
const photo_drag_line_bottom=document.querySelector(".photo_drag_line_bottom");
const drag_line_map = {
  'TOP': photo_drag_line_top,
  'RIGHT': photo_drag_line_right,
  'LEFT': photo_drag_line_left,
  'BOTTOM': photo_drag_line_bottom
};
console.log(drag_line_map)
//计算top/bottom一行/一列drag_line需要多少个这样的dom元素

/* const template_width_count= Math.ceil(document.body.clientWidth/photo_drag_line_top.clientWidth) */
const template_width_count= Math.ceil(document.body.clientWidth/110)+1
const template_height_count= Math.ceil(document.body.clientHeight/110)+1

for (const direction in drag_line_map) {
    if (Object.prototype.hasOwnProperty.call(drag_line_map, direction)) {
        
        const drag_line_dom = drag_line_map[direction];
        if (!drag_line_dom) continue;

        // 根据方向确定需要循环的次数
        let count = 0;
        if (direction === 'TOP' || direction === 'BOTTOM') {
            count = template_width_count;
        } else {
            count = template_height_count;
        }
        
        // 统一的循环添加逻辑
        for (let i = 0; i < count; i++) {
            const clone = templateContent.cloneNode(true);
            drag_line_dom.appendChild(clone);
        }
    }
}
