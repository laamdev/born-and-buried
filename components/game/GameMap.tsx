"use client";

import { useEffect, useRef } from "react";
import Map, {
  Marker,
  NavigationControl,
  type MapRef,
} from "react-map-gl/maplibre";
import { PinLabel } from "./PinLabel";

// Free, no-API-key vector tiles.
const MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";

export type MapPoint = {
  lat: number;
  lng: number;
  year: number;
  placeLabel: string;
  circa?: boolean;
};

export default function GameMap({
  birth,
  death,
}: {
  birth: MapPoint;
  death: MapPoint;
}) {
  const mapRef = useRef<MapRef | null>(null);

  // Frame both pins whenever the round changes.
  const fit = () => {
    const map = mapRef.current;
    if (!map) return;
    const samePlace =
      Math.abs(birth.lat - death.lat) < 0.05 &&
      Math.abs(birth.lng - death.lng) < 0.05;
    if (samePlace) {
      map.easeTo({ center: [birth.lng, birth.lat], zoom: 4, duration: 600 });
      return;
    }
    map.fitBounds(
      [
        [Math.min(birth.lng, death.lng), Math.min(birth.lat, death.lat)],
        [Math.max(birth.lng, death.lng), Math.max(birth.lat, death.lat)],
      ],
      { padding: 90, maxZoom: 6, duration: 600 },
    );
  };

  useEffect(() => {
    fit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [birth.lat, birth.lng, death.lat, death.lng]);

  return (
    <Map
      ref={mapRef}
      onLoad={fit}
      mapStyle={MAP_STYLE}
      initialViewState={{ longitude: 0, latitude: 25, zoom: 1.2 }}
      attributionControl={{ compact: true }}
      style={{ width: "100%", height: "100%" }}
      dragRotate={false}
      touchZoomRotate={false}
    >
      <NavigationControl position="top-right" showCompass={false} />

      <Marker longitude={birth.lng} latitude={birth.lat} anchor="bottom">
        <PinLabel kind="birth" year={birth.year} circa={birth.circa} />
      </Marker>
      <Marker longitude={death.lng} latitude={death.lat} anchor="bottom">
        <PinLabel kind="death" year={death.year} circa={death.circa} />
      </Marker>
    </Map>
  );
}
