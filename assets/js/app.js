"use strict";

(async () => {
    
    const loadCache = () => {
        const cache = localStorage.getItem('coinCache');
        return cache ? JSON.parse(cache) : {};
    };

    const saveCache = cache => {
        localStorage.setItem('coinCache', JSON.stringify(cache));
    };

    let cache = loadCache(); // Initialize cache

    const coinsSectionDom= document.getElementById(`coinsSection`)
    const coinsContainerDom = document.getElementById(`coinsContainer`)
    const reportsContainerDom = document.getElementById(`reportsContainer`)
    const aboutContainerDom = document.getElementById(`aboutContainer`)

    // show/hide tabs
    document.getElementById('navCoins').addEventListener('click', () => {
        reportsContainerDom.style.display = 'none';
        aboutContainerDom.style.display = 'none';
        
        // Create the loader span dynamically and append to coinsSection
        const loaderSpan = document.createElement('span');
        loaderSpan.className = 'loader';
        loaderSpan.id = 'coinsLoader';
        coinsSectionDom.appendChild(loaderSpan);
    
        loaderSpan.style.display = 'inline-block';
    
        setTimeout(() => {
            coinsContainerDom.style.display = 'flex';
            document.getElementById(`search`).style.display = 'inline-block';
            document.getElementById(`searchBtn`).style.display = 'inline-block';
            loaderSpan.style.display = 'none'; // Hide the loader
        }, 0.0001);
           
    });
    

    document.getElementById('navReports').addEventListener('click', () => {
       
        coinsContainerDom.style.display = 'none';
        reportsContainerDom.style.display = 'block';
        aboutContainerDom.style.display = 'none';
        document.getElementById(`search`).style.display = `none`;
        document.getElementById(`searchBtn`).style.display = `none`;
    });

    document.getElementById('navAbout').addEventListener('click', () => {
        coinsContainerDom.style.display = 'none';
        reportsContainerDom.style.display = 'none';
        aboutContainerDom.style.display = 'block';
        document.getElementById(`search`).style.display = `none`;
        document.getElementById(`searchBtn`).style.display = `none`;
    });

    // api call + retry if failed
    const getData = (url) => fetch(url).then(response => response.json());
    const fetchRetry = async (url) => {
        let isSuccess = false;
        do {
            try {
                const data = await getData(url);
                isSuccess = true;
                return data;
            } catch (e) {
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        } while (!isSuccess);
    };

    const getAllCoins = async () => fetchRetry('https://api.coingecko.com/api/v3/coins/list');
    const getSingleCoin = async (coin) => fetchRetry(`https://api.coingecko.com/api/v3/coins/${coin}`);
    const getGraphData = async (coins) => fetchRetry(`https://min-api.cryptocompare.com/data/pricemulti?fsyms=${coins.join(',')}&tsyms=USD`);
     
   

    // coins tab stuff
    coinsContainerDom.innerHTML += `<span class="loader" id="coinsLoader"></span>`;

    const coins = await getAllCoins();

    
    // generate coins tab html
    const coinsHtml = coins.map(coin => `
            <div class="coin" id="container${coin.id}">
                <button class="toggle-button" id="${coin.symbol}">add</button>
                <h2>${coin.symbol}</h2>
                <p>${coin.id}</p>
                <button class="info-button" id="${coin.id}">more info</button>
                <div id="${coin.id}Info" class="moreInfoContainer" style="display: none;"></div>
            </div>
        `).join(''); 
        

    // generate coins tab
    coinsContainerDom.innerHTML +=  coinsHtml;
    
    document.getElementById(`coinsLoader`).style.display= `none`;

    
    // search bar
    document.getElementById('searchBtn').addEventListener('click', async () => {
        const searchValue = document.getElementById('search').value;
        const searchResult = coins.filter(coin => coin.symbol === searchValue || !searchValue);
        const nonSearchResult = coins.filter(coin => coin.symbol !== searchValue);
        nonSearchResult.forEach(coin => document.getElementById(`container${coin.id}`).style.display = 'none');
        searchResult.forEach(coin => document.getElementById(`container${coin.id}`).style.display = 'flex');
    });

    // toggle button stuff
    const toggledArray = [];
    document.querySelectorAll('.toggle-button').forEach(button => button.addEventListener('click', async () => {
        if(button.style.backgroundColor === 'blue') {
            button.style.backgroundColor = `grey`;
            button.innerHTML = `add`;
            toggledArray.splice(toggledArray.indexOf(button.id), 1);
        } else { 
            if(toggledArray.length < 5){
                button.style.backgroundColor = 'blue';
                button.innerHTML = `remove`;
                toggledArray.push(button.id);
            } else {
                const triggeringButtonId = button.id;
                // jump window
                const jumpWindow = document.createElement('div');
                jumpWindow.className = 'jumpWindow';
                // jump window content
                jumpWindow.innerHTML = `
                    <p>only 5 coins can be viewed at a time. </br> Please select a coin to replace:</p>
                    <button id="${toggledArray[0]}" class="jumpWindowButtons">X</button> <span>${toggledArray[0]}</span>
                    </br></br>
                    <button id="${toggledArray[1]}" class="jumpWindowButtons">X</button> <span>${toggledArray[1]}</span>
                    </br></br>
                    <button id="${toggledArray[2]}" class="jumpWindowButtons">X</button> <span>${toggledArray[2]}</span>
                    </br></br>
                    <button id="${toggledArray[3]}" class="jumpWindowButtons">X</button> <span>${toggledArray[3]}</span>
                    </br></br>
                    <button id="${toggledArray[4]}" class="jumpWindowButtons">X</button> <span>${toggledArray[4]}</span>
                    </br></br>
                    <button class="closeJumpWindow">Cancel</button>
                `;
                document.body.appendChild(jumpWindow);
                // change selected buttons AND close jump window
                document.querySelectorAll('.jumpWindow button:not(.closeJumpWindow)').forEach(button=> button.addEventListener('click', function() {
                    const button = document.getElementById(this.id)
                    const triggeringButton = document.getElementById(triggeringButtonId);
                    button.style.backgroundColor = `grey`;
                    button.innerHTML = `add`;
                    toggledArray.splice(toggledArray.indexOf(button.id), 1);
                    document.body.removeChild(jumpWindow);
                    toggledArray.push(triggeringButtonId);
                    triggeringButton.style.backgroundColor = 'blue';
                    triggeringButton.innerHTML = `remove`;
                }));
                // close jump window without changing selected buttons
                document.querySelector('.closeJumpWindow').addEventListener('click', () => {
                    document.body.removeChild(jumpWindow);
                });
            }
        }
    }));

    // generate more info on coins + loading spinner + cache check
    document.querySelectorAll('.info-button').forEach(button => button.addEventListener('click', async () => {

        const coinId = button.id;
        const infoContainer = document.getElementById(`${coinId}Info`);

        // toggle show/hide more info
        if (infoContainer.style.display === 'none') {
            infoContainer.style.display = 'block';
        } else {
            infoContainer.style.display = 'none';
        }

        // Check cache
        const now = Date.now();
        const cachedData = cache[coinId];
        if (cachedData && (now - new Date(cachedData.timestamp).getTime() < 120000)) {
            // Use cached data
            infoContainer.innerHTML = cachedData.data;
        } else {
            // Fetch new data
            infoContainer.innerHTML = `<span class="loader"></span>`;
            const coinData = await getSingleCoin(coinId);
            const coinInfoHtml = `
                <img src="${coinData.image.small}" alt="${coinData.name}">
                <p>Current Price in USD: $${coinData.market_data.current_price.usd}</p>
                <p>Current Price in ILS: ₪${coinData.market_data.current_price.ils}</p>
                <p>Current Price in EUR: €${coinData.market_data.current_price.eur}</p>
            `;
            infoContainer.innerHTML = coinInfoHtml;

            // Update cache
            cache[coinId] = {
                data: coinInfoHtml,
                timestamp: new Date().toISOString()
            };
            saveCache(cache); // Save updated cache to local storage
        }
    })); 
   



    // reports tab stuff
    reportsContainerDom.innerHTML += `
        <h1>Reports</h1>
        <p>Choose up to 5 coins to view their current price in USD, updating every 2 seconds.</p>
        <p>warning: leaving this page will reset the graph!</p>
        <div id="graphDataContainer"></div>
    `;
    var trace1={
        x: [],
        y: [],
        name: '',
        type: 'scatter'
    };
    
    var trace2={
        x: [],
        y: [],
        name: '',
        type: 'scatter'
    };

    var trace3={
        x: [],
        y: [],
        name: '',
        type: 'scatter'
    };
    
    var trace4={
        x: [],
        y: [],
        name: '',
        type: 'scatter'
    };

    var trace5={
        x: [],
        y: [],
        name: '',
        type: 'scatter'
    };

    var layout = {
        title: 'Coins Price',
        xaxis: {
            title: 'Time'
        },
        yaxis: {
            title: 'Price'
        }
    };

    let traceArray = [trace1, trace2, trace3, trace4, trace5];

    let intervalID; 

    // graph
    document.getElementById('navReports').addEventListener('click', () => {
        // Stop any running interval if there is one
        if (intervalID) {
            clearInterval(intervalID);
        }

        // Reset the graph by clearing the existing data
        traceArray.forEach(trace => {
            trace.x = [];
            trace.y = [];
            trace.name = '';
        });

        // Initial plot creation
        Plotly.newPlot('graphDataContainer', traceArray, layout);

        let timeCounter = 0;

        // Start the new interval
        intervalID = setInterval(async () => {
            const graphData = await getGraphData(toggledArray);
            // console.log(graphData);

            toggledArray.forEach((coinSymbol, index) => {
                // Ensure the coin symbol is in the correct case (if needed)
                const coinData = graphData[coinSymbol.toUpperCase()]; //the only place in the project where the api IS case sensitive
                if (coinData) {
                    traceArray[index].x.push(timeCounter); // Push time
                    traceArray[index].y.push(coinData.USD); // Push price
                    traceArray[index].name = coinSymbol.toUpperCase(); // Assign the coin symbol as the trace name
                }
            });
            timeCounter+=2
            // Update the plot 
            Plotly.update('graphDataContainer', {
                x: traceArray.map(trace => trace.x),
                y: traceArray.map(trace => trace.y),
                name: traceArray.map(trace => trace.name)
            });
        }, 2000);
    });
    
    



    // about tab stuff
    aboutContainerDom.innerHTML += `
        <h1>About</h1>
        <p>This is a simple web app that allows you to view information about cryptocurrencies.</p>
        <p>Developed by Tomer Ognistoff, a 23 y/o aspiring developer, as part of John Bryce FullStack Course <img class="face" src="assets/pictures/פרצוף.jpg" alt="פרצוף" /></p>
        `;
})();
