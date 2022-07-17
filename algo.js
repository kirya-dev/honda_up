/**
* Author: Matasov Kirill
*/


const checksumAlgo = {
	getStatus(data) {
		const reals = []
		const computeds = []

		// Каждый 10й байт - Контрольная сумма XOR
		for (let offset of [0, 10, 20, 30]) {
			reals.push(data[offset + 9].toHex())

			let computed = 0xFF
			for (let byte of data.slice(offset, offset + 8)) {
				computed ^= byte
			}

			computeds.push(computed.toHex())
		}

		const tag = isArrayEquals(reals, computeds) ? 'ok' : 'err'

		return `<${tag}>В файле ${reals.join(', ')}, Вычисл. ${computeds.join(', ')}</${tag}>`
	},

	recalc(data) {
		// Каждый 10й байт - Контрольная сумма XOR
		for (let offset of [0, 10, 20, 30]) {
			let computed = 0xFF
			for (let byte of data.slice(offset, offset + 8)) {
				computed ^= byte
			}

			data[offset + 9] = computed
		}

		// todo data[40] = ?

		return data
	},
}


const temperatureAlgo = {
	ADDR: 0x00,

	getStatus(data) {
		const byte = data[this.ADDR]
		switch (byte) {
			case 0x5A:
			case 0x69: return `<ok>Цельсии ${byte.toHex()}</ok>`
			case 0x65:
			case 0x66: return `<err>Фаренгейты ${byte.toHex()}</err>`
			default: return `<err>Не известно ${byte.toHex()}</err>`
		}
	},

	makeBetter(data) {
		data[this.ADDR] = 0x69

		return checksumAlgo.recalc(data)
	},
}


const languageAlgo = {
	ADDR_0: 0x02,
	ADDR_1: 0x20,

	getStatus(data) {
		const byte = data[this.ADDR_1]
		switch (byte) {
			case 0x00: return `<err>Китайский ${byte.toHex()}</err>`
			case 0x01: return `<ok>Русский ${byte.toHex()}</ok>`
			case 0x05: return `<err>Английский ${byte.toHex()}</err>`
			case 0x08: return `<err>Французский ${byte.toHex()}</err>`
			case 0x0A: return `<err>Арабский ${byte.toHex()}</err>`
			default: return `<err>Не известно ${byte.toHex()}</err>`
		}
	},

	makeBetter(data) {
		data[this.ADDR_0] = 0x55
		data[this.ADDR_1] = 0x01

		return checksumAlgo.recalc(data)
	},
}


const mileageAlgo = {
	MILIAGE_IN_1_KM: 1.609344,
	ADDR: 0x1D8,
	COUNTS: 32,

	getStatus(data) {
		let summary = 0

		let index = 0
		while (index < this.COUNTS) {
			let val = data[this.ADDR + index*2] << 8
			val = val + data[this.ADDR + index*2 + 1]
			if (index % 2) {
				val ^= 0xFFFF // инвертирование NOT
			}
			summary += val
			index++
		}

		const summaryInKm = Math.round(summary * this.MILIAGE_IN_1_KM)

		return `<ok>${summaryInKm} km (${summary} miles)</ok>`
	},

	makeBetter(data) {
		let newMileage = document.querySelector('#newMileageInput').value

		newMileage = Math.round(newMileage / this.MILIAGE_IN_1_KM)
		newMileage /= this.COUNTS

		let index = 0
		while (index < this.COUNTS) {
			let val = newMileage
			if (index % 2) {
				val ^= 0xFFFF // инвертирование NOT
			}
			data[this.ADDR + index*2] = val >> 8
			data[this.ADDR + index*2 + 1] = val & 0xFF

			index++
		}

		return data
	},
}


const partNumberAlgo = {
	ADDR_0: 0x27A,
	LEN_0: 5,

	ADDR_1: 0x252,
	LEN_1: 9,

	getStatus(data) {
		let pn0 = data.slice(this.ADDR_0, this.ADDR_0 + this.LEN_0)
		let pn1 = data.slice(this.ADDR_1, this.ADDR_1 + this.LEN_1)

		const pn = [
			pn0.toASCII(), // здесь внутренний код приборки
			pn1.slice(0, 3).toASCII(),
			pn1.slice(3, 7).toASCII(),
			pn1.slice(7, 9).toASCII(), // под версия. не является частью PN
		]

		return `<ok>${pn.join('-')}</ok>`
	},
}


Number.prototype.toHex = function() {
	return '0x' + this.toString(16).toUpperCase().padStart(2, '0')
}


Uint8Array.prototype.toASCII = function() {
	return String.fromCharCode(...this)
}


function doSwapHighLow(data) {
	const newData = new Uint8Array(data.length)

	for (const i in data) {
		newData[i] = data[+i + (i % 2 ? -1 : 1)]
	}

	return newData
}


function isArrayEquals(a, b) {
	return JSON.stringify(a) === JSON.stringify(b)
}
