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
			checksum: checksumAlgo, // Обязательно в конце вычисление КС
		}
		for (let wrapperId of Object.keys(SERVICES)) {
			const wrapper = document.querySelector(`#${wrapperId}Wrapper`)

			if (wrapper.querySelector(`input[type=checkbox]`).checked) {
				data = SERVICES[wrapperId].makeBetter(data)
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
	const SERVICES = {
		checksum: checksumAlgo,
		language: languageAlgo,
		temperature: temperatureAlgo,
		mileage: mileageAlgo,
		partNumber: partNumberAlgo,
	}

	for (let wrapperId of Object.keys(SERVICES)) {
		const status = SERVICES[wrapperId].getStatus(data)

		const wrapper = document.querySelector(`#${wrapperId}Wrapper`)
		wrapper.style.display = 'block'
		wrapper.innerHTML = `<status>${status}</status> ${wrapper.innerHTML}`
	}

	document.querySelector(`#applyWrapper`).style.display = 'block'
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
