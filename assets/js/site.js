(function () {
    document.querySelectorAll('.fancyDisplay').forEach(el => {
        el.classList.add('fancyDisplayShow');
    });

    document.querySelectorAll('.bar-racer').forEach(el => {
        el.classList.add('racing');
    });

    stringCompare = (a, b) => {
        a = a.toLowerCase();
        b = b.toLowerCase();
        if (a < b) { return -1; }
        if (a > b) { return 1; }
        return 0;
    }

    fromCacheOrFetch('http://ergast.com/api/f1/circuits.json?limit=1000')
        .then(res => {
            const selCircuit = document.querySelector('#circuit-select');
            function createOption(circuit) {
                const opt = document.createElement('option');
                opt.value = circuit.circuitId;
                opt.text = `${circuit.Location.country} - ${circuit.Location.locality} (${circuit.circuitName})`;
                return opt;
            }

            promises = []
            res.MRData.CircuitTable.Circuits.sort((c1, c2) => {
                if (c1.Location.country !== c2.Location.country) {
                    return stringCompare(c1.Location.country, c2.Location.country);
                }

                if (c1.Location.locality !== c2.Location.locality) {
                    return stringCompare(c1.Location.locality, c2.Location.locality);
                }

                return stringCompare(c1.circuitName, c2.circuitName);
            }).forEach(c => {
                promises.push(
                    fromCacheOrFetch(`http://ergast.com/api/f1/circuits/${c.circuitId}/seasons.json?limit=1000`)
                        .then(res2 => {
                            return {
                                seasons: res2.MRData.SeasonTable.Seasons,
                                circuit: c
                            }
                        })
                );


            });
            Promise.all(promises)
                .then(objList => {
                    objList.forEach(obj => {
                        const seasons = obj.seasons.map(s => +s.season);
                        const c = obj.circuit;
                        if (seasons.filter(s => s >= 2012).length > 0
                            && seasons.filter(s => s >= 1996).length > 0
                        ) {
                            selCircuit.appendChild(createOption(c));
                        } else {
                            if (seasons.length > 0) {
                                // console.log(`not including ${c.circuitId} with seasons: ${seasons.reduce((carry,season) => {
                                //     return carry + ', ' + season;
                                // })}`)
                            }
                        }

                        if (selCircuit.childNodes.length === 1) {
                            selCircuit.onchange({ target: selCircuit })
                        }
                    })
                })
                .catch(ex => { console.log(ex); })

        })

    const circuitSelect = document.querySelector('#circuit-select');
    const seasonSelect = document.querySelector('#pitstop-season-select');
    const lapInput = document.querySelector('#laptime-lap');
    circuitSelect.onchange = e => {
        const target = e.target;
        const circuitId = target.value;

        fromCacheOrFetch(`http://ergast.com/api/f1/circuits/${circuitId}/seasons.json?limit=1000`)
            .then(res => res.MRData.SeasonTable.Seasons)
            .then(seasons => {

                while (seasonSelect.firstChild) {
                    seasonSelect.removeChild(seasonSelect.firstChild);
                }
                seasons
                    .map(s => +s.season)
                    .filter(s => s >= 2012)
                    .forEach(s => {
                        const opt = document.createElement('option');
                        opt.value = +s;
                        opt.text = +s;
                        seasonSelect.appendChild(opt);
                    });

                var event;
                if (document.createEvent) {
                    event = document.createEvent("HTMLEvents");
                    event.initEvent("change", true, true);
                }
                event.eventName = "change";
                seasonSelect.dispatchEvent(event);
                lapInput.dispatchEvent(event);
            })
    };
})();


