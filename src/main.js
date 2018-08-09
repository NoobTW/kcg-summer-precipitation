import { feature } from 'topojson';
import $ from 'jquery';
import moment from 'moment';
import topoKaohsiung from  './data/kaohsiung.topo';
import { loadPlots } from './timelineMaps';

let map;
let markerPlots = [];
let intervalTimeline;

$('#calendar').on('change', async () => {
	resetTimeline();
	markerPlots = await loadPlots(moment($('#calendar').val()).format('YYYY-MM-DD'));
	$('#data-count').text(`共 ${markerPlots.length} 筆資料`);
	startTimeline();
});

const initMap = async () => {
	map = new google.maps.Map(document.getElementById('map'), {
		center: {lng: 120.5786888, lat: 22.9185024},
		zoom: 10,
		styles: [{"featureType":"administrative","elementType":"all","stylers":[{"visibility":"off"}]},{"featureType":"landscape","elementType":"all","stylers":[{"visibility":"simplified"},{"hue":"#0066ff"},{"saturation":74},{"lightness":100}]},{"featureType":"poi","elementType":"all","stylers":[{"visibility":"simplified"}]},{"featureType":"road","elementType":"all","stylers":[{"visibility":"simplified"}]},{"featureType":"road.highway","elementType":"all","stylers":[{"visibility":"off"},{"weight":0.6},{"saturation":-85},{"lightness":61}]},{"featureType":"road.highway","elementType":"geometry","stylers":[{"visibility":"on"}]},{"featureType":"road.arterial","elementType":"all","stylers":[{"visibility":"off"}]},{"featureType":"road.local","elementType":"all","stylers":[{"visibility":"on"}]},{"featureType":"transit","elementType":"all","stylers":[{"visibility":"simplified"}]},{"featureType":"water","elementType":"all","stylers":[{"visibility":"simplified"},{"color":"#5f94ff"},{"lightness":26},{"gamma":5.86}]}],
		disableDefaultUI: true
	});
	const geoJson = feature(topoKaohsiung, topoKaohsiung.objects.kaohsiung);
	map.data.addGeoJson(geoJson);

	markerPlots = await loadPlots('2017-03-31');

	$('#calendar').val('2017-03-31');
	startTimeline();
}

function startTimeline(){
	const speed = ~~$('.timeline-speed').text().slice(0, -1);
	$('.timeline-play').html('<i class="fas fa-pause" />');
	if(intervalTimeline) clearInterval(intervalTimeline);
	intervalTimeline = setInterval(function(){
		const n = $('.timeline input').val();
		$('.timeline input').val(~~n + 1);
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

window.initMap = initMap;
