// Native (iOS/Android): Leaflet inside a WebView.  Web uses LiveMap.web.tsx automatically.
import { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import { WebView } from "react-native-webview";
import { MAP_HTML } from "../lib/mapHtml";
import type { LiveMapProps } from "./LiveMap.types";

export default function LiveMap({ destination, worker, route }: LiveMapProps) {
  const ref = useRef<WebView>(null);
  const [ready, setReady] = useState(false);
  const state = JSON.stringify({ destination: destination ?? null, worker: worker ?? null, route: route ?? null });

  useEffect(() => {
    if (ready) ref.current?.injectJavaScript(`window.update(${state}); true;`);
  }, [ready, state]);

  return (
    <View style={{ flex: 1 }}>
      <WebView
        ref={ref}
        originWhitelist={["*"]}
        source={{ html: MAP_HTML }}
        javaScriptEnabled
        onLoadEnd={() => setReady(true)}
        style={{ flex: 1, backgroundColor: "#E2E8F0" }}
      />
    </View>
  );
}
