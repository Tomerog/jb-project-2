"use strict";

(async () => {
    const cacheKey = 'coinCache';
    const cacheDuration = 120000; // 2 minutes 

    // Load cache from local storage
    const loadCache = () => {
        const cache = localStorage.getItem(cacheKey);
        return cache ? JSON.parse(cache) : {};
    };

    // Save cache to local storage
    const saveCache = (cache) => {
        localStorage.setItem(cacheKey, JSON.stringify(cache));
    };

    let cache = loadCache(); // Initialize cache

    // show/hide tabs
    document.getElementById('navCoins').addEventListener('click', () => {
        document.getElementById('coinsContainer').style.display = 'flex';
        document.getElementById('reports').style.display = 'none';
        document.getElementById('about').style.display = 'none';
    });

    document.getElementById('navReports').addEventListener('click', () => {
        document.getElementById('coinsContainer').style.display = 'none';
        document.getElementById('reports').style.display = 'block';
        document.getElementById('about').style.display = 'none';
    });

    document.getElementById('navAbout').addEventListener('click', () => {
        document.getElementById('coinsContainer').style.display = 'none';
        document.getElementById('reports').style.display = 'none';
        document.getElementById('about').style.display = 'block';
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

    // const getAllCoins = async () => getData('https://api.coingecko.com/api/v3/coins/list');
    const getAllCoins = async () => getData('assets/json/coins.json');
    const getSingleCoin = async (coin) => fetchRetry(`https://api.coingecko.com/api/v3/coins/${coin}`);
    const getGraphData = async (coins) => getData(`https://min-api.cryptocompare.com/data/pricemulti?fsyms=${coins.join(',')}&tsyms=USD`);

    const coins = await getAllCoins();

    // generate coins tab html
    const html = coins.splice(0, 6)
        .map(coin => `
            <div class="coin">
                <button class="toggle-button" id="${coin.id}">add</button>
                <h3>${coin.id}</h3>
                <p>${coin.name}</p>
                <button class="info-button" id="${coin.id}">more info</button>
                <div id="${coin.id}Info" class="moreInfoContainer" style="display: none;"></div>
            </div>
        `)
        .join('');

    // generate coins tab
    document.getElementById('coinsContainer').innerHTML = html;
    

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
                toggledArray.push(button.id);}
            else{
                const triggeringButtonId = button.id;
                // jump window
                const jumpWindow = document.createElement('div');
                jumpWindow.className = 'jumpWindow';
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
                document.querySelectorAll('.jumpWindow button:not(.closeJumpWindow)').forEach(button=> button.addEventListener('click',function() {
                    const button = document.getElementById(this.id)
                    const triggeringButton = document.getElementById(triggeringButtonId);
                    button.style.backgroundColor = `grey`;
                    button.innerHTML = `add`;
                    toggledArray.splice(toggledArray.indexOf(button.id), 1);
                    document.body.removeChild(jumpWindow);
                    toggledArray.push(triggeringButtonId);
                    triggeringButton.style.backgroundColor = 'blue';
                    triggeringButton.innerHTML = `remove`;
                    console.log(toggledArray);
                }));
                // close jump window without changing selected buttons
                document.querySelector('.closeJumpWindow').addEventListener('click', () => {
                    document.body.removeChild(jumpWindow);
                });
            }
        }
        console.log(toggledArray);
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
        if (cachedData && (now - new Date(cachedData.timestamp).getTime() < cacheDuration)) {
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
})();