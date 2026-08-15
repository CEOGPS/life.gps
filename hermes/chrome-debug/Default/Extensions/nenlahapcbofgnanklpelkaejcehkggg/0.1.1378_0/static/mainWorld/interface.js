import"../../chunks/chunk-DXB73IDG.js";function d(i){let o="__sp_mainWorld_listener";if(typeof window[o]<"u")return;let r=e=>{let n=document.createElement("script"),t=document.createTextNode(e);n.appendChild(t),(document.body||document.head).appendChild(n)},s=(e,n)=>{e&&r(`
      var result;
      try {
        result = window.${e};
      } catch {
        result = null
      }

      window.postMessage(
        {
          type: 'sp-main-world-response',
          responseId: "${n}",
          response: result,
        },
        window.location.origin
      );

      document.currentScript?.remove();
  `)},a=(e,n,t)=>{e&&r(`
      window['${e}'] = ${JSON.stringify(n)};
      window.postMessage(
        {
          type: 'sp-main-world-response',
          responseId: "${t}",
          response: undefined,
        },
        window.location.origin
      );
      document.currentScript?.remove();`)};window[o]=e=>{let n=e.data;if(!n||n.type!=="sp-main-world-request"||e.origin!==window.location.origin||!/^[0-9a-zA-Z\-]+$/.test(e.data.responseId)||n.signature!==i)return;let t=n.data;switch(t?.action){case"getWindowVariableSafely":s(t.variable,e.data.responseId);break;case"setWindowVariableSafely":a(t.variable,t.value,e.data.responseId);break}},window.addEventListener("message",window[o])}export{d as default};
