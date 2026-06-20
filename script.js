const API_BASE_URL = "https://corsproxy.io/?url=https://api.frankfurter.dev/v2"

document.addEventListener('DOMContentLoaded', () => {


    //lets get DOM element
    const amountInput = document.getElementById('amount-input')
    const receiveInput = document.getElementById('receive-input')
    const fromBtn = document.getElementById('from-btn')
    const toBtn = document.getElementById('to-btn')
    const swapBtn = document.getElementById('swap-btn')
    const sendAmountInput = document.getElementById('amount-input')
    const receiveAmountInput = document.getElementById('receive-input')
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

    function handleCurrencySelect(currency) {
        if (activePickerTarget === 'from') {
            currentFromCurrency = currency.code;
            updateButtonUI(fromBtn, currency.code)
        } else if (activePickerTarget === 'to') {
            currentToCurrency = currency.code
            updateButtonUI(toBtn, currency.code)
        }
        //close dropdown when the currency is clicked
        dropDown.style.display = 'none'

        searchbar.value = ''
        fetchLiveRate()

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

        console.log(receiveInput.value)
        console.log(amountInput.value)
    }

    //fetching history data
    async function fetchHistoryData() {
        const endDate = new Date()
        const startDate = new Date()
        startDate.setDate(endDate.getDate() - 30)

        const formattedStartDate = startDate.toISOString().split('T')[0]
        const formattedEndDate = endDate.toISOString().split('T')[0]

        console.log(`${formattedStartDate} --- ${formattedEndDate}`)
        try {
            const res = await fetch(`${API_BASE_URL}/rates?from=${formattedStartDate}&to=${formattedEndDate}&base=${currentFromCurrency}&quotes=${currentToCurrency}`)


            if (!res.ok) {
                throw new Error('Failed to fetch history data')
            }

            const data = await res.json()
            console.log(data)
            const chartLabels = data.map(item => item.date);
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
                    pointRadius: 2,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { display: false }, ticks: { color: '#71717A' } },
                    y: { grid: { color: '#27272A' }, ticks: { color: '#f8f8f8ff' } }
                }
            }
        })


    }




})

