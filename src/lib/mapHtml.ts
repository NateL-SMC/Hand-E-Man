// Leaflet + OpenStreetMap page used inside a WebView (native) or an iframe (web). No API keys needed.
// The host calls window.update({ destination, worker, route }) whenever something changes.
export const MAP_HTML = `<!DOCTYPE html>
<html><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"/>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css"/>
<style>html,body,#map{height:100%;margin:0;background:#E2E8F0}.leaflet-control-attribution{font-size:9px}</style>
</head><body><div id="map"></div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"></script>
<script>
var map = L.map('map', { zoomControl: false }).setView([8.228, 124.245], 13);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap' }).addTo(map);
function icon(glyph, bg) {
  return L.divIcon({
    className: '',
    html: '<div style="width:34px;height:34px;border-radius:17px;background:' + bg + ';display:flex;align-items:center;justify-content:center;font-size:18px;box-shadow:0 2px 6px rgba(0,0,0,.35)">' + glyph + '</div>',
    iconSize: [34, 34], iconAnchor: [17, 17]
  });
}
var dest = null, work = null, line = null, fitKey = '';
window.update = function (s) {
  if (s.destination) {
    var d = [s.destination.latitude, s.destination.longitude];
    if (!dest) dest = L.marker(d, { icon: icon('\\uD83D\\uDCCD', '#0F172A') }).addTo(map); else dest.setLatLng(d);
  }
  if (s.worker) {
    var w = [s.worker.latitude, s.worker.longitude];
    if (!work) work = L.marker(w, { icon: icon('\\uD83D\\uDE9A', '#FBBF24'), zIndexOffset: 500 }).addTo(map); else work.setLatLng(w);
  } else if (work) { map.removeLayer(work); work = null; }
  if (line) { map.removeLayer(line); line = null; }
  if (s.route && s.route.length > 1) {
    line = L.polyline(s.route.map(function (p) { return [p.latitude, p.longitude]; }), { color: '#3B82F6', weight: 5 }).addTo(map);
  }
  var key = (dest ? 1 : 0) + '-' + (work ? 1 : 0) + '-' + (line ? 1 : 0);
  if (key !== fitKey) {
    fitKey = key;
    var pts = [];
    if (dest) pts.push(dest.getLatLng());
    if (work) pts.push(work.getLatLng());
    if (pts.length > 1) map.fitBounds(L.latLngBounds(pts), { padding: [70, 70] });
    else if (pts.length === 1) map.setView(pts[0], 15);
  }
};
function onMsg(e) { try { window.update(JSON.parse(e.data)); } catch (_) {} }
window.addEventListener('message', onMsg);
document.addEventListener('message', onMsg);
</script></body></html>`;
