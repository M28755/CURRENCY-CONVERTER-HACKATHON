# App State Variables

SET allCurrencies = []
SET currentFromCurrency = 'USD'
SET currentToCurrency = 'EUR'
SET currentExchangeRate = 0
SET activePickerTarget = null
SET historyChart = null

LOAD from localStorage:
  - favorites = JSON.parse('fx_favorites') or []
  - logs = JSON.parse('fx_logs') or []

DEFINE popularCodes = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF']

# DOM References
Get references to all UI elements:
  - Currency buttons (fromBtn, toBtn)
  - Swap button (swapBtn)
  - Input fields (amountInput, receiveInput)
  - Rate display (rateSubtext)
  - Dropdown elements
  - Stats boxes
  - Chart canvas
  - Badge elements

# fetching API Function 

1. FETCH currencies from API:
   GET ${API_BASE}/currencies
   
2. PROCESS response:
   FOR EACH currency in data:
     CREATE object:
       - code: currency key
       - name: currency value
       - flag: getFlagEmoji(code)
       - popular: code in popularCodes
   
3. UPDATE header:
   - totalCurrencySpan.textContent = allCurrencies.length
   
4. UPDATE button UI:
   - updateButtonUI(fromBtn, 'USD')
   - updateButtonUI(toBtn, 'EUR')
   
5. RENDER currency list:
   - renderCurrencyList()
   
6. UPDATE badges:
   - updateBadges()
   
7. FETCH live rates:
   - fetchLiveRates()
   
8. FETCH history data:
   - fetchHistoryData()



# Currency Dropdown System
# 1. Rendering Currency list
1. CLEAR popularList and otherList containers
2. CONVERT filter to lowercase

3. FOR EACH currency in allCurrencies:
   
   a. CHECK if currency matches filter:
      IF currency.code OR currency.name contains filter:
         CONTINUE
      ELSE:
         SKIP this currency
   
   b. CREATE row element:
      - className = 'currency-row'
      - IF selected: add 'selected' class
   
   c. SET innerHTML:
      - flag: ${currency.flag}
      - code: ${currency.code}
      - name: ${currency.name}
      - check icon: ✓ (if selected)
   
   d. ADD click listener:
      - CALL handleCurrencySelect(currency)
   
   e. APPEND to appropriate list:
      IF currency.popular:
         popularList.appendChild(row)
      ELSE:
         otherList.appendChild(row)



# 2. handle currency selection

1. IF activePickerTarget === 'from':
     SET currentFromCurrency = currency.code
     CALL updateButtonUI(fromBtn, currency.code)
   
2. ELSE IF activePickerTarget === 'to':
     SET currentToCurrency = currency.code
     CALL updateButtonUI(toBtn, currency.code)

3. CLOSE dropdown:
   - dropdown.style.display = 'none'
   - searchInput.value = ''

4. FETCH new rates:
   - CALL fetchLiveRates()


# 3. Toggle the dropdown menu
 1. SET activePickerTarget = target
2. CLEAR searchInput.value = ''
3. RENDER currency list: renderCurrencyList()
4. TOGGLE dropdown visibility:
   IF dropdown is hidden:
     SHOW dropdown
     FOCUS search input
   ELSE:
     HIDE dropdown


# CURRENCY CONVERSION CORE

# 1. fetching live rate 
 
 1. FETCH latest rates:
   GET ${API_BASE}/rate/{currentFromCurrency}/{currentToCurrency}

2. EXTRACT rate:
   currentExchangeRate = data.rates[currentToCurrency]

3. UPDATE UI:
   - rateSubtext.textContent = `1 ${from} = ${rate.toFixed(4)} ${to}`
   - CALL calculateConversion()
   - CALL updateStats(data.date)

4. HANDLE errors:
   IF error → console.error()


# 2. calculating conversion
 1. GET amount from amountInput:
   amount = parseFloat(amountInput.value) or 0

2. CALCULATE converted amount:
   convertedAmount = (amount * currentExchangeRate).toFixed(2)

3. UPDATE receiveInput:
   receiveInput.value = convertedAmount


# Statistics & History

# 1. updateStats(todayDate) Algorithm
1. CALCULATE yesterday's date:
   yesterday = todayDate - 1 day

2. FETCH yesterday's rate:
   GET ${API_BASE}/${yesterdayStr}?base=${from}&symbols=${to}

3. EXTRACT openRate:
   openRate = data.rates[currentToCurrency] or currentExchangeRate

4. CALCULATE change:
   change = currentExchangeRate - openRate
   percentChange = (change / openRate) * 100

5. UPDATE stats boxes:
   - Open: openRate.toFixed(4)
   - Last/Current: currentExchangeRate.toFixed(4)
   - Change: (change >= 0 ? '+' : '') + change.toFixed(4)
   - Change %: (percentChange >= 0 ? '+' : '') + percentChange.toFixed(2) + '%'

6. COLOR code:
   IF change >= 0:
     Apply 'positive' class (green)
   ELSE:
     Apply 'negative' class (red)


# 2. fetchHistoryData() Algorithm:
1. SET date range:
   endDate = today
   startDate = today - 30 days

2. FETCH historical rates:
   GET ${API_BASE}/${startStr}..${endStr}?base=${from}&symbols=${to}

3. EXTRACT data:
   chartLabels = Object.keys(data.rates)  // Dates
   chartData = chartLabels.map(date => data.rates[date][to])

4. RENDER chart:
   CALL renderChart(chartLabels, chartData)


# 3. renderChart(labels, data) Algorithm:
1. GET canvas context:
   ctx = document.getElementById('history-chart').getContext('2d')

2. DESTROY existing chart:
   IF historyChart exists:
     historyChart.destroy()

3. CREATE new Chart.js instance:
   type: 'line'
   data:
     labels: labels
     datasets: [{
       label: `${from}/${to}`
       data: data
       borderColor: '#84CC16'
       backgroundColor: 'rgba(132, 204, 22, 0.1)'
       borderWidth: 2
       pointRadius: 0
       tension: 0.1
     }]
   options:
     responsive: true
     maintainAspectRatio: false
     plugins: { legend: { display: false } }
     scales: {
       x: { grid: { display: false }, ticks: { color: '#71717A' } }
       y: { grid: { color: '#27272A' }, ticks: { color: '#71717A' } }
     }

#  Swap Currencies
1. SWAP currency variables:
   temp = currentFromCurrency
   currentFromCurrency = currentToCurrency
   currentToCurrency = temp

2. UPDATE button UI:
   - updateButtonUI(fromBtn, currentFromCurrency)
   - updateButtonUI(toBtn, currentToCurrency)

3. SWAP input values:
   tempVal = amountInput.value
   amountInput.value = receiveInput.value
   receiveInput.value = tempVal

4. FETCH updated data:
   - CALL fetchLiveRates()
   - CALL fetchHistoryData()


# flag data

# 1. getFlagEmoji(currencyCode) Algorithm:
1. IF currencyCode === 'EUR':
     RETURN '🇪🇺'

2. EXTRACT country code:
   countryCode = currencyCode.substring(0, 2)

3. CONVERT to flag emoji:
   RETURN countryCode.toUpperCase()
          .replace(/./g, char => 
            String.fromCodePoint(127397 + char.charCodeAt())
          )

# 2. updateButtonUI(button, code) Algorithm:

1. FIND currency object:
   currency = allCurrencies.find(c => c.code === code)

2. UPDATE button content:
   - .currency-code: code
   - .flag: currency ? currency.flag : ''