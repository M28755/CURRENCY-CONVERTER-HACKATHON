const API_BASE_URL = "https://api.frankfurter.dev/v2"

document.addEventListener('DOMContentLoaded', () => {


    //lets get DOM element
    const amountInput = document.getElementById('amount-input')
    const receiveInput = document.getElementById('receive-input')
    const fromBtn = document.getElementById('from-btn')
    const toBtn = document.getElementById('to-btn')
    const swapBtn = document.getElementById('swap-btn')
    const rateSubtext = document.querySelector('.rate-subtext')

    // Initialize default send amount value
    amountInput.value = 0;

    const dropDown = document.getElementById('currency-dropdown')
    const searchbar = document.getElementById('search-input')
    const popularList = document.getElementById('popular-currencies')
    const otherList = document.getElementById('other-currencies')
    const totalCurrencies = document.getElementById('total-currencies')
    const favoriteBadge = document.querySelector('.tab-btn:nth-child(3) .badge')
    const logBadge = document.querySelector('.tab-btn:nth-child(4) .badge')




    let Currencies = [];
    let currentFromCurrency = 'USD';
    let currentToCurrency = 'EUR';
    let currentExchangeRate = 0;
    let activePickerTarget = null;
    let historyChart = null;

    amountInput.value = 1000;


    function showToast(message, type = 'success') {

        const toastContainer = document.getElementById('toastContainer')


        //create dynamiic toast element
        const toast = document.createElement('div')
        toast.classList.add('toast', type)
        toast.innerText = message;


        toastContainer.appendChild(toast)

        if (type == 'success') {
            toast.style.background = ' #42eb05'
        } else {
            toast.style.background = '#ff4141'
        }
        setTimeout(() => {
            toast.classList.add('hide');
            toast.addEventListener('animationend', () => {
                toast.remove()
            })
        }, 2000)

    }



    //get fovarites from browser local storage

    let favorites = JSON.parse(localStorage.getItem('favoriteCurrencies')) || [];

    let logs = JSON.parse(localStorage.getItem('logs')) || [];

    //lets have array of popular codes
    let popularCurrencies = ['USD', 'EUR', 'GBP', 'CHF', 'AUD', 'JPY']


    //fetching from api 
    async function ApiFetch() {
        try {

            const response = await fetch(`${API_BASE_URL}/currencies`)
            //lets check if the response is ok
            if (!response.ok) {
                throw new Error(`failed to fetch currencies: ${response.status}`)
            }

            const data = await response.json()

            // console.log(data)

            Currencies = data.map((item) => ({
                code: item.iso_code,
                name: item.name,
                popular: popularCurrencies.includes(item.iso_code),
                flag: getFlagEmoji(item.iso_code),

            }))
            // console.log(Currencies)

            //update total currencies
            totalCurrencies.textContent = Currencies.length

            //  console.log(totalCurrencies.textContent)

            renderCurrencyList();
            updateButtonUI(fromBtn, currentFromCurrency)
            updateButtonUI(toBtn, currentToCurrency)

            await fetchLiveRate()
            await fetchHistoryData()


        } catch (error) {

            console.log('error fetching data', error)

        }

    }

    ApiFetch();

    //currency dropdown
    function renderCurrencyList(filter = '') {
        popularList.innerHTML = '';
        otherList.innerHTML = '';

        const lowerCaseFilter = filter.toLowerCase();

        Currencies.forEach((currency) => {
            const matchesCode = currency.code.toLowerCase().includes(lowerCaseFilter);
            const matchesName = currency.name.toLowerCase().includes(lowerCaseFilter);


            if (!matchesCode && !matchesName) {
                return;
            }

            // console.log(currency);

            const row = document.createElement("div")
            row.className = 'currency-row'

            const isSelected = (activePickerTarget === 'from' && currency.code === currentFromCurrency) || (activePickerTarget === 'to' && currency.code === currentToCurrency)

            // console.log(isSelected)

            if (isSelected) {
                row.classList.add('selected')
            }

            row.innerHTML = `
                <div class="flag">${currency.flag}</div>
                <div class="currency-info">
                    <span class="code">${currency.code}</span>
                    <span class="name">${currency.name}</span>
                </div>
                <span class="check-icon">✓</span>
            `;

            row.addEventListener('click', () => {
                handleCurrencySelect(currency)
            })


            //APPEND to appropriate list
            if (currency.popular) {
                popularList.appendChild(row)
            }
            else {
                otherList.appendChild(row)
            }

        })


    }

    async function handleCurrencySelect(currency) {
        if (activePickerTarget === 'from') {
            currentFromCurrency = currency.code;
            updateButtonUI(fromBtn, currency.code)
        } else if (activePickerTarget === 'to') {
            currentToCurrency = currency.code
            updateButtonUI(toBtn, currency.code)
        }
        //close dropdown when the currency is clicked
        dropDown.style.display = 'none'

        searchbar.value = '';
        await fetchLiveRate()
        await fetchHistoryData()
        await fetchCompareRates()


    }
    //converting currecy code into flag
    function getFlagEmoji(currecyCode) {
        const countryCode = currecyCode.substring(0, 2)
        return countryCode.toUpperCase().replace(/./g, char => String.fromCodePoint(127397 + char.charCodeAt()));

    }
    //update button ui 

    function updateButtonUI(button, code) {
        const currency = Currencies.find(c => c.code === code)
        if (currency) {
            //  console.log(currency.code)
        }

        button.querySelector('.currency-code').textContent = code || ''
        button.querySelector('.flag').textContent = currency ? currency.flag : '';

    }

    //dropdown

    const toggleDropdown = (target) => {
        activePickerTarget = target;
        searchbar.value = '';
        renderCurrencyList();
        dropDown.style.display = (dropDown.style.display === 'flex') ? 'none' : 'flex';

        if (dropDown.style.display === 'flex') {
            searchbar.focus()
        }

        if (target === 'to') {
            dropDown.classList.add('align-right');
        } else {
            dropDown.classList.remove('align-right');
        }

    }
    fromBtn.addEventListener('click', (e) => {
        e.stopPropagation();

        toggleDropdown('from')
    })
    toBtn.addEventListener('click', (e) => {
        e.stopPropagation();

        toggleDropdown('to')
    })
    searchbar.addEventListener('input', (e) => {
        renderCurrencyList(e.target.value)
    })
    document.addEventListener('click', (e) => {
        if (!dropDown.contains(e.target) && !fromBtn.contains(e.target) && !toBtn.contains(e.target)) {
            dropDown.style.display = 'none';
        }
    });

    // Input event listeners for real-time conversion
    amountInput.addEventListener('input', () => {
        calculateConversion();

    });

    receiveInput.addEventListener('input', () => {
        const val = receiveInput.value.trim();
        if (val === '') {
            amountInput.value = '';
            return;
        }
        const amount = parseFloat(val) || 0;
        if (currentExchangeRate > 0) {
            amountInput.value = (amount / currentExchangeRate).toFixed(2);
        } else {
            amountInput.value = '';
        }
    });

    // Swap button event listener
    swapBtn.addEventListener('click', () => {
        // Swap currencies
        const tempCode = currentFromCurrency;
        currentFromCurrency = currentToCurrency;
        currentToCurrency = tempCode;

        // Update buttons UI
        updateButtonUI(fromBtn, currentFromCurrency);
        updateButtonUI(toBtn, currentToCurrency);

        // Swap input values
        const tempVal = amountInput.value;
        amountInput.value = receiveInput.value;
        receiveInput.value = tempVal;

        // Fetch live rates for the new pair
        fetchLiveRate();
        fetchHistoryData();

        //compareBaseCurrencyEl.textContent = currentFromCurrency;
        fetchCompareRates();
    });



    //Fetching Live Rates & Update Converter
    async function fetchLiveRate() {
        try {
            const res = await fetch(`${API_BASE_URL}/rate/${currentFromCurrency}/${currentToCurrency}`);

            const data = await res.json()

            //   console.log(data)

            currentExchangeRate = data.rate;
            // console.log(currentExchangeRate)

            rateSubtext.textContent = `1 ${currentFromCurrency} = ${currentExchangeRate.toFixed(5)} ${currentToCurrency}`;

            calculateConversion()
            await updatestats(data.date)

        } catch (error) {
            console.error("Failed to fetch live rates:", error);

        }

    }
    function calculateConversion() {
        const val = amountInput.value.trim();
        if (val === '') {
            receiveInput.value = '';
            return;
        }

        const amount = parseFloat(val) || 0;
        const convertedAmount = (amount * currentExchangeRate).toFixed(2);
        receiveInput.value = convertedAmount;

        //console.log(receiveInput.value)
        //console.log(amountInput.value)
    }

    //fetching history data
    async function fetchHistoryData() {
        const endDate = new Date()
        const startDate = new Date()
        startDate.setDate(endDate.getDate() - 30)

        const formattedStartDate = startDate.toISOString().split('T')[0]
        const formattedEndDate = endDate.toISOString().split('T')[0]
        /*  const formattedStartDate = startDate.toLocaleString('en-US', {
             month: 'short',
             day: 'numeric'
         })
         const formattedEndDate = endDate.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric'

        }) */

        //  console.log(`${formattedStartDate} --- ${formattedEndDate}`)
        try {
            const res = await fetch(`${API_BASE_URL}/rates?from=${formattedStartDate}&to=${formattedEndDate}&base=${currentFromCurrency}&quotes=${currentToCurrency}`)


            if (!res.ok) {
                throw new Error('Failed to fetch history data')
            }

            const data = await res.json()

            //formating  ISO to  localString
            const formattedDate = (dateString) => {
                return new Date(dateString).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric'
                })
            }

            const chartLabels = data.map(item => formattedDate(item.date));
            const chartData = data.map(item => item.rate);

            // console.log(chartData)

            renderChart(chartLabels, chartData)


        } catch (error) {
            console.error("Failed to fetch history:", error);

        }

    }
    function renderChart(labels, data) {
        const ctx = document.getElementById('history-chart').getContext('2d')

        if (historyChart) {
            historyChart.destroy();
        }
        document.getElementById('chart-pair').textContent = `${currentFromCurrency}/${currentToCurrency}`

        const latestRate = data[data.length - 1]

        document.getElementById('chart-rate').textContent = latestRate.toFixed(4)

        // Calculate 30-day change for the chart header
        const firstRate = data[0]
        //console.log(firstRate)
        const percentageChange = (((latestRate - firstRate) / firstRate) * 100).toFixed(2)
        //console.log(`+${percentageChange}`)
        // const ChangeElement = document.getElementById('chart-change')

        // ChangeElement.textContent = (percentageChange >= 0 ? '+' : '') + `${percentageChange}` + '%'
        /* if (percentageChange >= 0) {
            ChangeElement.className = 'positive'
        } else {
            ChangeElement.className = 'negative'
        } */

        // Set Timestamp
        const now = new Date()
        const formattedTime = now.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        })
        document.getElementById('chart-time').textContent = formattedTime;

        //console.log(formattedTime)

        historyChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: `${currentFromCurrency}/${currentToCurrency}`,
                    data: data,
                    borderColor: '#84CC16', // Lime 500
                    backgroundColor: 'rgba(132, 204, 22, 0.1)',
                    borderWidth: 1,
                    pointRadius: 1.5,
                    tension: 0.1,
                    fill: true,
                    pointHoverRadius: 3,
                    pointHoverBackgroundColor: '#84CC16',
                    pointHoverBorderColor: '#FFFFFF',


                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index',
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: '#18181B',
                        titleColor: '#71717A',
                        bodyColor: '#FFFFFF',
                        borderColor: '#27272A',
                        borderWidth: 1,
                        padding: 18,
                        displayColors: false,
                        callbacks: {
                            label: function (context) {
                                return `Rate: ${context.parsed.y.toFixed(4)}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#71717A',
                            /* maxRotation: 0 */
                        }
                    },
                    y: {
                        grid: {
                            color: '#27272A',
                            drawBorder: false,
                            drawTicks: false,

                        },
                        ticks: {
                            color: '#f8f8f8ff',
                            callback: function (value) { return value.toFixed(4); }
                        }
                    }
                }
            }
        })


    }

    async function updatestats(todayDate) {
        const today = todayDate ? new Date(todayDate) : new Date();
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);

        const yesterdayStr = yesterday.toISOString().split('T')[0];

        try {
            const response = await fetch(`${API_BASE_URL}/rate/${currentFromCurrency}/${currentToCurrency}?date=${yesterdayStr}`);
            if (!response.ok) {
                throw new Error('Failed to fetch yesterday\'s rate');
            }

            const data = await response.json()

            const openRate = data.rate || currentExchangeRate;

            const change = currentExchangeRate - openRate;
            const percentChange = openRate > 0 ? (change / openRate) * 100 : 0;

            document.getElementById('open-stat').textContent = openRate.toFixed(5);
            document.getElementById('last-stat').textContent = currentExchangeRate.toFixed(5);

            const changeElement = document.getElementById('change-stat');
            const percentElement = document.getElementById('percent-stat');

            changeElement.textContent = (change >= 0 ? '+' : '') + change.toFixed(5);
            percentElement.textContent = (percentChange >= 0 ? '+' : '') + percentChange.toFixed(3) + '%';

            const changeClassName = change >= 0 ? 'stat-value positive' : 'stat-value negative';
            changeElement.className = changeClassName;
            percentElement.className = changeClassName;

        } catch (error) {
            console.log('failed to fetch stats', error);
        }
    }

    document.querySelector('.favorite-btn').addEventListener('click', () => {
        const pair = `${currentFromCurrency}/${currentToCurrency}`;
        if (!favorites.includes(pair)) {
            favorites.push(pair);
            localStorage.setItem('fx_favorites', JSON.stringify(favorites));
            updateBadges();
            renderFavorites()
            showToast(`Added ${pair} to Favorites!`);
        }

    });
    document.querySelector('.log-btn').addEventListener('click', () => {
        const logEntry = {
            from: currentFromCurrency,
            to: currentToCurrency,
            amount: amountInput.value,
            result: receiveInput.value,
            rate: currentExchangeRate,
            date: new Date().toISOString()
        };
        logs.push(logEntry)
        localStorage.setItem('fx_logs', JSON.stringify(logs))
        updateBadges();
        showToast(`Added ${currentFromCurrency}/${currentToCurrency} to logs!`)
    })


    function updateBadges() {
        favoriteBadge.textContent = favorites.length;
        logBadge.textContent = logs.length;

    }
    /* Navigation tabs */
    const tabButtons = document.querySelectorAll('.tab-btn');
    const viewSections = document.querySelectorAll('.view');

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // 1. Remove 'active' class from all buttons
            tabButtons.forEach(b => b.classList.remove('active'));

            // 2. Add 'active' class to the clicked button
            btn.classList.add('active');

            // 3. Hide all views
            viewSections.forEach(view => view.classList.remove('active-view'));

            // 4. Get the target view from the button's data-target attribute
            const targetId = btn.getAttribute('data-target');
            const targetView = document.getElementById(targetId);

            // 5. Show the target view
            if (targetView) {
                targetView.classList.add('active-view');
            }
            if (targetId === 'favorites-view') {
                renderFavorites();
            }
        });
    });

    /* =============================
    COMPARE CURRENCIES
    ===========================*/
    const compareListEl = document.getElementById('compare-list');

    const compareTargets = ['EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'INR'];
    const TotalPairs = document.getElementById('total-pairs-value')

    async function fetchCompareRates() {
        const validTargets = compareTargets.filter(c => c !== currentFromCurrency);
        const amount = parseFloat(amountInput.value) || 0;

        // Update the Header text dynamically
        document.getElementById('compare-base-amount').textContent = amount.toLocaleString();
        document.getElementById('compare-base-currency').textContent = currentFromCurrency;

        compareListEl.innerHTML = '<p style="color: var(--neutral-500); text-align: center;">Loading rates...</p>';

        try {
            // Fetch all currency rates simultaneously using Promise.all
            const fetchPromises = validTargets.map(code => {
                const url = `https://api.frankfurter.dev/v2/rate/${currentFromCurrency}/${code}`;
                return fetch(url)
                    .then(res => {
                        if (!res.ok) throw new Error(`Failed for ${code}`);
                        return res.json().then(d => ({ code, rate: d.rate })); // Extract d.rate
                    });
            });

            // Wait for all fetches to finish
            const results = await Promise.all(fetchPromises);

            compareListEl.innerHTML = '';

            results.forEach(({ code, rate }) => {
                if (!rate) return;

                const convertedAmount = (amount * rate).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                });


                const currency = Currencies.find(c => c.code === code);
                const flag = currency ? currency.flag : '';
                const name = currency ? currency.name : '';

                const pairString = `${currentFromCurrency}/${code}`;
                const isPinned = favorites.includes(pairString);

                const row = document.createElement('div');
                row.className = `compare-row ${isPinned ? 'pinned' : ''}`;
                row.innerHTML = `
                <div class="compare-row-left">
                    <span class="flag">${flag}</span>
                    <div class="compare-currency-info">
                        <span class="code">${code}</span>
                        <span class="name">${name}</span>
                    </div>
                </div>
                <div class="compare-row-right">
                    <div class="converted-group">
                        <span class="compare-converted">${convertedAmount}</span>
                        <span class="compare-rate">1 ${currentFromCurrency} = ${rate.toFixed(4)} ${code}</span>
                    </div>
                    <button class="pin-btn ${isPinned ? 'active' : ''}" data-pair="${pairString}">
                        <svg xmlns="http://www.w3.org/2000/svg" height="22px" viewBox="0 -960 960 960" width="22px" fill="currentColor">
                            <path d="M333.33-259 480-347l146.67 89-39-166.67 129-112-170-15L480-709l-66.67 156.33-170 15 129 112.34-39 166.33ZM233-120l65-281L80-590l288-25 112-265 112 265 288 25-218 189 65 281-247-149-247 149Zm247-353.33Z"/>
                        </svg>
                    </button>
                </div>
            `;

                row.querySelector('.pin-btn').addEventListener('click', (e) => {
                    const btn = e.currentTarget;
                    const pair = btn.getAttribute('data-pair');

                    if (favorites.includes(pair)) {
                        favorites = favorites.filter(f => f !== pair);
                        btn.classList.remove('active');
                        row.classList.remove('pinned');
                        showToast(`${pair}  removed from Favorites!`, 'error');
                    } else {
                        favorites.push(pair);
                        btn.classList.add('active');
                        row.classList.add('pinned');
                        showToast(`${pair}  Added to Favorites!`, 'success');
                    }

                    localStorage.setItem('fx_favorites', JSON.stringify(favorites));
                    updateBadges();
                });

                compareListEl.appendChild(row);
                TotalPairs.textContent = validTargets.length;
            });
        } catch (error) {
            console.error("Failed to fetch compare rates:", error);
            compareListEl.innerHTML = '<p style="color: var(--red-500); text-align: center;">Failed to load rates.</p>';
        }
    }

    /* =============================
    FAVORITE SECTION
    ============================== */

    async function renderFavorites() {
        const favoriteCount = document.querySelector('.favorites-count')
        const favoritesList = document.querySelector('.favorites-list')

        const pairs = favorites.map(f => {
            const [currentFromCurrency, currentToCurrency] = f.split('/')
            return { currentFromCurrency, currentToCurrency }
        })

        console.log(pairs);

        //lets get yesterday's date
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        const yesterdayFormatted = yesterday.toISOString().split('T')[0];
        console.log(yesterdayFormatted);
        try {
            // const histUrl = `https://api.frankfurter.dev/v2/rate/${currentFromCurrency}/${currentToCurrency}?date=${yesterdayFormatted}`;

            // const data = await fetch(histUrl).then(res => res.json());

            // console.log(data.date);

            const fetchPromises = pairs.map(pair => {
                const { currentFromCurrency: from, currentToCurrency: to } = pair
                const liveUrl = `https://api.frankfurter.dev/v2/rate/${from}/${to}`;
                const histUrl = `https://api.frankfurter.dev/v2/rate/${from}/${to}?date=${yesterdayFormatted}`;
                return Promise.all([
                    fetch(liveUrl).then(res => res.json()).then(d => d.rate || null).catch(() => null),
                    fetch(histUrl).then(res => res.json()).then(d => {
                        // console.log('Historical API response:', d);

                        return d.rate || d.rates?.[to] || null;
                    })

                ]).then(([liveRate, oldRate]) => ({
                    from,
                    to,
                    liveRate,
                    oldRate,
                }))
            })
            const result = await Promise.all(fetchPromises)
            console.log(result, 'results');

            favoritesList.innerHTML = "";

            result.forEach(data => {

                const { from, to, liveRate, oldRate } = data;
                //console.log(from, to, liveRate, oldRate);

                const change = oldRate ? (liveRate - oldRate) : 0;
                const percentageChange = oldRate ? ((change / oldRate) * 100).toFixed(2) : 0;
                const isPositive = change >= 0;

                // console.log(`${from}/${to} | Live: ${liveRate} | Old: ${oldRate} | Change: ${change} | %: ${percentageChange} | Positive: ${isPositive}`)

                const row = document.createElement('div')
                row.className = "favorite-row";
                row.innerHTML = `
                <div class="fav-pair">
                    <span class="fav-base">${from}</span>
                    <span class="fav-separator">-</span>
                    <span class="fav-quote">${to}</span>
                </div>
                <div class="fav-data">
                    <span class="fav-rate">${liveRate.toFixed(4)}</span>
                    <span class="fav-change ${isPositive ? 'positive' : 'negative'}">
                        ${isPositive ? '▲' : '▼'} ${Math.abs(percentageChange)}%
                    </span>
                </div>
                <button class="unpin-btn" title="Unpin from Favorites">
                    <svg xmlns="http://www.w3.org/2000/svg" height="22px" viewBox="0 -960 960 960" width="22px" fill="currentColor">
                        <path d="m233-120 65-281L80-590l288-25 112-265 112 265 288 25-218 189 65 281-247-149-247 149Z"/>
                    </svg>
                </button>
            `;
                row.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (e.target.closest('.unpin-btn')) return;

                    // Strictly using our established variables!
                    currentFromCurrency = from;
                    currentToCurrency = to;

                    updateButtonUI(fromBtn, from);
                    updateButtonUI(toBtn, to);

                    fetchLiveRate();
                    fetchHistoryData();
                    fetchCompareRates();

                    // Switch back to the HISTORY tab
                    document.querySelector('.tab-btn[data-target="history-view"]').click();

                })
                row.querySelector('.unpin-btn').addEventListener('click', (e) => {
                    e.stopPropagation();
                    favorites = favorites.filter(f => f !== `${from}/${to}`);
                    localStorage.setItem('fx_favorites', JSON.stringify(favorites));
                    showToast(`${from} & ${to}  removed from Favorites!`, `error`);
                    updateBadges();
                    renderFavorites();
                    fetchCompareRates()


                })
                favoritesList.appendChild(row);
            })



        } catch (error) {

            console.error("Failed to fetch favorites:", error)

        }

    }





})

