(function () {
    const pitstopSelect = document.querySelector('#circuit-select');
    const seasonSelect = document.querySelector('#pitstop-season-select');
    const radioColor = document.getElementsByName('pitstop-coloring');

    const margin = { top: 10, right: 10, left: 50, bottom: 50 };
    const width = 1000 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

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
    let colorScale = d3.scaleLinear()
        .range(['pink', 'red'])

    g.append('g')
        .attr('class', 'xAxis')
        .attr('transform', `translate(0,${height})`)

    g.append('g')
        .attr('class', 'yAxis')

    // Add X axis label:
    g.append("text")
        .attr("text-anchor", "end")
        .attr("x", width / 2 + margin.left)
        .attr("y", height + margin.top + 20)
        .text("Lap");

    // Y axis label:
    g.append("text")
        .attr("text-anchor", "end")
        .attr("transform", "rotate(-90)")
        .attr("y", -margin.left + 20)
        .attr("x", -margin.top - height / 2 + 20)
        .text("time [s]")

    function drawChart(data) {

        const maxX = d3.max(data, d => d.x);

        var colorStrategy = document.querySelector('input[name="pitstop-coloring"]:checked').value == 'density' ? 1 : 0;

        const groupedByX = data.reduce((carry, d) => {
            if (d.x in carry) {
                carry[d.x]++;
            } else {
                carry[d.x] = 1;
            }
            return carry;
        }, {});

        const groupedByDriver = data.reduce((carry, d) => {
            if (d.driver in carry) {
                carry[d.driver]++;
            } else {
                carry[d.driver] = 1;
            }
            return carry;
        }, {});


        let maxGrp;
        if (colorStrategy === 1) {
            maxGrp = d3.max(d3.values(groupedByX));
            colorScale = d3.scaleLinear().range(['pink', 'red']);
            colorScale.domain([1, maxGrp]);
        } else {
            maxGrp = d3.max(d3.values(groupedByDriver));
            colorScale = d3.scaleOrdinal(d3['schemeCategory10']);
            colorScale.domain(d3.values(groupedByDriver).sort((x1, x2) => x1 - x2));

        }

        gUsed = new Array(maxX + 1).fill(0);

        xScale.domain(Array.apply(null, { length: maxX + 1 }).map(Number.call, Number));
        g.select('.xAxis')
            .transition(1000)
            .call(xAxis);

        yScale.domain([0, d3.max(data, d => d.y)]);
        g.select('.yAxis')
            .transition(1000)
            .call(yAxis);

        const u = g.selectAll('.pitstop-bar')
            .data(data, d => d.x);

        getWidth = x => xScale.bandwidth() / groupedByX[x];


        u.enter()
            .append('rect')
            .classed('pitstop-bar', true)
            .attr('y', height)
            .merge(u)
            .attr('x', d => {
                const retVal = xScale(d.x) + gUsed[d.x] * getWidth(d.x);
                gUsed[d.x]++;
                return retVal;
            })
            .transition()
            .duration(d => xScale(d.x) / width * 1000)
            .attr('y', d => yScale(d.y))
            .attr('width', d => getWidth(d.x))
            .attr('height', d => height - yScale(d.y))
            .style('fill', d => colorScale(colorStrategy === 1 ? groupedByX[d.x] : groupedByDriver[d.driver]))

        u.exit()
            .remove();

        g.append('g')
            .attr('id', 'legend')
            .attr('transform', `translate(${width - margin.right - 30},0)`);

        const cells = [...new Set(Object.values((colorStrategy === 1) ? groupedByX : groupedByDriver))];
        cells.sort((x1, x2) => x2 - x1);

        const legend = d3
            .legendColor()
            .shapeWidth(10)
            .cells(cells)
            .scale(colorScale);

        g.select('#legend')
            .call(legend);

    }

    radioColor.forEach(radio => {
        radio.addEventListener('click', e => {
            var event;
            if (document.createEvent) {
                event = document.createEvent("HTMLEvents");
                event.initEvent("change", true, true);
            }
            event.eventName = "change";
            seasonSelect.dispatchEvent(event);
        })
    })

    seasonSelect.addEventListener('change', e => {
        const circuitId = pitstopSelect.value
        const season = seasonSelect.value;
        const racesPromise = fromCacheOrFetch(`http://ergast.com/api/f1/${season}/circuits/${circuitId}/races.json?limit=1`)
            .then(res => res.MRData.RaceTable.Races)
        racesPromise
            .then(races => races[0].round)
            .then(round => {
                fromCacheOrFetch(`http://ergast.com/api/f1/${season}/${round}/pitstops.json?limit=1000`)

                    .then(res => res.MRData.RaceTable.Races[0].PitStops)
                    .then(pitstops => {

                        data = pitstops.map(ps => {
                            return { x: +ps.lap, y: +ps.duration, driver: ps.driverId }
                        });
                        drawChart(data);
                    })
                    .catch(ex => console.log(ex))
            })
            .catch(ex => console.log(ex));

        racesPromise.then(races => {
            fromCacheOrFetch(`https://en.wikipedia.org/w/api.php?origin=*&action=query&prop=extracts&exintro&titles=${races[0].url.split('/').pop()}&format=json`)
                .then(res => {
                    const seasonWiki = document.querySelector('#season-wikipedia');
                    while (seasonWiki.firstChild) {
                        seasonWiki.removeChild(seasonWiki.firstChild);
                    }
                    const pages = res.query.pages;
                    seasonWiki.innerHTML = pages[Object.keys(pages)[0]].extract;
                    const link = document.createElement('a');
                    link.href= races[0].url;
                    link.innerHTML='Read more on wikipedia <i class="fas fa-arrow-right"></i>';
                    link.setAttribute('class', 'btn-read-more');
                    seasonWiki.appendChild(link);
                })
        });

    });
}
)();