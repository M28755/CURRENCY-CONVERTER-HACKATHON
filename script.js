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
    const rateSubtext = document.getElementById('rate-subtext')

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

            Currencies = Object.keys(data).map((code) => ({
                code: code,
                name: data[code],
                popular: popularCurrencies.includes(code)
            }))
            // console.log(Currencies)

            //update total currencies
            totalCurrencies.textContent = Currencies.length

            //  console.log(totalCurrencies.textContent)

            renderCurrencyList();


        } catch (error) {

            console.log('error fetching data', error)

        }

    }

    ApiFetch();

    //currency dropdown
    function renderCurrencyList() {
        popularList.innerHTML = '';
        otherList.innerHTML = '';

        const lowerCaseFilter = filter.toLowerCase();

    }


})

