function tooltip_init() {
    // Tooltip for bootstrap
    $('[data-toggle="tooltip"]').tooltip({html: true});
    $('[data-toggle="popover"]').popover({html: true});
    $('[data-toggle="table"]').on('post-body.bs.table', function () {
        $('[data-toggle="tooltip"]').tooltip({
            container: 'body'
        });
    });
}

function menu_init(data) {
    /* init the bootstrap select menu: $('[name="templates"]')
        return an object db_name_change: template => description
    */
    var db_name_change = new Object;
    var group_data = JSON.parse(data);
    for (group in group_data) {
        $('[name="templates"]').append('<optgroup label="'+group+'">');
        for (template in group_data[group]) {
            $('optgroup[label="'+group+'"]').append('<option data-subtext="seq IDs:'+group_data[group][template]['IDs']
                +'" value="'+template+'">'+group_data[group][template]['desc']+'</option>');
            db_name_change[template] = group_data[group][template]['desc'];
            $('#help-modal-ID-list').append('<a href="'+$SCRIPT_ROOT+'/dbdownload/'+template+'/" class="list-group-item">'
            +group_data[group][template]['desc']+' <span class="glyphicon glyphicon-download"></span></a>');
        }
    }
    return db_name_change
}

function switch_parameter_fieldset(mode) {
    if (mode=='saved') {
        $('#form-primer,#result').addClass('hidden');
    }
    else {
        $('#form-primer').removeClass('hidden');
        $('#result').removeClass('hidden');
        if ($('#result').html()!='') {
            $('#footer-button').removeClass('hidden');
        }
        switch(mode) {
            case 'full': {
                $('#parameter-design').removeClass('hidden');
                $('#parameter-check').removeClass('hidden');
                $('#textarea-title').html('Input: Design primers and check specificity');
                break;
            }
            case 'design': {
                $('#parameter-design').removeClass('hidden');
                $('#parameter-check').addClass('hidden');
                $('#textarea-title').html('Input: Only design primers');
                break;
            }
            case 'check': {
                $('#parameter-design').addClass('hidden');
                $('#parameter-check').removeClass('hidden');
                $('#textarea-title').html('Input: Only check specificity');
                break;
            }
        }
    }
}

function highlight_changed_field() {
    1;
}

function show_selected_dbs(str, db_name_change) {
    var display_str = '';
    if (str!='') {
        var dbs = str.split(',');
        for (var i=0; i<dbs.length; i++) {
            if (i==0) {
                display_str += '<li class="list-group-item">' + db_name_change[dbs[i]] + ' <span class="glyphicon glyphicon-star"></span></li>'
            }
            else {
                display_str += '<li class="list-group-item">' + db_name_change[dbs[i]] + '</li>'
            }
        }
    }
    $('#show-selected-templates').html(display_str);
}

function ScrollToResult() {
    $('html,body').animate({
        scrollTop: $('#result').offset().top,
    }, 1000);
};

function move_webpage_when_browsing_result_panels() {
    // In the result panels, improve web page move (for save view)
    $('#primers-result').on('shown.bs.collapse', function () {
        var offset = $(this).find('.collapse.in').prev('.panel-heading');
        if(offset) {
            $('html,body').animate({
                scrollTop: $(offset).offset().top-20
            }, 1000); 
        }
    });
}

// ***********************  for test only ***********************
function test(selected_dbs, json_file, mode) {
    $.ajaxSetup({ cache: false });
    $.getJSON($SCRIPT_ROOT+'/static/'+json_file, function(data){
        $('#result').removeClass('hidden');
        generate_html_result(selected_dbs, db_name_change, data);
        if (mode=='full') {
            GenerateGraph($('#site-1'), true);
            $('#primers-result .collapse').on('shown.bs.collapse', function () {
                GenerateGraph($(this), true);
            });
            $('#primers-result .collapse').on('hidden.bs.collapse', function () {
                $(this).find('.PrimerFigure').html('');
                $(this).find('.PrimerFigureControl').remove();
            });
        }
        else if (mode=='design') {
            GenerateGraph($('#site-1'), false);
            $('#primers-result .collapse').on('shown.bs.collapse', function () {
                GenerateGraph($(this), false);
            });
            $('#primers-result .collapse').on('hidden.bs.collapse', function () {
                $(this).find('.PrimerFigure').html('');
                $(this).find('.PrimerFigureControl').remove();
            });
        }
        move_webpage_when_browsing_result_panels();
    });
}
// ***********************  ***********************  ***********************  

function AjaxSubmit(selected_dbs, mode) {
    $('#running-modal .modal-body h4').html('<span class="fa fa-spinner fa-spin fa-4x"></span>');
    $('#running-modal .progress-bar').css('width', '0%').html('');
    $('#running-modal').modal('show');
    var currentAjax = $.post($SCRIPT_ROOT + '/run', $('#form-primer').serialize(), function(data){
        var result_data = JSON.parse(data);
        $('#result').removeClass('hidden');
        $('#running-modal').modal('hide');
        $('#primers-result').html('');
        ScrollToResult();
        // no results
        if ('error' in result_data) {
            $('#primers-result').append($('#primers-result-template-error').html()).find('.alert-danger')
                .append('<h5><strong>ERROR</strong></h5>'+result_data['error']);
            return;
        }

        generate_html_result(selected_dbs, db_name_change, result_data);
        if (mode=='full') {
            GenerateGraph($('#site-1'), true);
            $('#primers-result .collapse').on('shown.bs.collapse', function () {
                GenerateGraph($(this), true);
            });
            $('#primers-result .collapse').on('hidden.bs.collapse', function () {
                $(this).find('.PrimerFigure').html('');
                $(this).find('.PrimerFigureControl').remove();
            });
        }
        else if (mode=='design') {
            GenerateGraph($('#site-1'), false);
            $('#primers-result .collapse').on('shown.bs.collapse', function () {
                GenerateGraph($(this), false);
            });
            $('#primers-result .collapse').on('hidden.bs.collapse', function () {
                $(this).find('.PrimerFigure').html('');
                $(this).find('.PrimerFigureControl').remove();
            });
        }
        move_webpage_when_browsing_result_panels();
    });

    // Allow users to stop their running
    $('#stop').click(function(){
        if (currentAjax) {
            currentAjax.abort();
        }
        // $.get('script/modal_stop.php', function(){
        //     $('#running-modal').modal('hide');
        // });
        $('#running-modal').modal('hide');
    });
}

// ***********************  Begin main functions  ***********************  
// ********* Page load *********
var db_name_change = new Object;
$(function () {
    $.get($SCRIPT_ROOT + '/dbselect', function(data){

        // init menu, get db_name_change
        db_name_change = menu_init(data);

        // load last save
        $(':text,:radio,input:hidden,select').phoenix();

        // refresh menu (and show databases in paramter column)
        $('[name="templates"]').selectpicker('refresh');

        // refresh running mode
        mode = $("[name='app-type']").val()
        $('a[href="#'+mode+'"]').tab('show');

        highlight_changed_field();

        // test('example.fa', 'primer_full.json', 'full');
    });

    tooltip_init();

});

// ********* Switch Running mode (init load change or by user change) and update UI *********
$('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {

    // change the hidden field value : app-type
    var mode = $(e.target).attr('href').replace('#', '');
    $("[name='app-type']").val(mode);

    // change parameters fieldset
    switch_parameter_fieldset(mode);

    // change textarea
    switch (mode) {
        case 'full':
            textarea_color = '#bfffdf';
            placeholder = "One per line, blank delimited: TemplateID TargetPos TargetLength";
            break;
        case 'design':
            textarea_color = '#fcd8f7';
            placeholder = "One per line, blank delimited: TemplateID TargetPos TargetLength";
            break;
        case 'check':
            textarea_color = '#ffdfbf';
            placeholder = "One primer group per line, space delimited: PrimerID SeqF SeqR";
            break;
    }
    $('textarea').html('').val('').css('background-color', textarea_color).attr('placeholder', placeholder);

});

// ********* Switch databases (init load or by user change) and update UI *********
var vals = [];
$('[name="templates"]').on('changed.bs.select refreshed.bs.select', function (event) {
    if (event.type=='refreshed') {  // init load
        selected_dbs = $('[name="selected_dbs"]').val();
    }
    else {  // user change
        for(var i=0; i <$('[name="templates"] option').length; i++) {
            if ($($('[name="templates"] option')[i]).prop('selected') ) {
                if (!vals.includes(i)) {
                    vals.push(i);
                }
            } 
            else if (vals.includes(i)) {
                vals.splice(vals.indexOf(i), 1);
            }
        }
        var selected_dbs = '';
        vals.forEach(function(ele) {
            selected_dbs += $($('[name="templates"] option')[ele]).val() + ',';
        })
        selected_dbs = selected_dbs.replace(/,$/, '');
        $('[name="selected_dbs"]').val(selected_dbs);
    }
    show_selected_dbs(selected_dbs, db_name_change);
});

// ********* The reset buttton *******************************************************
$(':reset').click(function(){
    $('[name="templates"]').selectpicker('val', '');
    $('[name="selected_dbs"]').val('');
    $('#show-selected-templates').html('');
});

// ********* User submit the form *******************************************************
$('#form-primer').validationEngine('attach', {
    onValidationComplete: function(form, status) {
        if (status) {
            var selected_dbs = $('[name="selected_dbs"]').val();
            var mode = $("[name='app-type']").val();
            AjaxSubmit(selected_dbs, mode);
        }
    }
});