import chroma from 'chroma-js';
import moment from 'moment';
import compare from './data/compare';

const loadWeek = (day) => new Promise(r => {
	let firstDay = moment(day).day(0)
	let lastDay = moment(day).day(6);



	let results = compare.filter(x => {
		return moment(x.time).unix() >= firstDay.unix() && moment(x.time).unix() <= lastDay.unix();
	});

	let maxPlot = Number.MIN_SAFE_INTEGER;
	let minPlot = Number.MAX_SAFE_INTEGER;
	let plotCount = results.reduce((obj, d) => {
		if(obj[d.district]){
			obj[d.district] += ~~d.plot;
		}else{
			obj[d.district] = ~~d.plot;
		}
		if(obj[d.district] > maxPlot) maxPlot = obj[d.district];
		if(obj[d.district] < minPlot) minPlot = obj[d.district];
		return obj;
	}, {});
	let maxPrecipitation = Number.MIN_SAFE_INTEGER;
	let minPrecipitation = Number.MAX_SAFE_INTEGER;
	let precipitationCount = results.reduce((obj, d) => {
		if(obj[d.district]){
			obj[d.district] += Number.parseFloat(d.precipitation);
		}else{
			obj[d.district] = Number.parseFloat(d.precipitation);
		}
		if(obj[d.district] > maxPrecipitation) maxPrecipitation = obj[d.district];
		if(obj[d.district] < minPrecipitation) minPrecipitation = obj[d.district];
		return obj;
	}, {});

	let scale = chroma.scale(['#FFEBEE', '#B71C1C']).domain([minPlot, maxPlot]);
	Object.keys(plotCount).forEach(p => {
		plotCount[p] = {
			value: plotCount[p],
			color: scale(plotCount[p]).hex(),
		};

	});
	scale = chroma.scale(['#E3F2FD', '#0D47A1']).domain([minPrecipitation, maxPrecipitation]);
	Object.keys(precipitationCount).forEach(p => {
		precipitationCount[p] = {
			value: precipitationCount[p],
			color: scale(precipitationCount[p]).hex(),
		};
	});

	r({
		firstDay: firstDay.format('MM/DD'),
		lastDay: lastDay.format('MM/DD'),
		plotCount,
		precipitationCount
	});
});

export {
	loadWeek,
};
