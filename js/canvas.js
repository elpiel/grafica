/**
 * Created by elpiel on 3/22/15.
 */

var path, previousPath;
var segment;

project.activeLayer.name = 'Layer 1';

function onMouseMove(event) {
    $('#xCoordinates').html(parseInt(event.point.x));
    $('#yCoordinates').html(parseInt(event.point.y));
}
function onKeyDown(event) {
    console.log(event.key);
    if (event.key == 'delete') {
        $.each(project.selectedItems, function (index, item) {
            console.log(item);
            item.remove();
        });
    }
}

$('#name').change(function () {
    var selectedItems = project.selectedItems;
    if (selectedItems.length == 1) {
        selectedItems[0].name = $(this).val();
    }
});

/* START - Select */
selectTool = new Tool();
var hitOptions = { // Trigger hit only on 'fill' part of the path with 0 tolerance
    segments: true,
    stroke: true,
    fill: true,
    tolerance: 0
};
selectTool.onMouseMove = function (event) {
    onMouseMove(event);
    var hitResult = project.activeLayer.hitTest(event.point, hitOptions); // isPointInPath
    if (hitResult) {
        document.body.style.cursor = "pointer";
    } else {
        document.body.style.cursor = "default";
    }
};

selectTool.onMouseUp = function (event) {
    var hitResult = project.activeLayer.hitTest(event.point, hitOptions); // isPointInPath
    if (hitResult) {
        if (pressedKeys.indexOf(17) == -1) {
            project.deselectAll();
            // only leave the item on the cursor
        }

        hitResult.item.selected = hitResult.item.selected ? false : true;

    } else {
        if (pressedKeys.indexOf(17) == -1) {
            project.deselectAll();
        }
    }
};
selectTool.onKeyDown = function (event) {
    onKeyDown(event);
};

/* END - Select */

/* START - Move */
moveTool = new Tool();

var selectionRectangle = null;
var selectionRectangleScale = null;
var selectionRectangleRotation = null;
var selecedItem = null;

function initSelectionRectangle(path) {
    if (selectionRectangle != null) {
        selectionRectangle.remove();
    }
    var reset = path.rotation == 0 && path.scaling.x == 1 && path.scaling.y == 1;
    var bounds;
    if (reset) {
        console.log('reset');
        bounds = path.bounds;
        path.pInitialBounds = path.bounds;
    }
    else {
        console.log('no reset');
        bounds = path.pInitialBounds;
    }
    console.log('bounds: ' + bounds);
    b = bounds.clone().expand(10, 10);

    selectionRectangle = new Path.Rectangle(b);
    selectionRectangle.pivot = selectionRectangle.position;
    selectionRectangle.insert(2, new Point(b.center.x, b.top));
    selectionRectangle.insert(2, new Point(b.center.x, b.top - 25));
    selectionRectangle.insert(2, new Point(b.center.x, b.top));
    if (!reset) {
        selectionRectangle.position = path.bounds.center;
        selectionRectangle.rotation = path.rotation;
        selectionRectangle.scaling = path.scaling;
    }

    selectionRectangle.strokeWidth = 1;
    selectionRectangle.strokeColor = 'blue';
    selectionRectangle.data.selectionRectangle = true;
    /*selectionRectangle.name = "selection rectangle";*/
    selectionRectangle.selected = true;
    selectionRectangle.ppath = path;
    selectionRectangle.ppath.pivot = selectionRectangle.pivot;
}

var moveHitOptions = {
    segments: true,
    stroke: true,
    fill: true,
    tolerance: 5
};

var movePath = false;

moveTool.onMouseMove = function (event) {
    onMouseMove(event);
    var hitResult = project.hitTest(event.point, moveHitOptions);

    if (hitResult) {
        document.body.style.cursor = "pointer";
        if (hitResult.item.name) {
            $('#elementName').html(hitResult.item.name);
        }
    } else {
        $('#elementName').html('');
        document.body.style.cursor = "default";
    }
};

moveTool.onMouseDown = function (event) {
    segment = path = null;
    var hitResult = project.hitTest(event.point, moveHitOptions);
    if (!hitResult) {
        return;
    }

    if (event.modifiers.shift) {
        if (hitResult.type == 'segment') {
            hitResult.segment.remove();
        }
        return;
    }

    if (hitResult) {
        path = hitResult.item;
        project.deselectAll();
        path.selected = true;

        if (hitResult.type == 'segment') {
            if (selectionRectangle != null && path.data.selectionRectangle) {
                if (hitResult.segment.index >= 2 && hitResult.segment.index <= 4) {
                    console.log('rotation');
                    selectionRectangleRotation = 0;
                }
                else {
                    console.log('scale');
                    selectionRectangleScale = event.point.subtract(selectionRectangle.bounds.center).length / path.scaling.x;
                }
            }
            else {
                segment = hitResult.segment;
            }
        } else if (hitResult.type == 'stroke' && path != selectionRectangle) {
            var location = hitResult.location;
            segment = path.insert(location.index + 1, event.point);
            /*path.smooth();*/
        }
        if ((selectionRectangle == null || selectionRectangle.ppath != path) && selectionRectangle != path) {
            initSelectionRectangle(path);
        }
    }
    else {
        if (selectionRectangle != null) {
            selectionRectangle.remove();
        }
    }
    movePath = hitResult.type == 'fill';
    if (movePath) {
        project.activeLayer.addChild(hitResult.item);
    }
};

moveTool.onMouseDrag = function (event) {

    if (selectionRectangleScale != null) {
        ratio = event.point.subtract(selectionRectangle.bounds.center).length / selectionRectangleScale;
        scaling = new Point(ratio, ratio);
        selectionRectangle.scaling = scaling;
        selectionRectangle.ppath.scaling = scaling;
        console.log('scaling: ' + selectionRectangle.ppath);
        return;
    }
    else if (selectionRectangleRotation != null) {
        console.log('rotation: ' + selectionRectangle.ppath);
        rotation = event.point.subtract(selectionRectangle.pivot).angle + 90;
        selectionRectangle.ppath.rotation = rotation;
        selectionRectangle.rotation = rotation;
        return;
    }
    if (segment) {
        segment.point += event.delta;
        path.smooth();
        initSelectionRectangle(path);
    } else if (path) {
        if (path != selectionRectangle) {
            path.position += event.delta;
            selectionRectangle.position += event.delta;
        }
        else {
            selectionRectangle.position += event.delta;
            selectionRectangle.ppath.position += event.delta;
        }
    }
};
moveTool.onMouseUp = function (event) {
    selectionRectangleScale = null;
    selectionRectangleRotation = null;
};

moveTool.onKeyDown = function (event) {
    onKeyDown(event);
};

/* END - Move */


/* START - Pencil */
pencilTool = new Tool();
pencilTool.onMouseDown = function (event) {
    if (path) {
        previousPath = path;
    }
    path = new Path();
    path.strokeColor = '#' + $('#color').val();
    path.strokeWidth = $('#thickness').val();
    path.add(event.point);
};
pencilTool.onMouseDrag = function (event) {
    path.add(event.point);
};
pencilTool.onMouseUp = function (event) {
    project.deselectAll();
    path.selected = true;
};
pencilTool.onMouseMove = function (event) {
    onMouseMove(event);
};
pencilTool.onKeyDown = function (event) {
    onKeyDown(event);
};
/* END - Pencil */

/* START - Line */
lineTool = new Tool();
var hasLinePreviousPoint = false;
lineTool.onMouseDown = function (event) {
    if (path) {
        previousPath = path;
    }
    path = new Path();
    path.add(event.point);
};
lineTool.onMouseDrag = function (event) {
    path.strokeColor = '#' + $('#color').val();
    path.strokeWidth = $('#thickness').val();

    if (hasLinePreviousPoint) {
        path.removeSegment(2);
    }
    path.add(event.point);
    hasLinePreviousPoint = true;
};

lineTool.onMouseUp = function (event) {
    project.deselectAll();
    path.selected = true;
};
lineTool.onMouseMove = function (event) {
    onMouseMove(event);
};
lineTool.onKeyDown = function (event) {
    onKeyDown(event);
};
/* END - Line */

/* START - Ellipse */
ellipseTool = new Tool();
var ellipse;
var ellipseFirstPoint = false;
var previousEllipse = false;

function calculateCircle(ellipseFirstPoint, ellipseSecondPoint) {
    var rectangle = new Rectangle(ellipseFirstPoint, ellipseSecondPoint);
    // calculate which is the smaller side of the rectangle
    var smallerSide = rectangle.width <= rectangle.height ? rectangle.width : rectangle.height;
    var raduis = smallerSide / 2;

    var pointX = ellipseFirstPoint.x;
    if (pointX < ellipseSecondPoint.x) {
        pointX += raduis;
    } else {
        pointX -= raduis;
    }

    var pointY = ellipseFirstPoint.y;
    if (pointY < ellipseSecondPoint.y) {
        pointY += raduis;
    } else {
        pointY -= raduis;
    }
    // calculate the center point
    var centerPoint = new Point(pointX, pointY);
    return new Path.Circle(centerPoint, raduis);
}

ellipseTool.onMouseDown = function (event) {
    ellipseFirstPoint = event.point;
};

ellipseTool.onMouseDrag = function (event) {
    if (previousEllipse) {
        previousEllipse.remove();
    }

    if (pressedKeys.indexOf(16) > -1) {
        previousEllipse = calculateCircle(ellipseFirstPoint, event.point);
    } else {
        var rectangle = new Rectangle(ellipseFirstPoint, event.point);
        previousEllipse = new Path.Ellipse(rectangle);
    }
    previousEllipse.strokeColor = '#' + $('#outer-color').val();
    previousEllipse.strokeWidth = $('#thickness').val();
    previousEllipse.fillColor = '#' + $('#inner-color').val();
};

ellipseTool.onMouseUp = function (event) {
    if (previousEllipse) {
        previousEllipse.remove();
    }
    if (pressedKeys.indexOf(16) > -1) {
        ellipse = calculateCircle(ellipseFirstPoint, event.point);
    } else {
        var rectangle = new Rectangle(ellipseFirstPoint, event.point);
        ellipse = new Path.Ellipse(rectangle);
    }
    ellipse.strokeColor = '#' + $('#outer-color').val();
    ellipse.strokeWidth = $('#thickness').val();
    ellipse.fillColor = '#' + $('#inner-color').val();

    project.deselectAll();
    ellipse.selected = true;
};
ellipseTool.onMouseMove = function (event) {
    onMouseMove(event);
};
ellipseTool.onKeyDown = function (event) {
    onKeyDown(event);
};
/* END - Ellipse */

/* START - Ellipse 2 */
ellipse2Tool = new Tool();
var ellipse2;
var ellipse2FirstPoint = false;
var previousEllipse2 = false;

ellipse2Tool.onMouseDown = function (event) {
    ellipse2FirstPoint = event.point;
};

ellipse2Tool.onMouseDrag = function (event) {
    if (previousEllipse2) {
        previousEllipse2.remove();
    }

    var rectangle = new Rectangle(ellipse2FirstPoint, event.point);
    var e = new Path.Ellipse(rectangle);
    var line1 = new Path([rectangle.topCenter, rectangle.bottomCenter]);


    var centerToBottomRight = new Path([rectangle.center, rectangle.bottomRight]);
    var centerToBottomLeft = new Path([rectangle.center, rectangle.bottomLeft]);
    var intersectionRight = centerToBottomRight.getIntersections(e);
    var intersectionLeft = centerToBottomLeft.getIntersections(e);
    var toRight = new Path([rectangle.center, intersectionRight]);
    var toLeft = new Path([rectangle.center, intersectionLeft]);

    var childs = [e, line1, toLeft, toRight];

    previousEllipse2 = new Group(childs);

    //previousEllipse2.add(rectangle.center);
    previousEllipse2.strokeColor = '#' + $('#outer-color').val();
    previousEllipse2.strokeWidth = $('#thickness').val();
    previousEllipse2.fillColor = '#' + $('#inner-color').val();
};

ellipse2Tool.onMouseUp = function (event) {
    if (previousEllipse2) {
        previousEllipse2.remove();
    }

    var rectangle = new Rectangle(ellipse2FirstPoint, event.point);
    var e = new Path.Ellipse(rectangle);
    var line1 = new Path([rectangle.topCenter, rectangle.bottomCenter]);


    var centerToBottomRight = new Path([rectangle.center, rectangle.bottomRight]);
    var centerToBottomLeft = new Path([rectangle.center, rectangle.bottomLeft]);
    var intersectionRight = centerToBottomRight.getIntersections(e);
    var intersectionLeft = centerToBottomLeft.getIntersections(e);
    var toRight = new Path([rectangle.center, intersectionRight]);
    var toLeft = new Path([rectangle.center, intersectionLeft]);


    var childs = [e, line1, toLeft, toRight];

    ellipse2 = new Group(childs);

    ellipse2.strokeColor = '#' + $('#outer-color').val();
    ellipse2.strokeWidth = $('#thickness').val();
    ellipse2.fillColor = '#' + $('#inner-color').val();

    project.deselectAll();
    ellipse2.selected = true;
};
ellipse2Tool.onMouseMove = function (event) {
    onMouseMove(event);
};
ellipse2Tool.onKeyDown = function (event) {
    onKeyDown(event);
};
/* END - Ellipse 2 */

/* START - Rectangle Tool */
rectangleTool = new Tool();
function calculateSquare(rectangleFirstPoint, rectangleSecondPoint) {
    var rectangle = new Rectangle(rectangleFirstPoint, rectangleSecondPoint);
    // calculate which is the smaller side of the rectangle
    var smallerSide = rectangle.width <= rectangle.height ? rectangle.width : rectangle.height;

    var resizedRectangle = new Rectangle(rectangleFirstPoint, new Size(smallerSide, smallerSide));
    return new Path.Rectangle(resizedRectangle);
}

var rectangleFirstPoint, previousRectangle;
var rectangle;

rectangleTool.onMouseDown = function (event) {
    rectangleFirstPoint = event.point;
};

rectangleTool.onMouseDrag = function (event) {
    if (previousRectangle) {
        previousRectangle.remove();
    }

    if (pressedKeys.indexOf(16) > -1) {
        previousRectangle = calculateSquare(rectangleFirstPoint, event.point);
    } else {
        var r = new Rectangle(rectangleFirstPoint, event.point);
        previousRectangle = new Path.Rectangle(r);
    }
    previousRectangle.strokeColor = '#' + $('#outer-color').val();
    previousRectangle.strokeWidth = $('#thickness').val();
    previousRectangle.fillColor = '#' + $('#inner-color').val();
};

rectangleTool.onMouseUp = function (event) {
    if (previousRectangle) {
        previousRectangle.remove();
    }
    if (pressedKeys.indexOf(16) > -1) {
        rectangle = calculateSquare(rectangleFirstPoint, event.point);
    } else {
        var r = new Rectangle(rectangleFirstPoint, event.point);
        rectangle = new Path.Rectangle(r);
    }
    rectangle.strokeColor = '#' + $('#outer-color').val();
    rectangle.strokeWidth = $('#thickness').val();
    rectangle.fillColor = '#' + $('#inner-color').val();

    project.deselectAll();
    rectangle.selected = true;
};
rectangleTool.onMouseMove = function (event) {
    onMouseMove(event);
};
rectangleTool.onKeyDown = function (event) {
    onKeyDown(event);
};
/* END - Rectangle */
function findLayerByName(name) {
    var layerByName = null;
    $.each(project.layers, function (index, layer) {
            if (name == layer.name) {
                layerByName = layer;
                // break the loop
                return false;
            }
        }
    );
    return layerByName;
}

function refreshLayers() {
    var layersHtml = '';
    var length = project.layers.length;
    if (length == 0) {
        var addOneLayer = new Layer({name: 'Layer 1'})
    }
    $.each(project.layers, function (index, layer) {
        isActive = project.activeLayer.name == layer.name;
        layersHtml += '<div class="col-md-12' + (isActive ? ' hovered' : '') + '">' +
        '   <div class="col-md-2">' +
        ( length > 1
            ? '<i class="glyphicon glyphicon-minus pointer deleteLayer" data-id="' + layer.name + '"></i>'
            : '&nbsp;' ) +
        '   </div>' +
            /*'   <div class="col-md-2">' +
             '       <i class="glyphicon glyphicon-pencil pointer" ></i>' +
             '   </div>' +*/
        '   <div class="col-md-8">' +
        '       <a href="javascript:void(0)" class="clickLayer" data-id="' + layer.name + '">' +
        '       ' + layer.name +
        '       </a>' +
        '   </div>' +
        '</div>';
    });
    $('#layers').html(layersHtml);
}

refreshLayers();
$(function () {

    //$('.clickLayer').click();

    $('body').on('click', '.clickLayer', function () {
        var layerName = $(this).attr('data-id');

        console.log(layerName);

        var layer = findLayerByName(layerName);
        layer.activate();
        $('#layerEditName').val(layerName);
        $('#layerName').val(layerName);
        refreshLayers();
    })
        .on('click', '.deleteLayer', function () {
            var length = project.layers.length;
            if (length > 1) {
                console.log('hewew');
                var layerName = $(this).attr('data-id');
                var layer = findLayerByName(layerName);
                layer.remove();
                if (project.activeLayer.name == layerName) {
                    project.layers[0].activate();
                }
                refreshLayers();
            }
        });

    $('#layerButton').click(function () {
        var layerEditName = $('#layerEditName');
        var oldLayerName = $(layerEditName).val();
        var layerNameField = $('#layerName');
        var newLayerName = $(layerNameField).val();
        if (newLayerName) {
            if (oldLayerName != "") {
                if (newLayerName != oldLayerName) {
                    var layer = findLayerByName(oldLayerName);
                    layer.name = newLayerName;
                }
                $(layerEditName).val('');
            } else {
                var newLayer = findLayerByName(newLayerName);
                if (newLayer == null) {
                    newLayer = new Layer({name: newLayerName});
                }

                newLayer.activate();
                $(layerNameField).val('');
            }
            refreshLayers();
        }
    });

    $('.tool').click(function () {
        $('.tool').each(function () {
            $(this).removeClass('btn-primary').addClass('btn-default');
        });

        $.each(project.selectedItems, function (index, item) {
            if (item.data.selectionRectangle) {
                item.remove();
            }
        });
        switch ($(this).attr('id')) {
            case 'selectTool':
                selectTool.activate();
                break;
            case 'moveTool':
                moveTool.activate();
                break;
            case 'ellipseTool':
                ellipseTool.activate();
                break;
            case 'rectangleTool':
                rectangleTool.activate();
                break;
            case 'pencilTool':
                pencilTool.activate();
                break;
            case 'lineTool':
                lineTool.activate();
                break;
            case 'ellipse2Tool':
                ellipse2Tool.activate();
                break;

        }
        $(this).removeClass('btn-default').addClass('btn-primary');
    });

    $('#thickness').change(function () {
        var thickness = $(this).val();

        for (var item in project.selectedItems) {
            project.selectedItems[item].strokeWidth = thickness;
        }
    });

    $('#outer-color').change(function () {
        var color = '#' + $(this).val();

        for (var item in project.selectedItems) {
            project.selectedItems[item].strokeColor = color;
        }
    });

    $('#inner-color').change(function () {
        var color = '#' + $(this).val();

        for (var item in project.selectedItems) {
            project.selectedItems[item].fillColor = color;
        }
    });

    /* START - Export SVG */
    function downloadDataUri(options) {
        if (!options.url) {
            options.url = "http://download-data-uri.appspot.com/";
        }
        $('<form method="post" action="' + options.url
        + '" style="display:none"><input type="hidden" name="filename" value="'
        + options.filename + '"/><input type="hidden" name="data" value="'
        + options.data + '"/></form>').appendTo('body').submit().remove();
    }

    $('#exportSVG').click(function () {
        var svg = project.exportSVG({asString: true});

        downloadDataUri({
            data: 'data:image/svg+xml;base64,' + btoa(svg),
            filename: 'export.svg'
        });
    });
    /* END - Export SVG */

    /* START - Import SVG */
    $('#importSVG').click(function () {
        $("#fileInput").trigger('click');
    });

    $("#fileInput").change(function () {
        if (this.files && this.files[0]) {
            var reader = new FileReader();

            reader.onload = function (e) {
                var svgLoaded = $('#svg-loaded');
                $(svgLoaded).html(e.target.result);
                project.importSVG($(svgLoaded).html());
            };

            reader.readAsDataURL(this.files[0]);
            $(this).replaceWith($(this).val('').clone(true));
        }
    });
    /* END - Import SVG */

});