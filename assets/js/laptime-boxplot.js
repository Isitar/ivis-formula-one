(function () {
    const circuitSelect = document.querySelector('#laptime-circuit-select');
    const lapInput = document.querySelector('#laptime-lap');

    const margin = { top: 10, right: 10, left: 50, bottom: 50 };
    const width = 1000 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    const svg = d3.select('#laptime-boxplot');
    const g = svg.append('g')
        .attr('transform', `translate(${margin.left}, ${margin.top})`);

    const xScale = d3.scaleBand()
        .range([0, width])
        .padding(0.2);

    const xAxis = d3.axisBottom(xScale);
    const yScale = d3.scaleLinear()
        .range([height, 0]);
    const yAxis = d3.axisLeft(yScale);

    g.append('g')
        .attr('class', 'xAxis')
        .attr('transform', `translate(0,${height})`)

    g.append('g')
        .attr('class', 'yAxis')

    // Add X axis label:
    g.append('text')
        .attr('text-anchor', 'end')
        .attr('x', width / 2 + margin.left)
        .attr('y', height + margin.top + 20)
        .text('Year');

    // Y axis label:
    g.append('text')
        .attr('text-anchor', 'end')
        .attr('transform', 'rotate(-90)')
        .attr('y', -margin.left + 20)
        .attr('x', -margin.top - height / 2 + 20)
        .text('Laptime [s]')


    circuitSelect.onchange = function (event) {
        document.querySelector('#laptime-boxplot').classList.add('loading');
        const circuitId = circuitSelect.value;
        fetch(`http://ergast.com/api/f1/circuits/${circuitId}/seasons.json`)
            .then(res => res.json())
            .then(res => res.MRData.SeasonTable.Seasons)
            .then(seasons => {
                promises = []

                seasons
                    .map(season => +season.season)
                    .filter(season => season >= 1996)
                    .forEach(season => {
                        const promise = fetch(`http://ergast.com/api/f1/${season}/circuits/${circuitId}/races.json?limit=1`)
                            .then(res => res.json())
                            .then(res => res.MRData.RaceTable.Races)
                            .then(races => races[0].round)
                            .then(round => fetch(`http://ergast.com/api/f1/${season}/${round}/laps/${lapInput.value}.json?limit=1000`))
                            .then(res => res.json())
                            .then(res => res.MRData.RaceTable.Races[0].Laps)
                            .then(laps => {
                                times = [];
                                laps.forEach(lap => {
                                    times.push(lap.Timings.map(t => t.time));
                                })
                                return times;
                            });
                        promises[season] = promise;
                    });

                Promise.all(promises)
                    .then(times => {
                        const data = []
                        times.forEach((time, index) => {
                            if (time === undefined) {
                                return;
                            }
                            d = {}
                            d.year = index;


                            lapTimesInseconds = time[0].map(t => {
                                var p = t.split(':');
                                var seconds = 0.0;
                                f = 1;
                                while (p.length > 0) {
                                    seconds += f * parseFloat(p.pop());
                                    f *= 60;
                                }
                                return seconds;
                            });
                            d.times = lapTimesInseconds;
                            data.push(d);
                        });
                        drawGraph(data.sort(d => -d.year));
                    });
            });
    }

    lapInput.onchange = circuitSelect.onchange;

    function drawGraph(data) {
        const preparedData = data.map(d => {
            q1 = d3.quantile(d.times.sort(d3.ascending), .25);
            median = d3.quantile(d.times.sort(d3.ascending), .5);
            q3 = d3.quantile(d.times.sort(d3.ascending), .75);
            interQuantileRange = q3 - q1;
            min = d3.min(d.times);
            max = d3.max(d.times);
            return ({ year: d.year, q1: q1, median: median, q3: q3, interQuantileRange: interQuantileRange, min: min, max: max })
        });
        console.log(preparedData);

        xScale.domain(preparedData.map(d => d.year));

        g.select('.xAxis')
            .transition(1000)
            .call(xAxis);

        yScale.domain([0, Math.max(...preparedData.map(d => d.max))]);
        g.select('.yAxis')
            .transition(1000)
            .call(yAxis);

        // Show the main vertical line
        const vertLines = g
            .selectAll('.vert-line')
            .data(preparedData);

        vertLines.enter()
            .append('line')
            .classed('vert-line', true)
            .merge(vertLines)
            .transition()
            .duration(1000)
            .attr('x1', d => xScale(d.year) + xScale.bandwidth() / 2)
            .attr('x2', d => xScale(d.year) + xScale.bandwidth() / 2)
            .attr('y1', function (d) { return (yScale(d.min)) })
            .attr('y2', function (d) { return (yScale(d.max)) })
            .style('width', 40)

        vertLines.exit()
            .remove()

        const boxes = g
            .selectAll('.box')
            .data(preparedData);
        boxes.enter()
            .append('rect')
            .classed('box', true)
            .merge(boxes)
            .transition()
            .duration(1000)
            .attr('x', d => xScale(d.year))
            .attr('y', d => yScale(d.q3))
            .attr('width', xScale.bandwidth)
            .attr('height', d => yScale(d.q1) - yScale(d.q3))
        boxes.exit()
            .remove();


        const horzLines = g
            .selectAll('.horz-line')
            .data(preparedData);
        horzLines.enter()
            .append('line')
            .classed('horz-line', true)
            .merge(horzLines)
            .transition()
            .duration(1000)
            .attr('x1', d => xScale(d.year))
            .attr('x2', d => xScale(d.year) + xScale.bandwidth())
            .attr('y1', d => yScale(d.median))
            .attr('y2', d => yScale(d.median))
            .style('width', 40)
        horzLines.exit()
            .remove();

        document.querySelector('#laptime-boxplot').classList.remove('loading');
    }
})();