(async function(){let{injectNotificationScript:i}=await import(chrome.runtime.getURL("/notifications/injectors/injectNotificationScript.js"));i("pageView")})();
