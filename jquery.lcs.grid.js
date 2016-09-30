/*! 
 * jQuery LCSgrid v1.0.0 - 23/05/2016
 * Copyright (c) 2016 Lesliê Cardoso da Silva (http://www.jquery-lcsgrid.com)
 * Licensed under MIT http://www.opensource.org/licenses/MIT
 */
; (function ($, window, undefined) {
    "use strict";
    var namespace = ".jquery.lcs.grid";
    var nu = 0;

    function getRequest() {
        this.page_max = this.element.find('select.lcs-pagination').val();
        var that = this;
        var request = {
            id: this.id,
            op: this.op,
            page_current: this.page_current,
            page_max: this.page_max
        },
        post = this.options.post;

        if (post.length == undefined) {
            var $tr = this.header.find('table input, table select');

            var op = new Object;
            $.each($tr, function (i, o) {
                if ($(o).val().trim() != '') {
                    op[$(o).attr('id')] = $(o).val();
                }
            });

            post = { params: op, 'ordering': post.ordering }
        }

        this.options.action = this.options.actions;

        post = ($.isFunction(post)) ? post() : post;
        return this.options.requestHandler($.extend(true, request, post));
    }

    function replaceVal() {
        var that = this;

        $.each(this.options.ajaxSettings.data.params, function (f, val) {
            if (val != '') {
                var field = f.split('.');
                field = (field.length == 1) ? field[0] : field[1];

                if (that.options.ajaxSettings.data[field]) {
                    that.options.ajaxSettings.data[field] = val;
                }
            }
        });
    }

    function getUrl() {
        var url = this.element.data('url');
        return ($.isFunction(url)) ? url() : url;
    }

    function _filtering() {
        var that = this, timer = null;
        $(that.header.find('.grid-filter')).unbind().on('keypress' + namespace, function (e) {
            if (e.which == 13) {
                var $tr = $(this).closest('tr').find('input, select');
                var $option = new Object;
                that.op = true;

                $.each($tr, function (i, o) {
                    if ($(o).val().trim() != '') {
                        $option[$(o).attr('id')] = $(o).val();
                    }
                });

                that.options.post = { 'params': $option };
                that.page_current = 1;
                loadData.call(that);
            }
        });
    }

    function _ordering(buttons, dom) {
        var that = this;

        $(buttons.find('li')).unbind().on('click' + namespace, function (ev) {
            ev.stopPropagation();
            var c = $(this).closest('div.lcs-header-menu-popup').data('column');

            if ($(this).find('span span').hasClass('lcs-k-i-sort-asc')) {
                that.ordering[c] = 'ASC';
                dom.find('span.lcs-icon').remove();
                dom.append("<span class='lcs-icon lcs-i-arrow-n'></span>");
            }
            else {
                that.ordering[c] = 'DESC';
                dom.find('span.lcs-icon').remove();
                dom.append("<span class='lcs-icon lcs-i-arrow-s'></span>");
            }

            $(this).closest('div.lcs-header-menu-popup').remove();

            //Pega os valores dos campos
            var $tr = that.header.find('.grid-filter');
            var $option = new Object;
            that.op = true;

            $.each($tr, function (i, o) {
                if ($(o).val().trim() != '') {
                    $option[$(o).attr('id')] = $(o).val();
                }
            });

            that.options.post = { 'params': $option, 'ordering': that.ordering };

            loadData.call(that);
        });
    }

    function _menu_header() {
        var that = this;

        var buttons = this.header.find('.lcs-filterable');

        $(buttons).unbind().on('click' + namespace, function (ev) {
            ev.stopPropagation();
            var p = $(this).position();
            var dom = $("<div class='" + that.id + " lcs-header-menu-popup' data-column='" + $(this).closest('th').data('column') + "'><ul><li><span><span class='lcs-icon lcs-k-i-sort-asc'></span>Crescente</span></li><li><span><span class='lcs-icon lcs-k-i-sort-desc'></span>Drescente</span></li></ul></div>");

            $('body').find("." + that.id + '.lcs-header-menu-popup').remove();

            if (((p.left + 150) < $(document).width()) && (p.top + 50) < $(document).height()) {
                dom.css({ 'top': p.top + 54, 'left': p.left + $('nav.lcs-menu-lateral').width(), 'visibility': 'visible' });
            }
            $('body').append(dom);

            //console.log('A: '+);

            _ordering.call(that, dom, $(this).closest('th').find('span span:first-child'));
        });
    }

    function _buttons() {
        var that = this;
        var buttons = this.header.find('.lcs-link');
        //console.log("Buttons: " + this.header.find('a.lcs-grid-page').attr('data-page'));

        $(buttons).unbind().on('click' + namespace, function (ev) {
            ev.stopPropagation();
            ev.preventDefault();

            $('body').find("." + that.id + '.lcs-header-menu-popup').remove();

            if ($(this).hasClass('lcs-pager-nav') && !$(this).hasClass('lcs-state-disabled')) {
                if ($(this).find('span').hasClass('lcs-i-refresh')) {
                    that.current = that.header.find('span.lcs-state-selected').text();
                    that.page_max = that.header.find('select.lcs-pagination').val();
                }
                var $tr = $('div.lcs-grid-header-wrap').find('input, select');
                var $option = new Object;

                that.op = true;

                $.each($tr, function (i, o) {
                    if ($(o).val().trim() != '') {
                        var field = $(o).attr('id').split('.');
                        field = (field.length == 1) ? field[0] : field[1];

                        $option[$(o).attr('id')] = $(o).val();

                        if (that.options.ajaxSettings.data[field]) {
                            that.options.ajaxSettings.data[field] = $(o).val();
                        }
                    }
                });

                //alert($option.toSource());
                that.options.post = { 'params': $option };

                that.page_current = ($(this).attr('data-page')) ? $(this).attr('data-page') : that.current;

                loadData.call(that);
            }
        });
    }

    function _select() {
        var that = this;
        var select = this.header.find('.lcs-pagination');
        //console.log("Buttons: " + this.header.find('a.lcs-grid-page').attr('data-page'));

        $(select).unbind().on('change' + namespace, function (ev) {
            ev.stopPropagation();
            ev.preventDefault();
            $('body').find("." + that.id + '.lcs-header-menu-popup').remove();
            that.page_current = that.header.find('.lcs-state-selected').text();
            loadData.call(that);
        });
    }

    function _set_variables(o) {
        this.page_current = (((o.page_current * this.page_max) - this.page_max + 1) > o.records_count) ? Math.round(o.records_count / this.page_max) : this.page_current;
        this.record_first = ((o.page_current * this.page_max) - this.page_max + 1);
        this.record_last = ((o.page_current * this.page_max > o.records_count) ? o.records_count : o.page_current * this.page_max);
        this.page_count = Math.round(o.records_count / this.page_max);

        if ((this.page_count * this.page_max) < o.records_count) {
            this.page_count++;
        }

        this.page_current = Number(o.page_current);
        this.records_count = Number(o.records_count);
    }

    function _numbers() {
        var a = ((this.page_current - 2) > 0) ? (this.page_current - 2) : (((this.page_current - 1) > 0) ? (this.page_current - 1) : this.page_current);
        var b = ((this.page_current + 2) <= this.page_count) ? (this.page_current + 2) : (((this.page_current + 1) <= this.page_count) ? (this.page_current + 1) : this.page_current);

        //console.log(a + ' ' + b + ' :' + this.page_current + ' <' + this.page_count);
        var n = [];
        for (var i = a; i <= b ; i++) {
            if (i > 0 && i <= this.record_last) {
                n.push(i);
            }
        }

        return n;
    }

    function _pageNumbers($o) {
        var that = this;

        _set_variables.call(this, $o);

        if (this.page_current == 1) {
            this.header.find('a.lcs-pager-first').addClass('lcs-state-disabled').attr({ 'data-page': 1, 'data-button': 'first' });
            this.header.find('a.lcs-pager-prior').addClass('lcs-state-disabled').attr({ 'data-page': 1, 'data-button': 'first' });
        }
        else {
            this.header.find('a.lcs-pager-first').removeClass('lcs-state-disabled').attr({ 'data-page': 1, 'data-button': 'first' });
            this.header.find('a.lcs-pager-prior').removeClass('lcs-state-disabled').attr({ 'data-page': (parseInt(this.page_current) - 1), 'data-button': 'prior' });
        }

        if (this.page_current == this.page_count) {
            this.header.find('a.lcs-pager-next').addClass('lcs-state-disabled').attr({ 'data-page': this.page_count, 'data-button': 'last' });
            this.header.find('a.lcs-pager-last').addClass('lcs-state-disabled').attr({ 'data-page': this.page_count, 'data-button': 'last' });
        }
        else {
            this.header.find('a.lcs-pager-next').removeClass('lcs-state-disabled').attr({ 'data-page': (parseInt(this.page_current) + 1), 'data-button': 'next' });
            this.header.find('a.lcs-pager-last').removeClass('lcs-state-disabled').attr({ 'data-page': this.page_count, 'data-button': 'last' });
        }

        if (this.records_count > 0) {
            this.header.find('span.lcs-pager-first').html('');
            this.header.find('a.lcs-pager-refresh').removeClass('lcs-state-disabled'); //.addClass('lcs-pager-refresh');
            this.header.find('span.lcs-pager-first').append(this.record_first + ' - ' + this.record_last + " de <span class='records_count'>" + this.records_count + " (" + (this.start) + "s)</span><span class='legend'>" + this.options.labels.infos + "</span></span>");
            this.header.find('ul.lcs-pager-numbers').find('li').remove();

            $.each(_numbers.call(this), function (i, item) {
                if (item != $o.page_current) {
                    that.header.find('ul.lcs-pager-numbers').append("<li><a tabindex='-1' href='#' class='lcs-link lcs-grid-page lcs-link lcs-pager-nav' data-page='" + item + "'>" + item + "</a></li>");
                }
                else {
                    that.header.find('ul.lcs-pager-numbers').append("<li><span class='lcs-state-selected'>" + item + "</span></li>");
                }
            });
        }
        else {
            this.header.find('span.lcs-pager-first').html('');
            this.header.find('a.lcs-pager-refresh').addClass('lcs-state-disabled');

            this.header.find('a.lcs-pager-next').addClass('lcs-state-disabled');
            this.header.find('a.lcs-pager-last').addClass('lcs-state-disabled');
            this.header.find('a.lcs-pager-first').addClass('lcs-state-disabled');
            this.header.find('a.lcs-pager-prior').addClass('lcs-state-disabled');

            this.header.find('span.lcs-pager-first').append("<span class='records_count'></span><span class='legend'>" + this.options.labels.noResults + " (" + (this.start) + "s)</span></span>");
        }
    }

    function _actions() {
        var that = this;
        var ul = $("<ul class='lcs-grid-action'></ul>");
        $.each(this.options.action, function (e, f) {
            /*$.each(f, function (e, o) {
                console.log(e + ' ' + o);
            });
            */
            //console.log($(f).'data-ajax'));
            ul.append($("<li></li>").append($("<a href='ctrl.php?'></a>").attr(f).addClass('lcs-action')));
            //alert(f.toSource());
        });


        return ul;
    }

    function appendBoxMessage() {
        var html =
        "<div class='modal fade' id='message_box' tabindex='-1' role='dialog' aria-labelledby='message_boxLabel'><div class='modal-dialog' role='document'>" +
                "<div class='modal-content'>" +
                    "<div class='modal-header'>" +
                        "<button type='button' class='close' data-dismiss='modal' aria-label='Close'><span aria-hidden='true'>&times;</span></button>" +
                        "<h4 class='modal-title' id='myModalLabel'>Atenção</h4>" +
                    "</div>" +
                    "<div class='modal-body'></div>" +
                    "<div class='modal-footer'>" +
                        "<button data-dismiss='modal' type='button' class='btn btn-primary' data-return='true'>Sim</button>" +
                        "<button data-dismiss='modal' type='button' class='btn' data-return='false'>Não</button>" +
                    "</div>" +
                "</div>" +
            "</div>" +
        "</div>";

        $('body').append(html);
    }

    function _confirm(that, title, message) {
        var $this = this;
        //alert(obj);

        $('#message_box h4.modal-title').html($(this).data('title'));
        $('#message_box div.modal-body').html($(this).data('message'));
        $('#message_box').modal('show');

        $('#message_box .modal-footer button').unbind('click').on('click', function (e) {
            if ($(this).data('return') == true) {
                _action_clicked.call($this, that);
            }
        });
    }

    function _action_clicked(that) {
        that.element.find('.lcs-grid-content').addClass('lcs-grid-loading');
        that.element.find('div.lcs-grid-content table').css({ 'visibility': 'hidden' });

        var $action = this;
        var id = $(this).closest('tr').attr('id');
        var $span = $(this).closest('tr').find('td:first span.lcs-hidden');
        var $data = { 'controller': $(this).data('controller'), 'method': $(this).data('method') };
        var $option = []

        $option = new Object;
        $.each(that.data[id], function (i, $p) {
            if ($p.value) {
                $option[$p.field] = $p.value;
            }
        });


        $.ajax({
            url: "ctrl.php",
            data: $.extend(true, {}, $data, $option),
            type: 'get',
            success: function (json) {
                if ((typeof json) == 'string' && $($action).data('ajax') == undefined) {
                    window.location = json;
                }
                else {
                    message_box.call(that, json, 'success', $action);
                }
            },
            error: function (xhr, ajaxOptions, thrownError) {
                message_box.call(that, xhr.responseText, 'error', $action);
            }
        });
    }

    function pageData($o) {
        var $opt = this.element.find('div.lcs-grid-header-wrap table thead tr:nth-child(2) th');
        var that = this;
        this.element.find('div.lcs-grid-content table tbody tr').remove();
        var data = [];

        $.each($o.data, function (i, $p) {
            var $i = 0;
            var $html = "";
            that.tbody.append("<tr class='lcs-alt' id='" + i + "'></tr>");
            var $row = that.tbody.find(':last');

            $.each($opt, function (e, f) {
                var col = $(f).data('column');
                col = col.split('.');
                col = (col.length > 1) ? col[1] : col[0];
                var params = [];

                if ($i == 0) {
                    //alert(that.options.hiddens.toSource());
                    $.each(that.options.hiddens, function (i, item) {
                        //$html += "<span class='lcs-hidden " + item + "' data-value='" + $p[item] + "' data-field='" + item + "'></span>";

                        var p = item.split('.');
                        p = (p.length > 1) ? p[1] : p[0];
                        //console.log(p + ': ' + $p[p]);

                        params.push({ 'field': p, 'value': $p[p] });
                    });

                    if (params.length > 0) {
                        data[i] = params;
                    }
                }

                if (col !== '') {
                    if ($i == 0) {
                        if ($o.checkbox != undefined && $i == 0) {
                            var pch = [];
                            var ch = $($o.checkbox).data('param').split(',');

                            for (i = 0; i < ch.length; i++) {
                                pch.push({ 'field': ch[i], 'val': $p[i] });
                            }

                            $row.append("<td data-field='checkbox'><input type='checkbox' name='lcs-grid-checkbox[]' id='lcs-grid-checkbox[]' class='lcs-grid-checkbox' data-param='[" + pch.toString() + "]' /></td>");
                        }
                        else {
                            $row.append("<td>" + (($p[col] != 'null' && $p[col] != undefined) ? $p[col] : '') + "</td>");
                            //$row.append("<td style='" + (($o.style !== undefined) ? $o.style[$i] : '') + "'>" + (($p[col] != 'null' && $p[col] != undefined) ? $p[col] : '') + "</td>");
                        }
                        $i++;
                    }
                    else {
                        $row.append("<td>" + (($p[col] != 'null' && $p[col] != undefined) ? $p[col] : '') + "</td>");
                        //$row.append("<td style='" + (($o.style !== undefined) ? $o.style[$i] : '') + "'>" + (($p[col] != 'null' && $p[col] != undefined) ? $p[col] : '') + "</td>");
                        $i++;
                    }
                }
                else {
                    //console.log(action.get(0));
                    $row.append($("<td data-field='action'></td>").append(_actions.call(that)));
                }
            });
        });

        this.data = data;

        var $i = 0;
        $(this.tbody.find('a.lcs-action')).unbind().on('click' + namespace, function (ev) {
            var o = $(this).data('confirm');

            if (o == undefined) {
                _action_clicked.call(this, that);
            }
            else {
                _confirm.call(this, that);
            }
            //console.log('Indice: ' + $(this).data('controller') + "/" + $(this).data('method'));
        });

        this.element.find('.lcs-grid-content').removeClass('lcs-grid-loading');
        this.element.find('div.lcs-grid-content table').css({ 'visibility': 'visible' });
        this.start = ((new Date().getTime()) - that.start) / 1000;
    }

    function message_box(object, action, button) {
        var id = ((this.options.messageBox) ? this.options.messageBox : 'box_message');

        try {
            var objeto = JSON.parse(object);

            $('#' + id + ' h4.modal-title').html(objeto.title);
            $('#' + id + ' div.modal-body').html(objeto.message);
            $('#' + id).modal('show');
        }
        catch (ex) {
            $('#' + id).html(object);
        }

        if ($(button).data('remove') == true && action == 'success') {
            $(button).closest('tr').remove();
        }

        this.element.find('.lcs-grid-content').removeClass('lcs-grid-loading');
        this.element.find('div.lcs-grid-content table').css({ 'visibility': 'visible' });
    }

    function loadData() {
        var that = this;

        this.start = new Date().getTime();

        this.element.find('.lcs-grid-content').addClass('lcs-grid-loading');
        this.element.find('div.lcs-grid-content table').css({ 'visibility': 'hidden' });

        this.element._bgBusyAria(true).trigger("load" + namespace);

        //alert(that.options.post.toSource());

        if (this.options.ajax) {
            var request = getRequest.call(this), url = getUrl.call(this);

            ////alert("LCS: " + b.toSource());

            if (url == null || typeof url !== "string" || url.length === 0) {
                throw new Error("Url setting must be a none empty string or a function that returns one.");
            }

            // aborts the previous ajax request if not already finished or failed
            if (this.xqr) {
                this.xqr.abort();
            }

            var settings = {
                url: url,
                data: request,
                success: function (response) {
                    that.xqr = null;

                    if (typeof (response) === "string") {
                        response = $.parseJSON(response);
                    }

                    pageData.call(that, response);

                    _pageNumbers.call(that, response);

                    _filtering.call(that);

                    _buttons.call(that);

                    _select.call(that);

                    _menu_header.call(that);

                    //alert(response.toSource());
                    response = that.options.responseHandler(response);

                    that.current = response.current;
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    that.xqr = null;

                    if (textStatus !== "abort") {
                        that.element._bgBusyAria(false).trigger("loaded" + namespace);
                    }
                }
            };


            settings = $.extend(this.options.ajaxSettings, settings);

            replaceVal.call(this);
            //alert("LCS: " + this.options.ajaxSettings.data.toSource());
            //this.header = this.element.find('div.lcs-grid-header');

            this.xqr = $.ajax(settings);
        }
    }

    function init() {
        this.element.trigger("initialize" + namespace);
        this.start = new Date().getTime();
        appendBoxMessage();

        /*
        var $tr = this.header.find('table input, table select');
        //var $option = new Object;

        //this.header = this.element.find('div.lcs-grid-header');
        $.each($tr, function (i, o) {
            if ($(o).val() !== "")
            {
                alert($(o).attr('id')+': ' + $(o).val());
            }
        });

        this.header = this.element.find('div.lcs-grid-header');
        
        alert();*/

        loadData.call(this);

        this.element.trigger("initialized" + namespace);
    }

    var Grid = function (element, options) {
        this.element = $(element);
        this.tbody = this.element.find('.lcs-grid-content table tbody:last');
        this.header = this.element.find('div.lcs-grid-header');
        this.origin = this.element.clone();
        this.id = $(element).attr('id');
        this.options = $.extend(true, {}, Grid.defaults, this.element.data(), options);
        this.request;
        this.page_count = 0;
        this.page_current = 1;
        this.record_first = 0;
        this.record_last = 0;
        this.page_max = 10;
        this.records_count = 0;
        this.data = null;
        this.op = false;
        this.start = new Date().getTime();
        this.ordering = new Object;
        //this.actions = []
    };

    Grid.defaults = {
        padding: 2, // page padding (pagination)
        columnSelection: true,
        rowCount: [10, 25, 50, -1], // rows per page int or array of int (-1 represents "All")
        selection: false,
        multiSelect: false,
        rowSelect: false,
        keepSelection: false,
        highlightRows: false, // highlights new rows (find the page of the first new row)
        sorting: true,
        multiSort: false,
        messageBox: 'box_message',
        searchSettings: {
            delay: 250,
            characters: 1
        },
        ajax: false,
        ajaxSettings: {
            method: "POST"
        },
        post: {}, // or use function () { return {}; } (reserved properties are "current", "rowCount", "sort" and "searchPhrase")
        url: "", // or use function () { return ""; }
        requestHandler: function (request) { return request; },
        responseHandler: function (response) { return response; },
        labels: {
            all: "All",
            infos: " - número de atividades listadas",
            loading: "Carregando...",
            noResults: " Não encontrado! Verifique se não foi o filtro aplicado em sua pesquisa.",
            refresh: "Atualizar",
            search: "Search",
            Empty: ' ',
            full: ' '
        },
        statusMapping: {
            0: "success",
            1: "info",
            2: "warning",
            3: "danger"
        }
    };

    $.fn.extend({
        _bgAria: function (name, value) {
            return (value) ? this.attr("aria-" + name, value) : this.attr("aria-" + name);
        },

        _bgBusyAria: function (busy) {
            return (busy == null || busy) ? this._bgAria("busy", "true") : this._bgAria("busy", "false");
        },

        _bgRemoveAria: function (name) {
            return this.removeAttr("aria-" + name);
        },

        _bgEnableAria: function (enable) {
            return (enable == null || enable) ? this.removeClass("disabled")._bgAria("disabled", "false") : this.addClass("disabled")._bgAria("disabled", "true");
        },

        _bgEnableField: function (enable) {
            return (enable == null || enable) ? this.removeAttr("disabled") : this.attr("disabled", "disable");
        },

        _bgShowAria: function (show) {
            return (show == null || show) ? this.show()._bgAria("hidden", "false") : this.hide()._bgAria("hidden", "true");
        },

        _bgSelectAria: function (select) {
            return (select == null || select) ? this.addClass("active")._bgAria("selected", "true") : this.removeClass("active")._bgAria("selected", "false");
        },

        _bgId: function (id) {
            return (id) ? this.attr("id", id) : this.attr("id");
        }
    });

    //var old = $.fn.lcsgrid;

    $.fn.lcsgrid = function (option) {
        //console.log(arguments);
        var args = Array.prototype.slice.call(arguments, 1),
            returnValue = null,
            elements = this.each(function (index) {
                console.log(namespace);
                var $this = $(this),
                    instance = $this.data(namespace),
                    options = typeof option === "object" && option;

                if (!instance && option === "destroy") {
                    return;
                }
                if (!instance) {
                    console.log("Teste");
                    $this.data(namespace, (instance = new Grid(this, options)));
                    init.call(instance);
                }
                if (typeof option === "string") {
                    if (option.indexOf("get") === 0 && index === 0) {
                        returnValue = instance[option].apply(instance, args);
                    }
                    else if (option.indexOf("get") !== 0) {
                        return instance[option].apply(instance, args);
                    }
                }
            });
        return (typeof option === "string" && option.indexOf("get") === 0) ? returnValue : elements;
    };

})(jQuery, window);