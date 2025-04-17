function generateMarkerSvg(width, height, bits) {
    let svg = $('<svg/>').attr({
        viewBox: '0 0 ' + (width + 2) + ' ' + (height + 2),
        xmlns: 'http://www.w3.org/2000/svg',
        'shape-rendering': 'crispEdges' // disable anti-aliasing to avoid little gaps between rects
    });
    // Background rect
    $('<rect/>').attr({
        x: 0,
        y: 0,
        width: width + 2,
        height: height + 2,
        fill: 'black'
    }).appendTo(svg);

    // "Pixels"
    for (let i = 0; i < height; i++) {
        for (let j = 0; j < width; j++) {
            let color = bits[i * height + j] ? 'white' : 'black';
            let pixel = $('<rect/>').attr({
                width: 1,
                height: 1,
                x: j + 1,
                y: i + 1,
                fill: color
            });
            pixel.appendTo(svg);
        }
    }

    return svg;
}

var dict;

function generateArucoMarker(width, height, dictName, id) {
    console.log('Generate ArUco marker ' + dictName + ' ' + id);

    let bytes = dict[dictName][id];
    let bits = [];
    let bitsCount = width * height;

    // Parse marker's bytes
    for (let byte of bytes) {
        let start = bitsCount - bits.length;
        for (let i = Math.min(7, start - 1); i >= 0; i--) {
            bits.push((byte >> i) & 1);
        }
    }

    return generateMarkerSvg(width, height, bits);
}

var loadDict = $.getJSON('dict.json', function (data) {
    dict = data;
});

$(function () {
    var dictSelect = $('.setup select[name=dict]');
    var markerIdInputFirst = $('.setup input[name=id1]');
    var markerIdInputLast = $('.setup input[name=id2]');
    var sizeInput = $('.setup input[name=size]');
    var copiesInput = $('.setup input[name=copies]');
    var labelsInput = $('.setup textarea[name=labels]');
    var showLabelsCheckbox = $('.setup input[name=showLabels]');

    function updateMarkers() {
        var markerIdFirst = Number(markerIdInputFirst.val());
        var markerIdLast = Number(markerIdInputLast.val());
        var size = Number(sizeInput.val());
        var numCopies = Number(copiesInput.val());
        var dictName = dictSelect.val();
        var width = Number(dictSelect.find('option:selected').attr('data-width'));
        var height = Number(dictSelect.find('option:selected').attr('data-height'));
        var labels = labelsInput.val().split('\n');
        var showLabels = showLabelsCheckbox.is(':checked');

        // Wait until dict data is loaded
        loadDict.then(function () {
            $('#cards').html('');
            var labelCounter = 0;
            for (let markerId = markerIdFirst; markerId <= markerIdLast; markerId++) {
                let svg = generateArucoMarker(width, height, dictName, markerId);
                svg.attr({
                    width: size + 'mm',
                    height: size + 'mm'
                });
                let svgHtml = svg[0].outerHTML;
                let markerCard = $('<div class="card"/>');
                let svgContainer = $('<div class="marker-svg-group"/>');
                for (let copy = 0; copy < numCopies; copy++) {
                    svgContainer.append(svgHtml);
                }
                markerCard.append(svgContainer);
                // Only show labels if box is checked
                if (showLabels) {
                    let labelText = labels[labelCounter] ? labels[labelCounter] : '[' + markerId + ']';
                    markerCard.append('<div class="card-text">' + labelText + '</div>');
                }
                $('#cards').append(markerCard);
                labelCounter++;
            }
        });
    }

    updateMarkers();

    dictSelect.change(updateMarkers);
    $('.setup input, .setup textarea').on('input', updateMarkers);
});