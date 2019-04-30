(function() {
    document.querySelectorAll('.fancyDisplay').forEach(el => {
        el.classList.add('fancyDisplayShow');
    });

    document.querySelectorAll('.bar-racer').forEach(el => {
        el.classList.add('racing');
    });


    fetch('http://ergast.com/api/f1/drivers.json')
    .then(res => res.json())
    .then(res => {
        const selD1 = document.querySelector('#driver_1_select');
        const selD2 = document.querySelector('#driver_2_select');
        
        res.MRData.DriverTable.Drivers.forEach(d => {
            const opt = document.createElement('option');
            opt.value=d.driverId;
            opt.text = `${d.givenName} ${d.familyName}`;
            selD1.appendChild(opt)
            const opt2 = opt.cloneNode(true);
            selD2.appendChild(opt2);
        })
    })
})();