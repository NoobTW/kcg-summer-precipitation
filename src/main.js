import { feature } from 'topojson';
import $ from 'jquery';
import moment from 'moment';
import topoKaohsiung from  './data/kaohsiung.topo';
import { loadPlots } from './timelineMaps';
import { loadWeek } from './comparison';

let map;
let mapRain;
let mapPlot;
let listener1;
let listener2;
let markerPlots = [];
let intervalTimeline;

moment.suppressDeprecationWarnings = true;

$('#calendar').on('change', async () => {
	resetTimeline();
	markerPlots = await loadPlots(moment($('#calendar').val()).format('YYYY-MM-DD'));
	$('#data-count').text(`共 ${markerPlots.length} 筆資料`);
	startTimeline();
	$('#calendar-comparison').val($('#calendar').val());
});
$('#calendar-comparison').on('change', async () => {
	loadComparisonMap($('#calendar-comparison').val());
	$('#calendar').val($('#calendar-comparison').val());
});

const initMap = async () => {
	const styles = [{"featureType":"administrative","elementType":"all","stylers":[{"visibility":"off"}]},{"featureType":"landscape","elementType":"all","stylers":[{"visibility":"simplified"},{"hue":"#0066ff"},{"saturation":74},{"lightness":100}]},{"featureType":"poi","elementType":"all","stylers":[{"visibility":"simplified"}]},{"featureType":"road","elementType":"all","stylers":[{"visibility":"simplified"}]},{"featureType":"road.highway","elementType":"all","stylers":[{"visibility":"off"},{"weight":0.6},{"saturation":-85},{"lightness":61}]},{"featureType":"road.highway","elementType":"geometry","stylers":[{"visibility":"on"}]},{"featureType":"road.arterial","elementType":"all","stylers":[{"visibility":"off"}]},{"featureType":"road.local","elementType":"all","stylers":[{"visibility":"on"}]},{"featureType":"transit","elementType":"all","stylers":[{"visibility":"simplified"}]},{"featureType":"water","elementType":"all","stylers":[{"visibility":"simplified"},{"color":"#5f94ff"},{"lightness":26},{"gamma":5.86}]}];
	map = new google.maps.Map(document.getElementById('map'), {
		center: {lng: 120.5786888, lat: 22.9185024},
		zoom: 10,
		styles,
		disableDefaultUI: true
	});
	mapRain = new google.maps.Map(document.getElementById('map_rain'), {
		center: {lng: 120.301956, lat: 22.631388},
		zoom: 11,
		styles,
		disableDefaultUI: true
	});
	mapPlot = new google.maps.Map(document.getElementById('map_plot'), {
		center: {lng: 120.301956, lat: 22.631388},
		zoom: 11,
		styles,
		disableDefaultUI: true
	});
	const geoJson = feature(topoKaohsiung, topoKaohsiung.objects.kaohsiung);
	map.data.addGeoJson(geoJson);
	mapRain.data.addGeoJson(geoJson);
	mapPlot.data.addGeoJson(geoJson);

	markerPlots = await loadPlots('2017-03-31');

	$('#calendar').val('2017-03-31');
	$('#calendar-comparison').val('2017-04-01');
	startTimeline();
	loadComparisonMap('2017-04-01');

	mapRain.addListener('mouseover', function() {
		google.maps.event.removeListener(listener2);
		listener1 = google.maps.event.addListener(mapRain, 'bounds_changed', (function() {
			mapPlot.setCenter(mapRain.getCenter());
			mapPlot.setZoom(mapRain.getZoom());
		}));
	});

	mapPlot.addListener('mouseover', function() {
		google.maps.event.removeListener(listener1);
		listener2 = google.maps.event.addListener(mapPlot, 'bounds_changed', (function() {
			mapRain.setCenter(mapPlot.getCenter());
			mapRain.setZoom(mapPlot.getZoom());
		}));
	});

}

const loadComparisonMap = async (day) => {
	const results = await loadWeek(day);
	$('#data-count-comparison').text(`${results.firstDay} ~ ${results.lastDay} 的雨量與坑洞通報狀況`);
	mapPlot.data.setStyle((feature) => {
		const featureName = feature.f.T_Name.slice(0, -1);
		if(featureName in results.plotCount){
			feature.setProperty('isColorful', true);
			return {
				fillColor: results.plotCount[featureName].color,
				fillOpacity: 0.8,
			};
		}
		return {fillColor: 'white'}
	});
	mapRain.data.setStyle((feature) => {
		const featureName = feature.f.T_Name.slice(0, -1);
		if(featureName in results.precipitationCount){
			feature.setProperty('isColorful', true);
			return {
				fillColor: results.precipitationCount[featureName].color,
				fillOpacity: 0.8,
			};

		}
		return {fillColor: 'white'}
	});

	let arrPlot = [];
	let arrRain = [];
	Object.keys(results.plotCount).forEach(c => { arrPlot.push(c) });
	Object.keys(results.precipitationCount).forEach(c => { arrRain.push(c) });
	arrPlot = arrPlot.sort((a, b) => results.plotCount[b].value - results.plotCount[a].value);
	arrRain = arrRain.sort((a, b) => results.precipitationCount[b].value - results.precipitationCount[a].value);

	$('#table_plot').html('');
	$('#table_plot').append(`<tr><td>行政區</td><td>通報數量</td></tr>`)
	Array.from(arrPlot).forEach(p => {
		$('#table_plot').append(`
		<tr>
			<td><div class="block" style="background: ${results.plotCount[p].color};"></div> ${p}區</td>
			<td>${results.plotCount[p].value}</td>
		</tr>
		`)
	});
	$('#table_rain').html('');
	$('#table_rain').append(`<tr><td>行政區</td><td>降雨量</td></tr>`)
	Array.from(arrRain).forEach(p => {
		$('#table_rain').append(`
		<tr>
			<td><div class="block" style="background: ${results.precipitationCount[p].color};"></div> ${p}區</td>
			<td>${results.precipitationCount[p].value}</td>
		</tr>
		`)
	});
}

function startTimeline(){
	const speed = ~~$('.timeline-speed').text().slice(0, -1);
	$('.timeline-play').html('<i class="fas fa-pause" />');
	if(intervalTimeline) clearInterval(intervalTimeline);
	intervalTimeline = setInterval(function(){
		const n = $('.timeline input').val();
		$('.timeline input').val(~~n + 5);
		$('.timeline input').change();
	}, 1000 / speed);
	$('.timeline-play').off('click');
	$('.timeline-play').on('click', function(){stopTimeline()});
}

const stopTimeline = () => {
	$('.timeline-play').html('<i class="fas fa-play" />');
	if(intervalTimeline) clearInterval(intervalTimeline);
	$('.timeline-play').on('click', function(){startTimeline()});
}

const resetTimeline = () => {
	stopTimeline();
	if(markerPlots.length){
		markerPlots.forEach(m => { m.setMap(null) });
	}
	// $('.timeline input').val(new Date().getHours() * 60 + new Date().getMinutes());
	// $('.timeline-now').text(moment(new Date()).format('HH:mm'));
	$('.timeline input').val(0);
	$('.timeline-now').text('00:00');
}

$('.timeline-play').on('click', () => { startTimeline(1) });
$('.timeline-fast').on('click', () => {
	let speed = ~~$('.timeline-speed').text().slice(0, -1);
	if(speed < 16) speed *= 2;
	$('.timeline-speed').text(speed + 'x');
	stopTimeline();
	startTimeline();
});
$('.timeline-slow').on('click', () => {
	let speed = ~~$('.timeline-speed').text().slice(0, -1);
	if(speed > 1) speed /= 2;
	$('.timeline-speed').text(speed + 'x');
	stopTimeline();
	startTimeline();
});
$('.timeline input').on('change', async function(){
	const range = $(this).val();
	markerPlots.filter(x => x.time <= range).forEach((m) => {
		if(m.map !== map) m.setMap(map);
	});
	markerPlots.filter(x => x.time > range).forEach((m) => {
		m.setMap(null);
	});
	const n = $('.timeline input').val();
	let hh = Math.floor(n / 60);
	if(hh < 10) hh = '0' + hh;
	let mm = Math.floor(n % 60);
	if(mm < 10) mm = '0' + mm;

	$('.timeline input').val(~~n + 1);
	$('.timeline-now').text(hh + ':' + mm);

	if($('.timeline-now').text() === '23:59'){
		resetTimeline();
		$('#calendar').val(moment($('#calendar').val()).add(1, 'day').format('YYYY-MM-DD'));
		markerPlots = await loadPlots($('#calendar').val());
		$('#data-count').text(`共 ${markerPlots.length} 筆資料`);
		startTimeline();
	}
});

const showSection = (k) => {
	$('section').hide();
	$(`#${k}`).fadeIn('fast');
};

$('nav ul li').on('click', function(){
	showSection($(this).data('to'));
});

window.initMap = initMap;
