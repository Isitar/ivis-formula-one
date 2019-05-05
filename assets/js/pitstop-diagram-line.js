const pitstopSelect = document.querySelector('#circuit_select');
const seasonSelect = document.querySelector('#pitstop-season-select');

const margin = { top: 10, right: 30, left: 30, bottom: 30 };
const width = 2000 - margin.left - margin.right;
const height = 1000 - margin.top - margin.bottom;

const svg = d3.select('#pitstop-linechart');
const g = svg.append('g')
    .attr('transform', `translate(${margin.lef}, ${margin.top})`);

const xScale = d3.scaleLinear()
    .range([0, width]);

const xAxis = d3.axisBottom(xScale);
const yScale = d3.scaleLinear()
    .range([height, 0]);
const yAxis = d3.axisLeft(yScale);
g.append('g')
    .attr('class', 'xAxis')
    .attr('transform', `translate(0,${height})`)

g.append('g')
    .attr('class', 'yAxis')

function drawChart(data) {

    const maxX = d3.max(data, d => d.x);
    console.log(data);
    console.log(maxX);
    xScale.domain([0, maxX]);
    g.select('.xAxis')
        .transition(1000)
        .call(xAxis);

    yScale.domain([0, d3.max(data, d => d.y)]);
    g.select('.yAxis')
        .transition(1000)
        .call(yAxis);

    const u = g.selectAll('.pitstop-line')
        .data([data], d => d.x);

    u.enter()
        .append('path')
        .classed('pitstop-line', true)
        .merge(u)
        .transition()
        .duration(1000)
        .attr('d', d3.line()
            .x(d => xScale(d.x))
            .y(d => yScale(d.y))
        )

    u.exit()
        .remove()
}


seasonSelect.onchange = e => {
    const circuitId = pitstopSelect.value
    const season = seasonSelect.value;
    fetch(`http://ergast.com/api/f1/${season}/circuits/${circuitId}/races.json?limit=1`)
        .then(res => res.json())
        .then(res => res.MRData.RaceTable.Races)
        .then(races => races[0].round)
        .then(round => {
            fetch(`http://ergast.com/api/f1/${season}/${round}/pitstops.json?limit=1000`)
                .then(res => res.json())
                .then(res => res.MRData.RaceTable.Races[0].PitStops)
                .then(pitstops => {

                    data = pitstops.map(ps => {
                        return { x: +ps.lap, y: +ps.duration }
                    });
                    drawChart(data);
                })
                .catch(ex => console.log(ex))
        })
        .catch(ex => console.log(ex))


}