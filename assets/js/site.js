(function () {
    document.querySelectorAll('.fancyDisplay').forEach(el => {
        el.classList.add('fancyDisplayShow');
    });

    document.querySelectorAll('.bar-racer').forEach(el => {
        el.classList.add('racing');
    });


    fetch('http://ergast.com/api/f1/drivers.json?limit=1000')
        .then(res => res.json())
        .then(res => {
            const selD1 = document.querySelector('#driver_1_select');
            const selD2 = document.querySelector('#driver_2_select');

            res.MRData.DriverTable.Drivers.forEach(d => {
                const opt = document.createElement('option');
                opt.value = d.driverId;
                opt.text = `${d.givenName} ${d.familyName}`;
                selD1.appendChild(opt)
                const opt2 = opt.cloneNode(true);
                selD2.appendChild(opt2);
            })
        })

    stringCompare = (a, b) => {
        a = a.toLowerCase();
        b = b.toLowerCase();
        if (a < b) { return -1; }
        if (a > b) { return 1; }
        return 0;
    }

    fetch('http://ergast.com/api/f1/circuits.json?limit=1000')
        .then(res => res.json())
        .then(res => {
            const selCircuit = document.querySelector('#circuit_select');

            res.MRData.CircuitTable.Circuits.sort((c1, c2) => {
                if (c1.Location.country !== c2.Location.country) {
                    return stringCompare(c1.Location.country, c2.Location.country);
                }

                if (c1.Location.locality !== c2.Location.locality) {
                    return stringCompare(c1.Location.locality, c2.Location.locality);
                }

                return stringCompare(c1.circuitName, c2.circuitName);
            }).forEach(c => {
                fetch(`http://ergast.com/api/f1/circuits/${c.circuitId}/seasons.json`)
                    .then(res2 => res2.json())
                    .then(res2 => res2.MRData.SeasonTable.Seasons)
                    .then(seasons => {
                        if (seasons
                            .map(s => +s.season)
                            .filter(s => s >= 2012).length) {
                            const opt = document.createElement('option');
                            opt.value = c.circuitId;
                            opt.text = `${c.Location.country} - ${c.Location.locality} (${c.circuitName})`;
                            selCircuit.appendChild(opt);
                        }

                        if (selCircuit.childNodes.length === 1) {
                            selCircuit.onchange({ target: selCircuit })
                        }
                    })
                    .catch(ex => { console.log(ex); })
            });
        })

    const pitstopSelect = document.querySelector('#circuit_select');
    const seasonSelect = document.querySelector('#pitstop-season-select');

    pitstopSelect.onchange = e => {
        const target = e.target;
        const circuitId = target.value;

        fetch(`http://ergast.com/api/f1/circuits/${circuitId}/seasons.json?limit=1000`)
            .then(res => res.json())
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

                seasonSelect.onchange({ target: seasonSelect });
            })
    };
})();


