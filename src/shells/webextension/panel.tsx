/* global chrome */
import debugConnection from "../../utils/debugConnection";
import {InitFrontend} from "../../frontend";

let disconnectListener;

const inject = done=>{
	const code = `
      (function() {
        var inject = function() {
          // the prototype stuff is in case document.createElement has been modified
          var script = document.constructor.prototype.createElement.call(document, 'script');
          script.src = "${chrome.runtime.getURL("backend.js")}";
          document.documentElement.appendChild(script);
          script.parentNode.removeChild(script);
        }
        if (!document.documentElement) {
          document.addEventListener('DOMContentLoaded', inject);
        } else {
          inject();
        }
      }());
    `;
	chrome.devtools.inspectedWindow.eval(code, (res, err)=>{
		if (err) {
			if (__DEV__) console.log(err); // eslint-disable-line no-console
			return;
		}

		let disconnected = false;

		const port = chrome.runtime.connect({
			name: `${chrome.devtools.inspectedWindow.tabId}`,
		});

		port.onDisconnect.addListener(()=>{
			disconnected = true;
			if (disconnectListener) {
				disconnectListener();
			}
		});

		const wall = {
			listen(fn) {
				port.onMessage.addListener(message=>{
					debugConnection("[background -> FRONTEND]", message);
					fn(message);
				});
			},
			send(data) {
				if (disconnected) return;
				debugConnection("[FRONTEND -> background]", data);
				port.postMessage(data);
			},
		};

		done(wall, ()=>port.disconnect());
	});
};

InitFrontend({
	node: document.getElementById("container"),
	debugName: "Panel UI",
	inject,
	reloadSubscribe: reloadFn=>{
		chrome.devtools.network.onNavigated.addListener(reloadFn);
		return ()=>{
			chrome.devtools.network.onNavigated.removeListener(reloadFn);
		};
	},
});