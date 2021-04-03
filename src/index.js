import "./styles.scss";
import * as d3 from "d3";

const width = 1500;
const height = 625;
const padding = 100;

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function generateTooltipHtml({ year, month, variance }, baseTemperature) {
  const baseHTML = `<div>${year} - ${monthNames[month - 1]}</div><div>${(
    variance + baseTemperature
  ).toFixed(2)}℃</div><div>${variance.toFixed(2)}℃</div>`;
  return baseHTML;
}

fetch(
  "https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/global-temperature.json"
)
  .then((res) => {
    return res.json();
  })
  .then((response) => {
    const dataSet = response;

    const svg = d3
      .select("#svg-container")
      .append("svg")
      .attr("width", width)
      .attr("height", height);

    const tooltip = d3
      .select("body")
      .append("div")
      .attr("id", "tooltip")
      .style("opacity", 0);

    const legendWidth = width / 4;
    const legendHeight = 80;
    const legendPadding = 10;

    const legend = d3
      .select("svg")
      .append("svg")
      .attr("width", legendWidth)
      .attr("height", legendHeight)
      .attr("id", "legend")
      .attr("y", height * 0.92)
      .attr("x", width / 16.5);

    const legendMin = d3.min(dataSet.monthlyVariance, (d) => d.variance);
    const legendMax = d3.max(dataSet.monthlyVariance, (d) => d.variance);

    const colorScale = d3
      .scaleSequential()
      .interpolator(d3.interpolateInferno)
      .domain([legendMin, legendMax]);

    // generate array that will be used for the legend rects
    const legendData = [];
    const step = (legendMax - legendMin) / 9;
    let start = legendMin;
    legendData.push(start);

    while (start < legendMax - step) {
      start += step;
      legendData.push(start);
    }

    // generate array that will be used for tick values in legend
    const tickStep = (legendMax - legendMin) / 9;
    const tickData = [legendMin + dataSet.baseTemperature];
    let currentValue = legendMin + dataSet.baseTemperature;

    while (currentValue < legendMax + dataSet.baseTemperature) {
      currentValue += tickStep;
      tickData.push(currentValue);
    }

    // scale used to place rects along legend
    const legendScale = d3
      .scaleLinear()
      .domain([
        legendMin + dataSet.baseTemperature,
        legendMax + dataSet.baseTemperature,
      ])
      .range([legendPadding, legendWidth - legendPadding]);

    legend
      .selectAll("rect")
      .data(legendData)
      .enter()
      .append("rect")
      .attr("stroke", "black")
      .attr("width", `${(legendWidth - legendPadding - 9.5) / 9}`)
      .attr("height", `${(legendWidth - legendPadding) / 11}`)
      .attr("x", (d) => `${legendScale(d + dataSet.baseTemperature)}`)
      .attr("fill", (d) => colorScale(d));

    const legendAxis = d3
      .axisBottom(legendScale)
      .tickValues(tickData)
      .tickFormat(
        (t) => `${t.toString().length < 2 ? t.toString() + ".0" : t.toFixed(1)}`
      );

    legend
      .append("g")
      .attr("transform", `translate(0, 33)`)
      .attr("id", "legend-axis")
      .call(legendAxis);

    // attach x axis
    const xMin = d3.min(
      dataSet.monthlyVariance,
      (d) => new Date(d.year, 0, 0, 0, 0, 0)
    );
    const xMax = d3.max(
      dataSet.monthlyVariance,
      (d) => new Date(d.year, 12, 0, 0, 0, 0)
    );

    const xScale = d3
      .scaleTime()
      .domain([xMin, xMax])
      .range([padding, width - padding]);

    const xAxis = d3.axisBottom(xScale).ticks(20);

    svg
      .append("text")
      .attr("y", height - 50)
      .attr("x", width / 2)
      .style("text-anchor", "middle")
      .text("Years");

    svg
      .append("g")
      .attr("transform", `translate(0, ${height - padding})`)
      .attr("id", "x-axis")
      .call(xAxis);

    // attach y axis
    const yScale = d3
      .scaleLinear()
      .domain([12.5, 0.52])
      .range([height - padding, padding]);

    const yAxis = d3.axisLeft(yScale).tickFormat((d) => {
      return `${monthNames[d - 1]}`;
    });

    svg
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", padding - 75)
      .attr("x", -height / 2)
      .style("text-anchor", "middle")
      .text("Months");

    svg
      .append("g")
      .attr("transform", `translate(${padding}, 0)`)
      .attr("id", "y-axis")
      .call(yAxis);

    // fill the graph with rectangles for the heat map
    svg
      .selectAll("rect .cell")
      .data(dataSet.monthlyVariance)
      .enter()
      .append("rect")
      .attr("height", (height - 2 * padding) / 12)
      .attr(
        "width",
        (width - 2 * padding) / (dataSet.monthlyVariance.length / 12)
      )
      .attr("x", (d) => xScale(new Date(d.year, 0, 0, 0, 0, 0)))
      .attr("y", (d) => yScale(d.month) - 17)
      .attr("fill", (d) => {
        return colorScale(d.variance);
      })
      .attr("class", "cell")
      .attr("data-month", (d) => d.month - 1)
      .attr("data-year", (d) => d.year)
      .attr("data-temp", (d) => d.variance + dataSet.baseTemperature)
      // tooltip function
      .on("mousemove", (e, d) => {
        d3.select(this).transition().duration("50").attr("opacity", ".85");
        tooltip
          .html(generateTooltipHtml(d, dataSet.baseTemperature))
          .style("left", `${e.screenX - 35}px`)
          .style("top", `${e.screenY - 75}px`)
          .attr("data-year", d.year);
        tooltip.transition().duration(50).style("opacity", 1);
      })
      .on("mouseout", function () {
        d3.select(this).transition().duration("50").attr("opacity", "1");

        // Makes the tooltip disappear:
        tooltip.transition().duration("50").style("opacity", 0);
      });
  });
