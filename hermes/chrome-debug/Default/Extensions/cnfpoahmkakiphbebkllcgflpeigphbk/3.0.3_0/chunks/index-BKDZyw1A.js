import{d as x,ab as d,r as A,a5 as V,D as l,t as R,Y as X,ac as $}from"./sidepanel-DRMP5oPj.js";const S={"<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;","&":"&amp;"};let C=0;var k=n=>n.replace(/[<>"&]/g,(o=>S[o]||o)),N=n=>n+C++;const p={},B=n=>{const{name:o,paths:h=[],d:i,polygons:e=[],points:s}=n;i&&h.push({d:i}),s&&e.push({points:s}),p[o]=Object.assign({},n,{paths:h,polygons:e}),p[o].minX||(p[o].minX=0),p[o].minY||(p[o].minY=0)},j=(...n)=>{for(const o of n)B(o)},q=x({name:"OhVueIcon",props:{name:{type:String,validator:n=>!n||n in p||(console.warn(`Invalid prop: prop "name" is referring to an unregistered icon "${n}".
Please make sure you have imported this icon before using it.`),!1)},title:String,fill:String,scale:{type:[Number,String],default:1},animation:{validator:n=>["spin","spin-pulse","wrench","ring","pulse","flash","float"].includes(n)},hover:Boolean,flip:{validator:n=>["horizontal","vertical","both"].includes(n)},speed:{validator:n=>n==="fast"||n==="slow"},label:String,inverse:Boolean},setup(n){const o=A([]),h=V({outerScale:1.2,x:null,y:null}),i=V({width:0,height:0}),e=l((()=>{const a=Number(n.scale);return isNaN(a)||a<=0?(console.warn('Invalid prop: prop "scale" should be a number over 0.'),h.outerScale):a*h.outerScale})),s=l((()=>({"ov-icon":!0,"ov-inverse":n.inverse,"ov-flip-horizontal":n.flip==="horizontal","ov-flip-vertical":n.flip==="vertical","ov-flip-both":n.flip==="both","ov-spin":n.animation==="spin","ov-spin-pulse":n.animation==="spin-pulse","ov-wrench":n.animation==="wrench","ov-ring":n.animation==="ring","ov-pulse":n.animation==="pulse","ov-flash":n.animation==="flash","ov-float":n.animation==="float","ov-hover":n.hover,"ov-fast":n.speed==="fast","ov-slow":n.speed==="slow"}))),t=l((()=>n.name?p[n.name]:null)),y=l((()=>t.value?`${t.value.minX} ${t.value.minY} ${t.value.width} ${t.value.height}`:`0 0 ${w.value} ${g.value}`)),u=l((()=>{if(!t.value)return 1;const{width:a,height:v}=t.value;return Math.max(a,v)/16})),w=l((()=>i.width||t.value&&t.value.width/u.value*e.value||0)),g=l((()=>i.height||t.value&&t.value.height/u.value*e.value||0)),L=l((()=>e.value!==1&&{fontSize:e.value+"em"})),b=l((()=>{if(!t.value||!t.value.raw)return null;const a={};let v=t.value.raw;return v=v.replace(/\s(?:xml:)?id=(["']?)([^"')\s]+)\1/g,((r,H,M)=>{const f=N("vat-");return a[M]=f,` id="${f}"`})),v=v.replace(/#(?:([^'")\s]+)|xpointer\(id\((['"]?)([^')]+)\2\)\))/g,((r,H,M,f)=>{const m=H||f;return m&&a[m]?`#${a[m]}`:r})),v})),Y=l((()=>t.value&&t.value.attr?t.value.attr:{})),z=()=>{if(!n.name&&n.name!==null&&o.value.length===0)return void console.warn('Invalid prop: prop "name" is required.');if(t.value)return;let a=0,v=0;o.value.forEach((r=>{r.outerScale=e.value,a=Math.max(a,r.width),v=Math.max(v,r.height)})),i.width=a,i.height=v,o.value.forEach((r=>{r.x=(a-r.width)/2,r.y=(v-r.height)/2}))};return X((()=>{z()})),$((()=>{z()})),{...R(h),children:o,icon:t,klass:s,style:L,width:w,height:g,box:y,attribs:Y,raw:b}},created(){const n=this.$parent;n&&n.children&&n.children.push(this)},render(){const n=Object.assign({role:this.$attrs.role||(this.label||this.title?"img":null),"aria-label":this.label||null,"aria-hidden":!(this.label||this.title),width:this.width,height:this.height,viewBox:this.box},this.attribs);this.attribs.stroke?n.stroke=this.fill?this.fill:"currentColor":n.fill=this.fill?this.fill:"currentColor",this.x&&(n.x=this.x.toString()),this.y&&(n.y=this.y.toString());let o={class:this.klass,style:this.style};if(o=Object.assign(o,n),this.raw){const e=this.title?`<title>${k(this.title)}</title>${this.raw}`:this.raw;o.innerHTML=e}const h=this.title?[d("title",this.title)]:[],i=(e,s,t)=>d(e,{...s,key:`${e}-${t}`});return d("svg",o,this.raw?void 0:h.concat([this.$slots.default?this.$slots.default():this.icon?[...this.icon.paths.map(((e,s)=>i("path",e,s))),...this.icon.polygons.map(((e,s)=>i("polygon",e,s)))]:[]]))}});function c(n,o){o===void 0&&(o={});var h=o.insertAt;if(n&&typeof document<"u"){var i=document.head||document.getElementsByTagName("head")[0],e=document.createElement("style");e.type="text/css",h==="top"&&i.firstChild?i.insertBefore(e,i.firstChild):i.appendChild(e),e.styleSheet?e.styleSheet.cssText=n:e.appendChild(document.createTextNode(n))}}c(`.ov-icon {
  display: inline-block;
  overflow: visible;
  vertical-align: -0.2em;
}
`);c(`/* ---------------- spin ---------------- */
.ov-spin:not(.ov-hover),
.ov-spin.ov-hover:hover,
.ov-parent.ov-hover:hover > .ov-spin {
  animation: ov-spin 1s linear infinite;
}

.ov-spin:not(.ov-hover).ov-fast,
.ov-spin.ov-hover.ov-fast:hover,
.ov-parent.ov-hover:hover > .ov-spin.ov-fast {
  animation: ov-spin 0.7s linear infinite;
}

.ov-spin:not(.ov-hover).ov-slow,
.ov-spin.ov-hover.ov-slow:hover,
.ov-parent.ov-hover:hover > .ov-spin.ov-slow {
  animation: ov-spin 2s linear infinite;
}

/* ---------------- spin-pulse ---------------- */

.ov-spin-pulse:not(.ov-hover),
.ov-spin-pulse.ov-hover:hover,
.ov-parent.ov-hover:hover > .ov-spin-pulse {
  animation: ov-spin 1s infinite steps(8);
}

.ov-spin-pulse:not(.ov-hover).ov-fast,
.ov-spin-pulse.ov-hover.ov-fast:hover,
.ov-parent.ov-hover:hover > .ov-spin-pulse.ov-fast {
  animation: ov-spin 0.7s infinite steps(8);
}

.ov-spin-pulse:not(.ov-hover).ov-slow,
.ov-spin-pulse.ov-hover.ov-slow:hover,
.ov-parent.ov-hover:hover > .ov-spin-pulse.ov-slow {
  animation: ov-spin 2s infinite steps(8);
}

@keyframes ov-spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* ---------------- wrench ---------------- */
.ov-wrench:not(.ov-hover),
.ov-wrench.ov-hover:hover,
.ov-parent.ov-hover:hover > .ov-wrench {
  animation: ov-wrench 2.5s ease infinite;
}

.ov-wrench:not(.ov-hover).ov-fast,
.ov-wrench.ov-hover.ov-fast:hover,
.ov-parent.ov-hover:hover > .ov-wrench.ov-fast {
  animation: ov-wrench 1.2s ease infinite;
}

.ov-wrench:not(.ov-hover).ov-slow,
.ov-wrench.ov-hover.ov-slow:hover,
.ov-parent.ov-hover:hover > .ov-wrench.ov-slow {
  animation: ov-wrench 3.7s ease infinite;
}

@keyframes ov-wrench {
  0% {
    transform: rotate(-12deg);
  }

  8% {
    transform: rotate(12deg);
  }

  10%, 28%, 30%, 48%, 50%, 68% {
    transform: rotate(24deg);
  }

  18%, 20%, 38%, 40%, 58%, 60% {
    transform: rotate(-24deg);
  }

  75%, 100% {
    transform: rotate(0deg);
  }
}

/* ---------------- ring ---------------- */
.ov-ring:not(.ov-hover),
.ov-ring.ov-hover:hover,
.ov-parent.ov-hover:hover > .ov-ring {
  animation: ov-ring 2s ease infinite;
}

.ov-ring:not(.ov-hover).ov-fast,
.ov-ring.ov-hover.ov-fast:hover,
.ov-parent.ov-hover:hover > .ov-ring.ov-fast {
  animation: ov-ring 1s ease infinite;
}

.ov-ring:not(.ov-hover).ov-slow,
.ov-ring.ov-hover.ov-slow:hover,
.ov-parent.ov-hover:hover > .ov-ring.ov-slow {
  animation: ov-ring 3s ease infinite;
}

@keyframes ov-ring {
  0% {
    transform: rotate(-15deg);
  }

  2% {
    transform: rotate(15deg);
  }

  4%, 12% {
    transform: rotate(-18deg);
  }

  6% {
    transform: rotate(18deg);
  }

  8% {
    transform: rotate(-22deg);
  }

  10% {
    transform: rotate(22deg);
  }

  12% {
    transform: rotate(-18deg);
  }

  14% {
    transform: rotate(18deg);
  }

  16% {
    transform: rotate(-12deg);
  }

  18% {
    transform: rotate(12deg);
  }

  20%, 100% {
    transform: rotate(0deg);
  }
}

/* ---------------- pulse ---------------- */
.ov-pulse:not(.ov-hover),
.ov-pulse.ov-hover:hover,
.ov-parent.ov-hover:hover > .ov-pulse {
  animation: ov-pulse 2s linear infinite;
}

.ov-pulse:not(.ov-hover).ov-fast,
.ov-pulse.ov-hover.ov-fast:hover,
.ov-parent.ov-hover:hover > .ov-pulse.ov-fast {
  animation: ov-pulse 1s linear infinite;
}

.ov-pulse:not(.ov-hover).ov-slow,
.ov-pulse.ov-hover.ov-slow:hover,
.ov-parent.ov-hover:hover > .ov-pulse.ov-slow {
  animation: ov-pulse 3s linear infinite;
}

@keyframes ov-pulse {
  0% {
    transform: scale(1.1);
  }

  50% {
    transform: scale(0.8);
  }

  100% {
    transform: scale(1.1);
  }
}

/* ---------------- flash ---------------- */
.ov-flash:not(.ov-hover),
.ov-flash.ov-hover:hover,
.ov-parent.ov-hover:hover > .ov-flash {
  animation: ov-flash 2s ease infinite;
}

.ov-flash:not(.ov-hover).ov-fast,
.ov-flash.ov-hover.ov-fast:hover,
.ov-parent.ov-hover:hover > .ov-flash.ov-fast {
  animation: ov-flash 1s ease infinite;
}

.ov-flash:not(.ov-hover).ov-slow,
.ov-flash.ov-hover.ov-slow:hover,
.ov-parent.ov-hover:hover > .ov-flash.ov-slow {
  animation: ov-flash 3s ease infinite;
}

@keyframes ov-flash {
  0%, 100%, 50%{
    opacity: 1;
  }
  25%, 75%{
    opacity: 0;
  }
}

/* ---------------- float ---------------- */
.ov-float:not(.ov-hover),
.ov-float.ov-hover:hover,
.ov-parent.ov-hover:hover > .ov-float {
  animation: ov-float 2s linear infinite;
}

.ov-float:not(.ov-hover).ov-fast,
.ov-float.ov-hover.ov-fast:hover,
.ov-parent.ov-hover:hover > .ov-float.ov-fast {
  animation: ov-float 1s linear infinite;
}

.ov-float:not(.ov-hover).ov-slow,
.ov-float.ov-hover.ov-slow:hover,
.ov-parent.ov-hover:hover > .ov-float.ov-slow {
  animation: ov-float 3s linear infinite;
}

@keyframes ov-float {
  0%, 100% {
    transform: translateY(-3px);
  }
  50% {
    transform: translateY(3px);
  }
}
`);c(`.ov-flip-horizontal {
  transform: scale(-1, 1);
}

.ov-flip-vertical {
  transform: scale(1, -1);
}

.ov-flip-both {
  transform: scale(-1, -1);
}

.ov-inverse {
  color: #fff;
}
`);const E={name:"ri-add-line",minX:0,minY:0,width:24,height:24,raw:'<path fill="none" d="M0 0h24v24H0z"/><path d="M11 11V5h2v6h6v2h-6v6h-2v-6H5v-2z"/>'},I={name:"ri-alert-fill",minX:0,minY:0,width:24,height:24,raw:'<path fill="none" d="M0 0h24v24H0z"/><path d="M12.866 3l9.526 16.5a1 1 0 01-.866 1.5H2.474a1 1 0 01-.866-1.5L11.134 3a1 1 0 011.732 0zM11 16v2h2v-2h-2zm0-7v5h2V9h-2z"/>'},O={name:"ri-arrow-right-s-line",minX:0,minY:0,width:24,height:24,raw:'<path fill="none" d="M0 0h24v24H0z"/><path d="M13.172 12l-4.95-4.95 1.414-1.414L16 12l-6.364 6.364-1.414-1.414z"/>'},T={name:"ri-bar-chart-line",minX:0,minY:0,width:24,height:24,raw:'<path fill="none" d="M0 0h24v24H0z"/><path d="M3 12h2v9H3v-9zm16-4h2v13h-2V8zm-8-6h2v19h-2V2z"/>'},G={name:"ri-calendar-line",minX:0,minY:0,width:24,height:24,raw:'<path fill="none" d="M0 0h24v24H0z"/><path d="M17 3h4a1 1 0 011 1v16a1 1 0 01-1 1H3a1 1 0 01-1-1V4a1 1 0 011-1h4V1h2v2h6V1h2v2zm-2 2H9v2H7V5H4v4h16V5h-3v2h-2V5zm5 6H4v8h16v-8z"/>'},U={name:"ri-chat-4-line",minX:0,minY:0,width:24,height:24,raw:'<path fill="none" d="M0 0h24v24H0z"/><path d="M5.763 17H20V5H4v13.385L5.763 17zm.692 2L2 22.5V4a1 1 0 011-1h18a1 1 0 011 1v14a1 1 0 01-1 1H6.455z"/>'},D={name:"ri-chat-new-line",minX:0,minY:0,width:24,height:24,raw:'<path fill="none" d="M0 0h24v24H0z"/><path d="M14 3v2H4v13.385L5.763 17H20v-7h2v8a1 1 0 01-1 1H6.455L2 22.5V4a1 1 0 011-1h11zm5 0V0h2v3h3v2h-3v3h-2V5h-3V3h3z"/>'},P={name:"ri-file-chart-line",minX:0,minY:0,width:24,height:24,raw:'<path fill="none" d="M0 0h24v24H0z"/><path d="M11 7h2v10h-2V7zm4 4h2v6h-2v-6zm-8 2h2v4H7v-4zm8-9H5v16h14V8h-4V4zM3 2.992C3 2.444 3.447 2 3.999 2H16l5 5v13.993A1 1 0 0120.007 22H3.993A1 1 0 013 21.008V2.992z"/>'},Q={name:"ri-file-copy-line",minX:0,minY:0,width:24,height:24,raw:'<path fill="none" d="M0 0h24v24H0z"/><path d="M7 6V3a1 1 0 011-1h12a1 1 0 011 1v14a1 1 0 01-1 1h-3v3c0 .552-.45 1-1.007 1H4.007A1.001 1.001 0 013 21l.003-14c0-.552.45-1 1.007-1H7zM5.003 8L5 20h10V8H5.003zM9 6h8v10h2V4H9v2z"/>'},J={name:"ri-gift-line",minX:0,minY:0,width:24,height:24,raw:'<path fill="none" d="M0 0h24v24H0z"/><path d="M15 2a4 4 0 013.464 6.001L23 8v2h-2v10a1 1 0 01-1 1H4a1 1 0 01-1-1V10H1V8l4.536.001A4 4 0 0112 3.355 3.983 3.983 0 0115 2zm-4 8H5v9h6v-9zm8 0h-6v9h6v-9zM9 4a2 2 0 00-.15 3.995L9 8h2V6a2 2 0 00-1.697-1.977l-.154-.018L9 4zm6 0a2 2 0 00-1.995 1.85L13 6v2h2a2 2 0 001.995-1.85L17 6a2 2 0 00-2-2z"/>'},K={name:"ri-global-line",minX:0,minY:0,width:24,height:24,raw:'<path fill="none" d="M0 0h24v24H0z"/><path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-2.29-2.333A17.9 17.9 0 018.027 13H4.062a8.008 8.008 0 005.648 6.667zM10.03 13c.151 2.439.848 4.73 1.97 6.752A15.905 15.905 0 0013.97 13h-3.94zm9.908 0h-3.965a17.9 17.9 0 01-1.683 6.667A8.008 8.008 0 0019.938 13zM4.062 11h3.965A17.9 17.9 0 019.71 4.333 8.008 8.008 0 004.062 11zm5.969 0h3.938A15.905 15.905 0 0012 4.248 15.905 15.905 0 0010.03 11zm4.259-6.667A17.9 17.9 0 0115.973 11h3.965a8.008 8.008 0 00-5.648-6.667z"/>'},W={name:"ri-mail-line",minX:0,minY:0,width:24,height:24,raw:'<path fill="none" d="M0 0h24v24H0z"/><path d="M3 3h18a1 1 0 011 1v16a1 1 0 01-1 1H3a1 1 0 01-1-1V4a1 1 0 011-1zm17 4.238l-7.928 7.1L4 7.216V19h16V7.238zM4.511 5l7.55 6.662L19.502 5H4.511z"/>'},Z={name:"ri-newspaper-line",minX:0,minY:0,width:24,height:24,raw:'<path fill="none" d="M0 0h24v24H0z"/><path d="M16 20V4H4v15a1 1 0 001 1h11zm3 2H5a3 3 0 01-3-3V3a1 1 0 011-1h14a1 1 0 011 1v7h4v9a3 3 0 01-3 3zm-1-10v7a1 1 0 002 0v-7h-2zM6 6h6v6H6V6zm2 2v2h2V8H8zm-2 5h8v2H6v-2zm0 3h8v2H6v-2z"/>'},_={name:"ri-question-fill",minX:0,minY:0,width:24,height:24,raw:'<path fill="none" d="M0 0h24v24H0z"/><path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1-7v2h2v-2h-2zm2-1.645A3.502 3.502 0 0012 6.5a3.501 3.501 0 00-3.433 2.813l1.962.393A1.5 1.5 0 1112 11.5a1 1 0 00-1 1V14h2v-.645z"/>'},nn={name:"ri-share-forward-line",minX:0,minY:0,width:24,height:24,raw:'<path fill="none" d="M0 0h24v24H0z"/><path d="M13 14h-2a8.999 8.999 0 00-7.968 4.81A10.136 10.136 0 013 18C3 12.477 7.477 8 13 8V2.5L23.5 11 13 19.5V14zm-2-2h4v3.308L20.321 11 15 6.692V10h-2a7.982 7.982 0 00-6.057 2.773A10.988 10.988 0 0111 12z"/>'},on={name:"ri-user-add-line",minX:0,minY:0,width:24,height:24,raw:'<path fill="none" d="M0 0h24v24H0z"/><path d="M14 14.252v2.09A6 6 0 006 22l-2-.001a8 8 0 0110-7.748zM12 13c-3.315 0-6-2.685-6-6s2.685-6 6-6 6 2.685 6 6-2.685 6-6 6zm0-2c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm6 6v-3h2v3h3v2h-3v3h-2v-3h-3v-2h3z"/>'};export{U as R,K as a,D as b,j as c,I as d,P as e,E as f,q as g,O as h,Q as i,W as j,_ as k,nn as l,J as m,on as n,T as o,Z as p,G as q};
