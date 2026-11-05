// Web: same Leaflet page inside an <iframe>.
import { createElement, useEffect, useRef } from "react";
import { View } from "react-native";
import { MAP_HTML } from "../lib/mapHtml";
import type { LiveMapProps } from "./LiveMap.types";

export default function LiveMap({ destination, worker, route }: LiveMapProps) {
  const frame = useRef<any>(null);
  const state = JSON.stringify({ destination: destination ?? null, worker: worker ?? null, route: route ?? null });
  const post = () => frame.current?.contentWindow?.postMessage(state, "*");

  useEffect(post, [state]);

  return (
    <View style={{ flex: 1 }}>
      {createElement("iframe", { ref: frame, srcDoc: MAP_HTML, onLoad: post, style: { border: 0, width: "100%", height: "100%" } })}
    </View>
  );
}
