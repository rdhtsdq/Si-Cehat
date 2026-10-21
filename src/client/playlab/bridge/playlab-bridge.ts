import { GameToAppMessage } from "./types";

declare global {
  interface Window {
    PlayLabBridge?: {
      postMessage: (msg: string | object) => void;
    };
    PlayLab?: {
      postMessage: (msg: string | object) => void;
    };
    playLabBridge?: {
      postMessage: (msg: string | object) => void;
    };
    FlutterBridge?: {
      postMessage: (msg: string | object) => void;
    };
    Flutter?: {
      postMessage: (msg: string | object) => void;
    };
    flutterChannel?: {
      postMessage: (msg: string | object) => void;
    };
    flutter_inappwebview?: {
      callHandler: (handlerName: string, ...args: any[]) => Promise<any>;
    };
  }
}

function postToChannel(channel: any, jsonStr: string, rawObj: any): boolean {
  if (!channel || typeof channel.postMessage !== "function") return false;
  try {
    channel.postMessage(jsonStr);
    return true;
  } catch {
    try {
      channel.postMessage(rawObj);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Dispatch message to the native Flutter host WebView channel, inappwebview, or parent window.
 */
export function sendBridgeMessage(message: GameToAppMessage): void {
  const jsonString = JSON.stringify(message);
  let dispatched = false;

  try {
    // 1. Flutter Android/iOS webview_flutter JavascriptChannels
    const win = window as any;
    const channels = [
      win.PlayLabBridge,
      win.PlayLab,
      win.playLabBridge,
      win.FlutterBridge,
      win.flutterBridge,
      win.Flutter,
      win.flutterChannel,
      win.AppBridge,
    ];

    for (const ch of channels) {
      if (postToChannel(ch, jsonString, message)) {
        dispatched = true;
      }
    }

    // 2. Flutter inappwebview callHandler
    if (win.flutter_inappwebview && typeof win.flutter_inappwebview.callHandler === "function") {
      win.flutter_inappwebview.callHandler("PlayLabBridge", jsonString).catch(() => {});
      win.flutter_inappwebview.callHandler(message.type, jsonString).catch(() => {});
      dispatched = true;
    }

    // 3. Fallback for iframe parent window
    if (window.parent && window.parent !== window) {
      window.parent.postMessage(message, "*");
      window.parent.postMessage(jsonString, "*");
      dispatched = true;
    }

    // 4. Fallback dev console
    if (import.meta.env.DEV) {
      console.log(`[PlayLabBridge] Dispatched ${message.type} (native: ${dispatched})`, message);
    }
  } catch (err) {
    console.warn("[PlayLabBridge] Failed to dispatch bridge message:", err);
  }
}
