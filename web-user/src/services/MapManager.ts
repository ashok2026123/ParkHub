import L from 'leaflet';

export interface MapBounds {
  south: number;
  west: number;
  north: number;
  east: number;
}

export class MapManager {
  private map: L.Map;
  private debounceTimer: NodeJS.Timeout | null = null;
  private onBoundsChange: (bounds: MapBounds) => void;

  constructor(mapInstance: L.Map, onBoundsChange: (bounds: MapBounds) => void) {
    this.map = mapInstance;
    this.onBoundsChange = onBoundsChange;
    this.initListeners();
  }

  private initListeners() {
    this.map.on('moveend', this.handleMapChange);
    this.map.on('zoomend', this.handleMapChange);
  }

  public destroy() {
    this.map.off('moveend', this.handleMapChange);
    this.map.off('zoomend', this.handleMapChange);
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
  }

  private handleMapChange = () => {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      const bounds = this.map.getBounds();
      const mapBounds: MapBounds = {
        south: bounds.getSouth(),
        west: bounds.getWest(),
        north: bounds.getNorth(),
        east: bounds.getEast()
      };
      this.onBoundsChange(mapBounds);
    }, 500); // 500ms debounce
  };

  public forceUpdate() {
    this.handleMapChange();
  }
}
