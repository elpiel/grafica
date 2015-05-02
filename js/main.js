$(function(){

    $('[data-toggle="tooltip"]').tooltip();

    $('#outerColorPicker').colpick({
        layout: 'hex',
        color: '000000',
        submit: 0,
        colorScheme: 'light',
        onChange: function (hsb, hex, rgb, el, bySetColor) {
            $(el).css('background-color', '#' + hex);
            $('#outer-color').val(hex).trigger('change');
            // Fill the text box just if the color was set using the picker, and not the colpickSetColor function.
            if (!bySetColor) $(el).val(hex);

        }
    }).keyup(function () {
        $(this).colpickSetColor(this.value);
    }).css('background-color', '#000000');

    $('#innerColorPicker').colpick({
        layout: 'hex',
        color: 'ffffff',
        submit: 0,
        colorScheme: 'light',
        onChange: function (hsb, hex, rgb, el, bySetColor) {
            $(el).css('background-color', '#' + hex);
            $('#inner-color').val(hex).trigger('change');
            // Fill the text box just if the color was set using the picker, and not the colpickSetColor function.
            if (!bySetColor) $(el).val(hex);

        }
    }).keyup(function () {
        $(this).colpickSetColor(this.value);
    }).css('background-color', '#ffffff');

    $("#slider").slider({
        min: 1,
        max: 10,
        value: 1,
        slide: function (event, ui) {
            $("#thickness").val(ui.value).trigger('change');
            $('#thickness-box').height(ui.value);
        }
    });
});

