const API_BASE_URL = "https://corsproxy.io/?url=https://api.frankfurter.dev/v2"

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
            console.log(currency.code)
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
    });



    //Fetching Live Rates & Update Converter
    async function fetchLiveRate() {
        try {
            const res = await fetch(`${API_BASE_URL}/rate/${currentFromCurrency}/${currentToCurrency}`);

            const data = await res.json()

            console.log(data)

            currentExchangeRate = data.rate;
            console.log(currentExchangeRate)

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

        console.log(`${formattedStartDate} --- ${formattedEndDate}`)
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
        console.log(firstRate)
        const percentageChange = (((latestRate - firstRate) / firstRate) * 100).toFixed(2)
        //console.log(`+${percentageChange}`)
        const ChangeElement = document.getElementById('chart-change')

        ChangeElement.textContent = (percentageChange >= 0 ? '+' : '') + `${percentageChange}` + '%'
        if (percentageChange >= 0) {
            ChangeElement.className = 'positive'
        } else {
            ChangeElement.className = 'negative'
        }

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

            // data.rate is a plain NUMBER from the API: { rate: 0.87044 }
            const openRate = data.rate || currentExchangeRate;

            const change = currentExchangeRate - openRate;             // keep as number for math
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
    // --- 11. Tab Navigation Toggle ---
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
        });
    });




})

