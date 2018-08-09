import moment from 'moment';
import plots from './data/plot.json';

const loadPlots = (day) => new Promise(r => {
	const markerPlots = [];
	let data = plots.filter(x => moment(x.time).format('YYYY-MM-DD') === day );
	if(data.length){
		Array.from(data).forEach((plot) => {
			const d = new Date(plot.time);
			const marker = new google.maps.Marker({
				position: new google.maps.LatLng(plot.lat, plot.lng),
				draggable: false,
				fileNo: plot.id,
				time: d.getHours() * 60 + d.getMinutes(),
				icon: {
					path: google.maps.SymbolPath.CIRCLE,
					scale: 5,
					fillColor: '#F4FF81',
					fillOpacity: 1,
					strokeWeight: 0.4
				}
			});
			markerPlots.push(marker);
		});
	}
	r(markerPlots);

});

export {
	loadPlots
};
