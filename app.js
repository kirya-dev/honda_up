/**
* Author: Matasov Kirill
*/

document.addEventListener('DOMContentLoaded', init)

function init() {
	const applyBtn = document.querySelector('#applyBtn')
	const inputFile = document.querySelector('#inputFile')
	const swapHighLowCheckbox = document.querySelector('#swapHighLowCheckbox')

	let data, lastFilename

	inputFile.addEventListener('change', () => {
		const file = inputFile.files[0]

		if (file.size != 2048) {
			output.innerHTML = '<err>Неверная длина файла ' + file.size + ' байт.</err>'
			return
		}

		const fr = new FileReader()
		fr.onload = function(evt) {
			data = new Uint8Array(fr.result)

			inputFile.disabled = 'disabled'
			swapHighLowCheckbox.disabled = 'disabled'
			
			if (swapHighLowCheckbox.checked) {
				data = doSwapHighLow(data)
			}

			lastFilename = file.name
			initWithData(data)
		}

		fr.readAsArrayBuffer(file)
	})

	applyBtn.addEventListener('click', () => {
		const SERVICES = {
			language: languageAlgo, 
			temperature: temperatureAlgo,
			mileage: mileageAlgo,
		}
		for (let checkboxId of Object.keys(SERVICES)) {
			if (document.querySelector(`#${checkboxId}Checkbox`).checked) {
				data = SERVICES[checkboxId].makeBetter(data)
			}
		}

		// Перед записью инвертируем байты если нужно
		if (swapHighLowCheckbox.checked) {
			data = doSwapHighLow(data)
		}

		downloadBlob(data, lastFilename)
	})
}

function initWithData(data) {
	output.innerHTML = 'Контрольная сумма: ' + checksumAlgo.getStatus(data)
	output.innerHTML+= '<br>Ед. изм. температуры: ' + temperatureAlgo.getStatus(data)
	output.innerHTML+= '<br>Язык: ' + languageAlgo.getStatus(data)
	output.innerHTML+= '<br>Пробег: ' + mileageAlgo.getStatus(data)
	output.innerHTML+= '<br>P/N: ' + partNumberAlgo.getStatus(data)
}


function downloadBlob(data, fileName) {
	const blob = new Blob([data], {type: 'application/octet-binary'})
	const url = window.URL.createObjectURL(blob)

	saveBlobToFile(blob, fileName)
}


function saveBlobToFile(blob, filename) {
	const a = document.createElement('a')
	document.body.appendChild(a)
	const url = window.URL.createObjectURL(blob)
	a.href = url
	a.download = filename
	a.click()
	setTimeout(() => {
		window.URL.revokeObjectURL(url)
		document.body.removeChild(a)
	}, 0)
}
