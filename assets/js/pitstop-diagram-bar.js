(function() {
const pitstopSelect = document.querySelector('#pitstop-circuit-select');
const seasonSelect = document.querySelector('#pitstop-season-select');


const margin = { top: 10, right: 10, left: 50, bottom: 50 };
const width = 2000 - margin.left - margin.right;
const height = 1000 - margin.top - margin.bottom;

const svg = d3.select('#pitstop-barchart');
const g = svg.append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`);

const xScale = d3.scaleBand()
    .range([0, width])
    .padding(0.2);

const xAxis = d3.axisBottom(xScale);
const yScale = d3.scaleLinear()
    .range([height, 0]);
const yAxis = d3.axisLeft(yScale);
const colorScale = d3.scaleOrdinal(d3.schemeCategory10.concat(d3.schemeSet1).concat(d3.schemeSet2).concat(d3.schemeSet3));
g.append('g')
    .attr('class', 'xAxis')
    .attr('transform', `translate(0,${height})`)

g.append('g')
    .attr('class', 'yAxis')

// Add X axis label:
g.append("text")
    .attr("text-anchor", "end")
    .attr("x", width/2 + margin.left)
    .attr("y", height + margin.top + 20)
    .text("Lap");

// Y axis label:
g.append("text")
    .attr("text-anchor", "end")
    .attr("transform", "rotate(-90)")
    .attr("y", -margin.left + 20)
    .attr("x", -margin.top - height/2 + 20)
    .text("time [s]")

function drawChart(data) {
    
    const maxX = d3.max(data, d => d.x);
    
    grouped = data.reduce((carry, d) => {
        if (d.x in carry) {
            carry[d.x] ++;
        } else {
            carry[d.x] = 1;
        }
        return carry;
    }, {});

    gUsed = new Array(maxX + 1).fill(0);
    

    xScale.domain(Array.apply(null, {length: maxX + 1}).map(Number.call, Number));
    g.select('.xAxis')
        .transition(1000)
        .call(xAxis);

    yScale.domain([0, d3.max(data, d => d.y)]);
    g.select('.yAxis')
        .transition(1000)
        .call(yAxis);

    const u = g.selectAll('.pitstop-bar')
        .data(data, d => d.x);

    getWidth = x => xScale.bandwidth() / grouped[x];

    u.enter()
        .append('rect')
        .classed('pitstop-bar', true)
        .attr('y', height)
        .merge(u)
        .transition()
        .duration(1000)
        .attr('x', d => {
            const retVal = xScale(d.x) + gUsed[d.x]*getWidth(d.x);
         
            gUsed[d.x]++;
            return retVal;
        })
        .attr('y', d => yScale(d.y))
        .attr('width', d => getWidth(d.x))
        .attr('height', d => height - yScale(d.y))
        .style('fill', d => colorScale(d.driver) )

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
                        return { x: +ps.lap, y: +ps.duration, driver: ps.driverId }
                    });
                    drawChart(data);
                })
                .catch(ex => console.log(ex))
        })
        .catch(ex => console.log(ex))


}
})();