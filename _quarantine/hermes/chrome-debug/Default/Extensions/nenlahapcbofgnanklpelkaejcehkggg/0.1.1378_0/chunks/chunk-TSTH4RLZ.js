import{a as i,b as e,d as n,i as a,k as w}from"./chunk-IR4D5BOG.js";w();function r(t){return`
    /* Optimist Extra Light */
    @font-face {
      font-family: 'Optimist';
      src:
        url('${t("/assets/font/Optimist_W_XLt.woff2")}') format('woff2'),
        url('${t("/assets/font/Optimist_W_XLt.woff")}') format('woff');
      font-weight: 200;
      font-style: normal;
    }
    @font-face {
      font-family: 'Optimist';
      src:
        url('${t("/assets/font/Optimist_W_XLtIt.woff2")}') format('woff2'),
        url('${t("/assets/font/Optimist_W_XLtIt.woff")}') format('woff');
      font-weight: 200;
      font-style: normal;
    }

    /* Optimist Light */
    @font-face {
      font-family: 'Optimist';
      src:
        url('${t("/assets/font/Optimist_W_Lt.woff2")}') format('woff2'),
        url('${t("/assets/font/Optimist_W_Lt.woff")}') format('woff');
      font-weight: 200;
      font-style: normal;
    }
    @font-face {
      font-family: 'Optimist';
      src:
        url('${t("/assets/font/Optimist_W_LtIt.woff2")}') format('woff2'),
        url('${t("/assets/font/Optimist_W_LtIt.woff")}') format('woff');
      font-weight: 200;
      font-style: italic;
    }

    /* Optimist Regular */
    @font-face {
      font-family: 'Optimist';
      src:
        url('${t("/assets/font/Optimist_W_Rg.woff2")}') format('woff2'),
        url('${t("/assets/font/Optimist_W_Rg.woff")}') format('woff');
      font-weight: 400;
      font-style: normal;
    }
    @font-face {
      font-family: 'Optimist';
      src:
        url('${t("/assets/font/Optimist_W_It.woff2")}') format('woff2'),
        url('${t("/assets/font/Optimist_W_It.woff")}') format('woff');
      font-weight: 400;
      font-style: italic;
    }

    /* Optimist SemiBold */
    @font-face {
      font-family: 'Optimist';
      src:
        url('${t("/assets/font/Optimist_W_SBd.woff2")}') format('woff2'),
        url('${t("/assets/font/Optimist_W_SBd.woff")}') format('woff');
      font-weight: 600;
      font-style: normal;
    }
    @font-face {
      font-family: 'Optimist';
      src:
        url('${t("/assets/font/Optimist_W_SBdIt.woff2")}') format('woff2'),
        url('${t("/assets/font/Optimist_W_SBdIt.woff")}') format('woff');
      font-weight: 600;
      font-style: italic;
    }

    /* Optimist Bold */
    @font-face {
      font-family: 'Optimist';
      src:
        url('${t("/assets/font/Optimist_W_Bd.woff2")}') format('woff2'),
        url('${t("/assets/font/Optimist_W_Bd.woff")}') format('woff');
      font-weight: 700;
      font-style: normal;
    }
    @font-face {
      font-family: 'Optimist';
      src:
        url('${t("/assets/font/Optimist_W_BdIt.woff2")}') format('woff2'),
        url('${t("/assets/font/Optimist_W_BdIt.woff")}') format('woff');
      font-weight: 700;
      font-style: italic;
    }

    /* Wikibuy Icon Font */
    @font-face {
      font-family: 'wikibuy-iconfont';
      src:
        url('${t("/assets/font/wikibuy-iconfont.woff")}') format('woff'),
        url('${t("/assets/font/wikibuy-iconfont.svg")}') format('svg');
      font-weight: normal;
      font-style: normal;
    }
  `}var m=class{static{this._StyleTagElId="__wb_font_loader"}static _GetHeadElementAsync(f){if(f.head)return e(f.head);let s=new i,o=new MutationObserver(l=>{for(let c of l)if(c.type==="childList"&&!(typeof f.head>"u")){o.disconnect(),s.next(f.head);break}});return o.observe(f,{childList:!0,subtree:!0}),s.asObservable()}static _CheckPlatformWillRun(){let f=new i;return chrome.runtime.onMessage.addListener((s,o)=>{s.type==="initFontStyles"&&o.id===chrome.runtime.id&&f.next(!0)}),f.asObservable()}static StyleTagInjected(f){return!!f?.getElementById(this._StyleTagElId)}static InjectFontStylesUnlessDuplicate(f){let s=f.ownerDocument;if(this.StyleTagInjected(s))return;let o=f.ownerDocument.createElement("style");o.id=this._StyleTagElId,o.innerHTML=r(this._RuntimeUrlGetter),f.appendChild(o)}static Init(f,s){this._RuntimeUrlGetter=s,n([this._GetHeadElementAsync(f),this._CheckPlatformWillRun()]).pipe(a(1)).subscribe(([o])=>{this.InjectFontStylesUnlessDuplicate(o)})}};export{m as a};
