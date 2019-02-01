import {
  Component,
  OnInit,
  NgZone,
  AfterViewInit,
  AfterViewChecked,
  Input
} from "@angular/core";
import * as am4core from "@amcharts/amcharts4/core";
import * as am4maps from "@amcharts/amcharts4/maps";

import am4themes_animated from "@amcharts/amcharts4/themes/animated";

// Importing translations
import am4lang_lt_LT from "@amcharts/amcharts4/lang/lt_LT";

// Importing geodata (map data)
import am4geodata_worldLow from "@amcharts/amcharts4-geodata/worldLow";
import am4geodata_continentsLow from "@amcharts/amcharts4-geodata/continentsLow";

import { regions } from "./src/regions";
import { countries } from "./src/countries";

@Component({
  selector: "app-maps",
  templateUrl: "./maps.component.html",
  styleUrls: ["./maps.component.css"]
})
export class MapsComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() mapConfig;
  constructor(private zone: NgZone) {}

  ngOnInit() {
    console.log(this.mapConfig);
  }

  toggleMapView(param) {
    const mapParams = {
      mapView: param ? am4geodata_worldLow : am4geodata_continentsLow,
      exclude: param ? ["AQ"] : ["antarctica"],
      tooltipConfig: param ? countries : regions
    };
    this.createMap(mapParams);
  }

  defineZoomButtonProperties(button: am4core.Button) {
    button.label.fontSize = 18;
    button.label.fontWeight = "600";
    button.label.fill = am4core.color("#2cb19c");
    button.strokeWidth = 0;
    button.background.fill = am4core.color("#124062");
    button.cursorOverStyle = am4core.MouseCursorStyle.pointer;

    button.events.on("over", e => {
      // console.log(e.target);
      e.target.background.fill = am4core.color("#124062");
      e.target.label.fill = am4core.color("#2cb19c");
    });
    return button;
  }

  ngAfterViewInit() {
    this.createMap({
      mapView: am4geodata_worldLow,
      exclude: ["AQ"],
      tooltipConfig: countries
    });
  }

  private createMap({ mapView, exclude, tooltipConfig }) {
    console.log(
      "mapView, exclude, tooltipConfig: ",
      mapView,
      exclude,
      tooltipConfig
    );

    const chart = am4core.create("chartdiv", am4maps.MapChart);

    chart.events.on("ready", ev => {
      tooltipConfig.forEach(item => {
        const country = polygonSeries.getPolygonById(item.id);
        if (country) {
          country.isActive = true;
        }
      });
    });

    // Set map definition
    chart.geodata = mapView;

    // Set projection
    chart.projection = new am4maps.projections.Miller();

    // Create map polygon series
    const polygonSeries = chart.series.push(new am4maps.MapPolygonSeries());

    // Exclude Antartica
    polygonSeries.exclude = exclude;

    // Add zoom control
    const zoomConfig = new am4maps.ZoomControl();
    zoomConfig.marginRight = am4core.percent(2);
    zoomConfig.marginTop = 50;
    zoomConfig.valign = "top";
    zoomConfig.plusButton = this.defineZoomButtonProperties(
      zoomConfig.plusButton
    );
    zoomConfig.minusButton = this.defineZoomButtonProperties(
      zoomConfig.minusButton
    );

    chart.zoomControl = zoomConfig;
    chart.zoomStep = 1.5;
    chart.maxZoomLevel = 6;

    chart.events.on("zoomlevelchanged", (e: any) => {
      console.log("e: ", e);
    });

    // Make map load polygon (like country names) data from GeoJSON
    polygonSeries.useGeodata = true;

    // Configure series
    const polygonTemplate = polygonSeries.mapPolygons.template;
    polygonTemplate.showOnInit = true;
    polygonTemplate.fill = am4core.color("#67879e");

    // Create hover state and set alternative fill color
    const hs = polygonTemplate.states.create("hover");
    hs.properties.fill = am4core.color("#bfccd6");

    // Create active state
    const activeState = polygonTemplate.states.create("active");
    activeState.properties.fill = am4core.color("#D9D9D9");

    // Create an event to toggle "active" state
    polygonTemplate.events.on("hit", function(ev) {
      ev.target.isActive = !ev.target.isActive;
    });

    // chart.events.onAll(e => {
    //     console.log(e);
    // });
    chart.events.on("mappositionchanged", e => {
      console.log(e);
    });

    const imageSeries = chart.series.push(new am4maps.MapImageSeries());
    // Basic Circle Image

    const imageSeriesTemplate = imageSeries.mapImages.template;
    const tooltip = imageSeriesTemplate.createChild(am4core.Tooltip);
    const defaultHTML = `
        <div class="map-tooltip" id="map-tooltip">
            <div class="map-tooltip__box">
                <div>{title}</div>
                <div>Some info</div>
            </div>
        </div>
        `;
    tooltip.showOnInit = true;
    tooltip.html = defaultHTML;
    tooltip.label.fill = am4core.color("#737373");

    tooltip.events.on("over", e => {
      e.target.html = `
                <div class="map-tooltip" id="map-tooltip">
                    <div class="map-tooltip__box">
                        <div>{title}</div>
                        <div>Some info</div>
                        <div>{more}</div>
                    </div>
                </div>
            `;
    });
    tooltip.events.on("out", e => {
      e.target.html = defaultHTML;
    });

    // Binding Marker Properties to Data
    imageSeriesTemplate.propertyFields.latitude = "latitude";
    imageSeriesTemplate.propertyFields.longitude = "longitude";
    imageSeries.data = tooltipConfig;
  }
}
